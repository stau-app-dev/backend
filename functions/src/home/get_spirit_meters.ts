import { https } from 'firebase-functions'
import * as admin from 'firebase-admin'
import { FIREBASE_URL, GENERIC_ERROR_MESSAGE } from '../data/consts'
import { SpiritMeters } from '../models/home'

export const getSpritMeters = https.onRequest(async (req, res) => {
  try {
    const firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: FIREBASE_URL,
    })
    const db = firebaseApp.firestore()
    const spiritMetersDoc = await db
      .collection('newSpiritMeters')
      .doc('spiritMeters')
      .get()

    const spiritMeters: SpiritMeters = spiritMetersDoc.data() as SpiritMeters
    res.json({
      data: spiritMeters,
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
