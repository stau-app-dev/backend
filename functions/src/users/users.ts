import { https } from 'firebase-functions'
import { db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_USERS_COLLECTION,
  YCDSB_EMAIL,
} from '../data/consts'
import { User } from '../models/users'

export const getUser = https.onRequest(async (req, res) => {
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

const addUserToDatabase = async (id: string, email: string, name: string) => {
  try {
    const status = email.includes(YCDSB_EMAIL) ? 1 : 0
    const newUserData = {
      badges: [],
      courses: [],
      clubs: [],
      email: email,
      msgTokens: [],
      name: name,
      notifications: [],
      picture: 0,
      showBadges: true,
      showCourses: true,
      status: status,
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
    const { id, field, value } = req.body
    if (
      typeof id != 'string' ||
      typeof field != 'string' ||
      typeof value != 'string'
    ) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDocs = await db.collection(NEW_USERS_COLLECTION).doc(id).get()

    if (!userDocs.exists) {
      throw new Error('User does not exist')
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
