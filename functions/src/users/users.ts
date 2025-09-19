import { https } from 'firebase-functions'
import { db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_USERS_COLLECTION,
  YCDSB_EMAIL,
} from '../data/consts'
import { User } from '../models/users'
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
// Get User
// ------------------------------
export const getUser = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { id, email, name } = req.query
      if (
        typeof id !== 'string' ||
        typeof email !== 'string' ||
        typeof name !== 'string'
      ) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      let userDoc = await db.collection(NEW_USERS_COLLECTION).doc(id).get()

      if (!userDoc.exists) {
        await addUserToDatabase(id, email, name)
        userDoc = await db.collection(NEW_USERS_COLLECTION).doc(id).get()
      }

      sendJson(req, res, 200, {
        data: {
          user: {
            id,
            ...userDoc.data(),
          },
        },
      })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})

// ------------------------------
// Add User to Database
// ------------------------------
const addUserToDatabase = async (id: string, email: string, name: string) => {
  try {
    const status = email.includes(YCDSB_EMAIL) ? 1 : 0
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newUserData: User = {
      badges: [],
      courses: [],
      clubs: [],
      email,
      lastSubmittedSong: oneDayAgo,
      msgTokens: [],
      name,
      notifications: [],
      picture: 0,
      showBadges: true,
      showCourses: true,
      status,
      songRequestCount: 1,
      songUpvoteCount: 3,
    }
    await db.collection(NEW_USERS_COLLECTION).doc(id).set(newUserData)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error(GENERIC_ERROR_MESSAGE)
    }
  }
}

// ------------------------------
// Update User Field
// ------------------------------
export const updateUserField = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { id, field, value } = JSON.parse(req.body)
      if (typeof id !== 'string' || typeof field !== 'string' || value === undefined) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      const userDoc = await db.collection(NEW_USERS_COLLECTION).doc(id).get()
      if (!userDoc.exists) {
        sendJson(req, res, 400, { error: 'Invalid parameters' })
        return
      }

      await db.collection(NEW_USERS_COLLECTION).doc(id).update({
        [field]: value,
      })

      sendJson(req, res, 200, {
        data: {
          user: {
            id,
            ...userDoc.data(),
            [field]: value,
          },
        },
      })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})

// ------------------------------
// Migrate User Fields
// ------------------------------
export const migrateUserFields = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
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

      sendJson(req, res, 200, {
        message: 'Migration completed successfully',
      })
    } catch (error) {
      sendJson(req, res, 500, {
        error: { message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE },
      })
    }
  })
})
