import * as admin from 'firebase-admin'
import {
  ALLOWED_EMAILS,
  FIREBASE_URL,
  GENERIC_ERROR_MESSAGE,
} from '../data/consts'
import { https } from 'firebase-functions'

export const deleteNonValidEmailDomains = https.onRequest(async (req, res) => {
  try {
    const firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: FIREBASE_URL,
    })
    const auth = firebaseApp.auth()
    let nextPageToken
    let users = await auth.listUsers(1000, nextPageToken)
    const results = []

    // We have under 2000 users
    for (let i = 0; i < 2; i++) {
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
      nextPageToken = users.pageToken
      users = await auth.listUsers(1000, nextPageToken)
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
          message: GENERIC_ERROR_MESSAGE,
        },
      })
    }
  }
})
