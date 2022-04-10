import { https } from 'firebase-functions'
import { db } from '../admin'
import { GENERIC_ERROR_MESSAGE, NEW_USERS_COLLECTION } from '../data/consts'

export const checkIfUserExists = https.onRequest(async (req, res) => {
  try {
    const { userId, email, msgToken, name } = req.query
    if (
      typeof userId != 'string' ||
      typeof email != 'string' ||
      typeof msgToken != 'string' ||
      typeof name != 'string'
    ) {
      res
        .status(400)
        .send({ error: 'Invalid userId, email, msgToken, or name' })
      return
    }

    const userDocs = await db.collection(NEW_USERS_COLLECTION).doc(userId).get()

    if (!userDocs.exists) {
      await addUserToDatabase(userId, email, msgToken, name)
      res.send({
        data: {
          message: 'User does not exist. Added to database.',
        },
      })
    }

    res.json({
      data: {
        message: 'User exists',
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

const addUserToDatabase = async (
  userId: string,
  email: string,
  msgToken: string,
  name: string
) => {
  try {
    const status = email.includes('@ycdsb.ca') ? 1 : 0
    const newUserData = {
      badges: [],
      courses: [],
      clubs: [],
      email: email,
      msgToken: msgToken,
      name: name,
      notifications: [],
      picture: 0,
      showBadges: true,
      showCourses: true,
      status: status,
    }
    await db.collection(NEW_USERS_COLLECTION).doc(userId).set(newUserData)
  } catch (error) {
    throw error
  }
}
