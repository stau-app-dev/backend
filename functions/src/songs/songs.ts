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
      res.status(400).send({ error: 'Invalid parameters' })
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
      await db.collection('users').doc(creatorEmail).update({
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
    if (
      !songId ||
      typeof songId !== 'string' ||
      !upvotes ||
      typeof upvotes !== 'string'
    ) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const songDoc = await db.collection(NEW_SONGS_COLLECTION).doc(songId).get()

    if (!songDoc.exists) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
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
