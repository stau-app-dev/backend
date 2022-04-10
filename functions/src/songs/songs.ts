import { https } from 'firebase-functions'
import { db } from '../admin'
import { GENERIC_ERROR_MESSAGE, NEW_SONGS_COLLECTION } from '../data/consts'
import { Song } from '../models/songs'

export const getSongs = https.onRequest(async (req, res) => {
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

export const addSong = https.onRequest(async (req, res) => {
  try {
    const { artist, name, creatorEmail } = JSON.parse(req.body)
    if (!artist || !name || !creatorEmail) {
      throw new Error('Missing required parameters')
    }

    const song = {
      artist,
      name,
      creatorEmail,
      createdAt: new Date(),
      upvotes: 0,
    }

    await db.collection(NEW_SONGS_COLLECTION).add(song)

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

export const upvoteSong = https.onRequest(async (req, res) => {
  try {
    const { songId, upvotes } = req.query
    if (
      !songId ||
      typeof songId !== 'string' ||
      !upvotes ||
      typeof upvotes !== 'string'
    ) {
      throw new Error('Missing required parameters')
    }

    const songDoc = await db.collection(NEW_SONGS_COLLECTION).doc(songId).get()

    if (!songDoc.exists) {
      throw new Error('Song does not exist')
    }

    const song = songDoc.data() as Song

    await db
      .collection(NEW_SONGS_COLLECTION)
      .doc(songId)
      .update({
        upvotes: song.upvotes + parseInt(upvotes),
      })

    res.json({
      data: {
        message: 'Successfully upvoted song!',
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
