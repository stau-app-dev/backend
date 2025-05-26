import { https } from 'firebase-functions'
import { get } from 'request-promise'
import { GENERIC_ERROR_MESSAGE, STA_DAY_NUMBER_SITE_URL } from '../data/consts'
import { DayNumber } from '../models/home'
import { cors } from '../admin'

export const getDayNumber = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    const searchString = 'Day '
    try {
      const data: string = await get(STA_DAY_NUMBER_SITE_URL)
      const dayNumber: DayNumber['dayNumber'] = parseInt(
        data.substring(
          data.lastIndexOf(searchString) + searchString.length,
          data.lastIndexOf(searchString) + searchString.length + 1
        )
      )
      res.json({
        data: {
          dayNumber,
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