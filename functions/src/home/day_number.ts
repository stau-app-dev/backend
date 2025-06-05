import { https } from 'firebase-functions'
import { get } from 'request-promise'
import { GENERIC_ERROR_MESSAGE, STA_DAY_NUMBER_SITE_URL } from '../data/consts'
import { DayNumber } from '../models/home'

export const getDayNumber = https.onRequest(async (req, res) => {
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

