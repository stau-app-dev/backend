import { https } from 'firebase-functions'
import { credential, initializeApp } from 'firebase-admin'

const firebaseApp = initializeApp({
  credential: credential.applicationDefault(),
  databaseURL: 'https://staugustinechsapp.firebaseio.com',
})

export const deleteGmailUsersFromAuth = https.onRequest(async (req, res) => {
  try {
    res.json({
      data: {
        message: firebaseApp.name,
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
