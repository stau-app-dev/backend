import { https } from 'firebase-functions'
import { admin, db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_SONGS_COLLECTION,
  NEW_USERS_COLLECTION,
} from '../data/consts'
import { Song } from '../models/songs'
import { User } from '../models/users'
import { containsProfanity } from './profanity'
import * as cors from 'cors'

// ------------------------------
// Centralized CORS Handler
// ------------------------------
const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true) // server-to-server, curl, etc.
    }

    // Allow production domain
    if (origin === 'https://staugustinechs.ca') {
      return callback(null, true)
    }

    // Allow any localhost (any port)
    if (origin.startsWith('http://localhost')) {
      return callback(null, true)
    }

    // Otherwise block
    return callback(new Error(`CORS not allowed for origin: ${origin}`))
  },
})

// ------------------------------
// Utility: send JSON with proper CORS echo
// ------------------------------
function sendJson(req: any, res: any, status: number, body: any) {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '')
  res.set('Vary', 'Origin') // ensures correct caching & CORS behavior
  res.status(status).json(body)
}

// ------------------------------
// Get Songs
// ------------------------------
export const getSongs = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const songDocs = await db
        .collection(NEW_SONGS_COLLECTION)
        .orderBy('upvotes', 'desc')
        .get()

      const songs: Song[] = songDocs.docs.map((doc) => {
        const data = doc.data()
        data.id = doc.id
        return data as Song
      }) as Song[]

      sendJson(req, res, 200, { data: songs })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})

// ------------------------------
// Add Song
// ------------------------------
export const addSong = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { artist, name, creatorEmail } = JSON.parse(req.body)

      if (!artist || !name || !creatorEmail) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      if (containsProfanity(artist) || containsProfanity(name)) {
        sendJson(req, res, 400, { error: 'Profanity not allowed in song name or artist' })
        return
      }

      const userDoc = await db
        .collection(NEW_USERS_COLLECTION)
        .where('email', '==', creatorEmail)
        .get()

      if (userDoc.empty) {
        sendJson(req, res, 404, { error: 'User not found' })
        return
      }

      const userId = userDoc.docs[0].id
      const user = userDoc.docs[0].data() as User
      const lastSubmittedSong = user.lastSubmittedSong as any

      if (Date.now() - 24 * 60 * 60 * 1000 < lastSubmittedSong.toDate()) {
        sendJson(req, res, 400, {
          error: 'You can only submit a song once every 24 hours',
        })
        return
      }

      const song: Song = {
        artist,
        name,
        creatorEmail,
        createdAt: new Date(),
        upvotes: 0,
      }

      await Promise.all([
        db.collection(NEW_SONGS_COLLECTION).add(song),
        db.collection(NEW_USERS_COLLECTION).doc(userId).update({
          lastSubmittedSong: new Date(),
        }),
      ])

      sendJson(req, res, 200, { data: { message: 'Successfully added song!', song } })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})

// ------------------------------
// Delete Song
// ------------------------------
export const deleteSong = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { id } = JSON.parse(req.body)
      if (!id) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      await db.collection(NEW_SONGS_COLLECTION).doc(id).delete()
      sendJson(req, res, 200, { data: { message: 'Successfully deleted song!' } })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})

// ------------------------------
// Upvote Song
// ------------------------------
export const upvoteSong = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { songId, upvotes } = req.query
      if (typeof songId !== 'string' || typeof upvotes !== 'string') {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      const songDoc = db.collection(NEW_SONGS_COLLECTION).doc(songId)
      await songDoc.update({
        upvotes: admin.firestore.FieldValue.increment(parseInt(upvotes)),
      })

      sendJson(req, res, 200, { data: { message: 'Successfully upvoted song!' } })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})

// ------------------------------
// Add Song (New Version)
// ------------------------------
export const addSongNew = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { artist, name, creatorEmail } = JSON.parse(req.body)

      if (!artist || !name || !creatorEmail) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      if (containsProfanity(artist) || containsProfanity(name)) {
        sendJson(req, res, 400, { error: 'Profanity not allowed in song name or artist' })
        return
      }

      const userDoc = await db
        .collection(NEW_USERS_COLLECTION)
        .where('email', '==', creatorEmail)
        .get()

      if (userDoc.empty) {
        sendJson(req, res, 404, { error: 'User not found' })
        return
      }

      const userId = userDoc.docs[0].id
      const user = userDoc.docs[0].data() as User

      if (!user.songRequestCount || user.songRequestCount <= 0) {
        sendJson(req, res, 400, { error: 'No song requests left' })
        return
      }

      const song: Song = {
        artist,
        name,
        creatorEmail,
        createdAt: new Date(),
        upvotes: 0,
      }

      await Promise.all([
        db.collection(NEW_SONGS_COLLECTION).add(song),
        db.collection(NEW_USERS_COLLECTION).doc(userId).update({
          lastSubmittedSong: new Date(),
          songRequestCount: admin.firestore.FieldValue.increment(-1),
        }),
      ])

      sendJson(req, res, 200, { data: { message: 'Successfully added song!', song } })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})

// ------------------------------
// Upvote Song (New Version)
// ------------------------------
export const upvoteSongNew = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { songId, userEmail } = JSON.parse(req.body)
      if (!songId || !userEmail) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      const userDoc = await db
        .collection(NEW_USERS_COLLECTION)
        .where('email', '==', userEmail)
        .get()

      if (userDoc.empty) {
        sendJson(req, res, 404, { error: 'User not found' })
        return
      }

      const userId = userDoc.docs[0].id
      const user = userDoc.docs[0].data() as User

      if (!user.songUpvoteCount || user.songUpvoteCount <= 0) {
        sendJson(req, res, 400, { error: 'No upvotes left' })
        return
      }

      const songDoc = db.collection(NEW_SONGS_COLLECTION).doc(songId)
      await Promise.all([
        songDoc.update({ upvotes: admin.firestore.FieldValue.increment(1) }),
        db.collection(NEW_USERS_COLLECTION).doc(userId).update({
          songUpvoteCount: admin.firestore.FieldValue.increment(-1),
        }),
      ])

      sendJson(req, res, 200, { data: { message: 'Successfully upvoted song!' } })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})
