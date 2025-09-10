import { https } from 'firebase-functions'
import { db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_SPIRIT_METERS_COLLECTION,
} from '../data/consts'
import { SpiritMeters } from '../models/home'
import * as cors from 'cors'

// Reuse the same CORS config
const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    if (
      origin === 'https://staugustinechs.ca' ||
      origin.startsWith('http://localhost')
    ) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
})

export const getSpiritMeters = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const spiritMetersDoc = await db
        .collection(NEW_SPIRIT_METERS_COLLECTION)
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
})
