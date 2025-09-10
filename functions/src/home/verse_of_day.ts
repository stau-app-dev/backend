import { https } from 'firebase-functions'
import { get } from 'request-promise'
import { BIBLE_GATEWAY_SITE_URL, GENERIC_ERROR_MESSAGE } from '../data/consts'
import { load } from 'cheerio'
import { VerseOfDay } from '../models/home'
import * as cors from 'cors'

// CORS config – allow prod site + localhost (any port)
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

export const getVerseOfDay = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const data: string = await get(BIBLE_GATEWAY_SITE_URL)
      const $ = load(data)
      const verseOfDay: VerseOfDay['verseOfDay'] = $('#verse-text').text()

      res.json({
        data: {
          verseOfDay,
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
})
