import { https } from 'firebase-functions'
import { db, cors } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_USERS_COLLECTION,
  YCDSB_EMAIL,
} from '../data/consts'
import { User } from '../models/users'

export const getUser = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { id, email, name } = req.query
      if (
        typeof id != 'string' ||
        typeof email != 'string' ||
        typeof name != 'string'
      ) {
        res.status(400).send({ error: 'Invalid parameters' })
        return
      }

      let userDocs = await db.collection(NEW_USERS_COLLECTION).doc(id).get()

      if (!userDocs.exists) {
        await addUserToDatabase(id, email, name)
        userDocs = await db.collection(NEW_USERS_COLLECTION).doc(id).get()
      }

      res.send({
        data: {
          user: {
            id,
            ...userDocs.data(),
          },
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
})

const addUserToDatabase = async (id: string, email: string, name: string) => {
  try {
    const status = email.includes(YCDSB_EMAIL) ? 1 : 0
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newUserData = {
      badges: [],
      courses: [],
      clubs: [],
      email: email,
      lastSubmittedSong: oneDayAgo,
      msgTokens: [],
      name: name,
      notifications: [],
      picture: 0,
      showBadges: true,
      showCourses: true,
      status: status,
      songRequestCount: 1,
      songUpvoteCount: 3,    
    } as User
    await db.collection(NEW_USERS_COLLECTION).doc(id).set(newUserData)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error(GENERIC_ERROR_MESSAGE)
    }
  }
}

export const updateUserField = https.onRequest(async (req, res) => {
  try {
    const { id, field, value } = JSON.parse(req.body)
    if (typeof id != 'string' || typeof field != 'string' || !value) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDocs = await db.collection(NEW_USERS_COLLECTION).doc(id).get()

    if (!userDocs.exists) {
      res.status(400).send({ error: 'Invalid parameters' })
    }

    await db
      .collection(NEW_USERS_COLLECTION)
      .doc(id)
      .update({
        [field]: value,
      })

    res.send({
      data: {
        user: {
          id,
          ...userDocs.data(),
          [field]: value,
        },
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

export const migrateUserFields = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const snapshot = await db.collection(NEW_USERS_COLLECTION).get()
      const batch = db.batch()

      snapshot.forEach((doc) => {
        const data = doc.data()
        const updates: Record<string, any> = {}

        if (data.songRequestCount === undefined) {
          updates.songRequestCount = 1
        }
        if (data.songUpvoteCount === undefined) {
          updates.songUpvoteCount = 3
        }

        if (Object.keys(updates).length > 0) {
          batch.update(doc.ref, updates)
        }
      })

      await batch.commit()

      res.send({
        message: 'Migration completed successfully',
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
