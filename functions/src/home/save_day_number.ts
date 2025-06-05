import { pubsub } from 'firebase-functions'
import { get } from 'request-promise'
import { GENERIC_ERROR_MESSAGE, STA_DAY_NUMBER_SITE_URL } from '../data/consts'
import { DayNumber } from '../models/home'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}
const db = admin.firestore()

export const getDayNumberAndSave = pubsub.schedule('0 2 * * *') // 2 AM
  .timeZone('America/Toronto') // EST/EDT (handles daylight saving automatically)
  .onRun(async (context) => {
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
          data.lastIndexOf(searchString) + searchString.length + 2
        )
      )

      await db.collection('newDayNumber').doc('day12').set({ dayNumber })

      console.log(`Saved day number ${dayNumber} at 2 AM`)
    } catch (error) {
      const message = error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE
      console.error('Error saving day number:', message)
    }
  })

