import { https } from 'firebase-functions'
import { get } from 'request-promise'
import { BIBLE_GATEWAY_SITE_URL, GENERIC_ERROR_MESSAGE } from '../data/consts'
import { load } from 'cheerio'
import { VerseOfDay } from '../models/home'
import * as cors from 'cors'

// CORS config – allow prod + localhost testing
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

export const getVerseOfDay = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const data: string = await get(BIBLE_GATEWAY_SITE_URL)
      const $ = load(data)

      const verseText = $('#verse-text').text().trim()
      const citation = $('span.citation').first().text().trim()

      // Combine into one string for the frontend (no changes needed there)
      const verseOfDay: VerseOfDay['verseOfDay'] = citation
        ? `${verseText} — ${citation}`
        : verseText

      // Explicitly set CORS headers (fix for Firefox iOS/WebKit)
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')

      res.json({
        data: {
          verseOfDay,
        },
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
