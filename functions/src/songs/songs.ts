import { https } from 'firebase-functions'
import { admin, db, cors } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_SONGS_COLLECTION,
  NEW_USERS_COLLECTION,
} from '../data/consts'
import { Song } from '../models/songs'
import { User } from '../models/users'

export const getSongs = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const songDocs = await db
        .collection(NEW_SONGS_COLLECTION)
        .orderBy('upvotes', 'desc')
        .get()

      const songs: Song[] = songDocs.docs.map((doc) => {
        var data = doc.data()
        data.id = doc.id
        return data as Song
      }) as Song[]

      res.json({
        data: songs,
      })
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: {
            message: error.message,
          },
        })
      } else {
        res.status(500).json({
          error: {
            message: GENERIC_ERROR_MESSAGE,
          },
        })
      }
    }
  })
})

export const addSong = https.onRequest(async (req, res) => {
  try {
    const { artist, name, creatorEmail } = JSON.parse(req.body)
    if (!artist || !name || !creatorEmail) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db
      .collection(NEW_USERS_COLLECTION)
      .where('email', '==', creatorEmail)
      .get()

    if (userDoc.empty) {
      res.status(404).send({ error: 'User not found' })
      return
    }
    const userId = userDoc.docs[0].id
    const user = userDoc.docs[0].data() as User
    const lastSubmittedSong = user.lastSubmittedSong as any

    if (Date.now() - 24 * 60 * 60 * 1000 < lastSubmittedSong.toDate()) {
      res
        .status(400)
        .send({ error: 'You can only submit a song once every 24 hours' })
      return
    }

    const song = {
      artist,
      name,
      creatorEmail,
      createdAt: new Date(),
      upvotes: 0,
    } as Song

    await Promise.all([
      await db.collection(NEW_SONGS_COLLECTION).add(song),
      await db.collection(NEW_USERS_COLLECTION).doc(userId).update({
        lastSubmittedSong: new Date(),
      }),
    ])

    res.json({
      data: {
        message: 'Successfully added song!',
        song: song,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        error: {
          message: error.message,
        },
      })
    } else {
      res.status(500).json({
        error: {
          message: GENERIC_ERROR_MESSAGE,
        },
      })
    }
  }
})

export const deleteSong = https.onRequest(async (req, res) => {
  try {
    const { id } = JSON.parse(req.body)
    if (!id) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    await db.collection(NEW_SONGS_COLLECTION).doc(id).delete()

    res.json({
      data: {
        message: 'Successfully deleted song!',
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        error: {
          message: error.message,
        },
      })
    } else {
      res.status(500).json({
        error: {
          message: GENERIC_ERROR_MESSAGE,
        },
      })
    }
  }
})

export const upvoteSong = https.onRequest(async (req, res) => {
  try {
    const { songId, upvotes } = req.query
    if (typeof songId !== 'string' || typeof upvotes !== 'string') {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const songDoc = db.collection(NEW_SONGS_COLLECTION).doc(songId)

    await songDoc.update({
      upvotes: admin.firestore.FieldValue.increment(parseInt(upvotes)),
    })

    res.json({
      data: {
        message: 'Successfully upvoted song!',
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        error: {
          message: error.message,
        },
      })
    } else {
      res.status(500).json({
        error: {
          message: GENERIC_ERROR_MESSAGE,
        },
      })
    }
  }
})
