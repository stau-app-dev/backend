import { https } from 'firebase-functions'
import { get } from 'request-promise'
import * as cors from 'cors'
import { GENERIC_ERROR_MESSAGE, STA_DAY_NUMBER_SITE_URL } from '../data/consts'
import { DayNumber } from '../models/home'
import { db } from '../admin'

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

export const getDayNumber = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const searchString = 'Day '
    try {
      const data: string = await get({
        uri: STA_DAY_NUMBER_SITE_URL,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0',
        },
      })

      const dayNumber: DayNumber['dayNumber'] = parseInt(
        data.substring(
          data.lastIndexOf(searchString) + searchString.length,
          data.lastIndexOf(searchString) + searchString.length + 1
        )
      )

      // Always reflect back the calling origin
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.json({ data: { dayNumber } })
    } catch (error) {
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      if (error instanceof Error) {
        res.status(500).json({ error: { message: error.message } })
      } else {
        res.status(500).json({ error: { message: GENERIC_ERROR_MESSAGE } })
      }
    }
  })
})

export const getDayNumberNew = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const docRef = db.collection('newDayNumber').doc('day12')
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error('Day number not found')
      }

      const data = doc.data() as { dayNumber?: unknown } | undefined
      const raw =
        data && typeof data.dayNumber !== 'undefined' ? data.dayNumber : null
      const dayNumber: DayNumber['dayNumber'] =
        typeof raw === 'number'
          ? raw
          : raw === null
          ? null
          : parseInt(String(raw), 10)

      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.json({ data: { dayNumber } })
    } catch (error) {
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.status(500).json({
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
    }
  })
})
