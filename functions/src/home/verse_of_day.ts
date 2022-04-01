import { https } from 'firebase-functions'
import { get } from 'request-promise'
import { BIBLE_GATEWAY_SITE_URL, GENERIC_ERROR_MESSAGE } from '../data/consts'
import { load } from 'cheerio'
import { VerseOfDay } from '../models/home'

export const getVerseOfDay = https.onRequest(async (req, res) => {
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
