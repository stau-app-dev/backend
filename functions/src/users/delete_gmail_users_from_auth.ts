import { https } from 'firebase-functions'
import { credential, initializeApp } from 'firebase-admin'
import { ALLOWED_EMAILS } from '../data/consts'

// const db = firestore(firebaseApp)
// const users = await db.collection('users').get()

export const deleteNonValidEmailDomains = https.onRequest(async (req, res) => {
  try {
    const firebaseApp = initializeApp({
      credential: credential.applicationDefault(),
      databaseURL: 'https://staugustinechsapp.firebaseio.com',
    })

    const auth = firebaseApp.auth()
    const users = await auth.listUsers()

    const results = []

    for (const user of users.users) {
      if (
        !user.email!.endsWith('@ycdsbk12.ca') &&
        !user.email!.endsWith('@ycdsb.ca') &&
        !ALLOWED_EMAILS.includes(user.email!)
      ) {
        await auth.deleteUser(user.uid)
        results.push(user.email)
      }
    }

    res.json({
      data: {
        results,
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
          message: 'An error occurred. Please try again later.',
        },
      })
    }
  }
})
