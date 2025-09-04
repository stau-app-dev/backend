import { https } from 'firebase-functions'
import { get } from 'request-promise'
import * as cors from 'cors'
import { GENERIC_ERROR_MESSAGE, STA_DAY_NUMBER_SITE_URL } from '../data/consts'
import { DayNumber } from '../models/home'

// Allow requests only from your domain
const corsHandler = cors({ origin: 'https://staugustinechs.ca' })

export const getDayNumber = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const searchString = 'Day '
    try {
      const data: string = await get({
        uri: STA_DAY_NUMBER_SITE_URL,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0'
        }
      })

      const dayNumber: DayNumber['dayNumber'] = parseInt(
        data.substring(
          data.lastIndexOf(searchString) + searchString.length,
          data.lastIndexOf(searchString) + searchString.length + 1
        )
      )

      res.set('Access-Control-Allow-Origin', 'https://staugustinechs.ca')
      res.json({ data: { dayNumber } })
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: { message: error.message } })
      } else {
        res.status(500).json({ error: { message: GENERIC_ERROR_MESSAGE } })
      }
    }
  })
})
