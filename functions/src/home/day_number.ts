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

    if (origin.endsWith('.app.github.dev')) {
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
      // Resolve the document ID (Date). Allow override via query/body; default to today's date in Toronto.
      const dateFromQuery =
        typeof req.query.date === 'string' && req.query.date.trim().length > 0
          ? req.query.date.trim()
          : undefined
      const dateFromBody =
        req.body &&
        typeof req.body.date === 'string' &&
        req.body.date.trim().length > 0
          ? req.body.date.trim()
          : undefined

      const docId =
        dateFromQuery ||
        dateFromBody ||
        new Date().toLocaleDateString('en-CA', {
          timeZone: 'America/Toronto',
        }) // YYYY-MM-DD

      const docRef = db.collection('newDayOneTwo').doc(docId)
      const doc = await docRef.get()

      if (!doc.exists) {
        res.set('Access-Control-Allow-Origin', req.headers.origin || '')
        res.set('Vary', 'Origin')
        res.status(404).json({
          error: { message: `Day number not found for date ${docId}` },
        })
        return
      }

      const data = doc.data() as { Day?: unknown; Date?: unknown } | undefined
      const raw = data?.Day

      const parsed =
        typeof raw === 'number'
          ? raw
          : raw == null
          ? null
          : (() => {
              const n = parseInt(String(raw), 10)
              return Number.isNaN(n) ? null : n
            })()

      const dayNumber: DayNumber['dayNumber'] = parsed

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
