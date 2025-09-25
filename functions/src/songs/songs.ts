import { https } from 'firebase-functions'
import { pubsub } from 'firebase-functions' // add this import if not already at the top
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
// Get Songs (New, Auth via UUID)
// ------------------------------
export const getSongsNew = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      let userUuid: string | undefined
      if (req.method === 'GET') {
        userUuid = (req.query.userUuid as string) || undefined
      } else {
        try {
          const parsed = JSON.parse(req.body || '{}')
          userUuid = parsed.userUuid
        } catch {
          // ignore parse errors; will fail validation below
        }
      }

      if (!userUuid) {
        sendJson(req, res, 400, { error: 'userUuid required' })
        return
      }

      const userSnap = await db
        .collection(NEW_USERS_COLLECTION)
        .doc(userUuid)
        .get()
      if (!userSnap.exists) {
        sendJson(req, res, 404, { error: 'User not found' })
        return
      }

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
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
    }
  })
})

// ------------------------------
// Delete Song (New - Auth via UUID)
// ------------------------------
export const deleteSongNew = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { songId, userUuid } = JSON.parse(req.body || '{}')
      if (!songId || !userUuid) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      // Validate user exists
      const userSnap = await db
        .collection(NEW_USERS_COLLECTION)
        .doc(userUuid)
        .get()
      if (!userSnap.exists) {
        sendJson(req, res, 404, { error: 'User not found' })
        return
      }

      const songRef = db.collection(NEW_SONGS_COLLECTION).doc(songId)
      const songSnap = await songRef.get()
      if (!songSnap.exists) {
        sendJson(req, res, 404, { error: 'Song not found' })
        return
      }

      // Ownership check intentionally removed: any authenticated user may delete a song.

      await songRef.delete()
      sendJson(req, res, 200, {
        data: { message: 'Successfully deleted song!' },
      })
    } catch (error) {
      sendJson(req, res, 500, {
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
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
      const { artist, name, creatorUuid } = JSON.parse(req.body)

      if (!artist || !name || !creatorUuid) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      if (containsProfanity(artist) || containsProfanity(name)) {
        sendJson(req, res, 400, {
          error: 'Profanity not allowed in song name or artist',
        })
        return
      }

      const userSnap = await db
        .collection(NEW_USERS_COLLECTION)
        .doc(creatorUuid)
        .get()
      if (!userSnap.exists) {
        sendJson(req, res, 404, { error: 'User not found' })
        return
      }

      const user = userSnap.data() as User
      if (!user.songRequestCount || user.songRequestCount <= 0) {
        sendJson(req, res, 400, { error: 'No song requests left' })
        return
      }

      const song: Song = {
        artist,
        name,
        creatorEmail: (user as any).email || '',
        createdAt: new Date(),
        upvotes: 0,
        // @ts-ignore augmenting for internal reference
        creatorUuid,
      }

      await Promise.all([
        db.collection(NEW_SONGS_COLLECTION).add(song),
        db
          .collection(NEW_USERS_COLLECTION)
          .doc(creatorUuid)
          .update({
            lastSubmittedSong: new Date(),
            songRequestCount: admin.firestore.FieldValue.increment(-1),
          }),
      ])

      sendJson(req, res, 200, {
        data: { message: 'Successfully added song!', song },
      })
    } catch (error) {
      sendJson(req, res, 500, {
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
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
      const { songId, userUuid } = JSON.parse(req.body)
      if (!songId || !userUuid) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      const userSnap = await db
        .collection(NEW_USERS_COLLECTION)
        .doc(userUuid)
        .get()
      if (!userSnap.exists) {
        sendJson(req, res, 404, { error: 'User not found' })
        return
      }

      const user = userSnap.data() as User
      if (!user.songUpvoteCount || user.songUpvoteCount <= 0) {
        sendJson(req, res, 400, { error: 'No upvotes left' })
        return
      }

      const songDoc = db.collection(NEW_SONGS_COLLECTION).doc(songId)
      await Promise.all([
        songDoc.update({ upvotes: admin.firestore.FieldValue.increment(1) }),
        db
          .collection(NEW_USERS_COLLECTION)
          .doc(userUuid)
          .update({
            songUpvoteCount: admin.firestore.FieldValue.increment(-1),
          }),
      ])

      sendJson(req, res, 200, {
        data: { message: 'Successfully upvoted song!' },
      })
    } catch (error) {
      sendJson(req, res, 500, {
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
    }
  })
})

// ------------------------------
// Delete All Songs (scheduled)
// So that a new week of voting can begin
// ------------------------------
export const deleteAllSongs = pubsub
  .schedule('40 2 * * 0') // Every Sunday at 2:40 AM
  .timeZone('America/Toronto')
  .onRun(async () => {
    try {
      const snapshot = await db.collection(NEW_SONGS_COLLECTION).get()
      const batch = db.batch()

      snapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })

      if (!snapshot.empty) {
        await batch.commit()
        console.log(`deleteAllSongs: Deleted ${snapshot.size} songs.`)
      } else {
        console.log('deleteAllSongs: No songs to delete.')
      }
    } catch (error) {
      console.error(
        'deleteAllSongs failed',
        error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE
      )
    }
    return null
  })

// ------------------------------
// Deprecated getSongs
// ------------------------------
export const getSongs = https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    sendJson(req, res, 200, { message: 'Download the new version of the app' })
  })
})

// ------------------------------
// Deprecated deleteSong
// ------------------------------
export const deleteSong = https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    sendJson(req, res, 200, { message: 'Download the new version of the app' })
  })
})

// ------------------------------
// Deprecated addSong
// ------------------------------
export const addSong = https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    sendJson(req, res, 200, { message: 'Download the new version of the app' })
  })
})

// ------------------------------
// Deprecated upvoteSong
// ------------------------------
export const upvoteSong = https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    sendJson(req, res, 200, { message: 'Download the new version of the app' })
  })
})
