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
  }
})

export const getSpiritMeters = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const spiritMetersDoc = await db
        .collection(NEW_SPIRIT_METERS_COLLECTION)
        .doc('spiritMeters')
        .get()

      const spiritMeters: SpiritMeters = spiritMetersDoc.data() as SpiritMeters

      // Add explicit CORS headers
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')

      res.json({
        data: spiritMeters,
      })
    } catch (error) {
      res.status(500).json({
        error: {
          message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
    }
  })
})
