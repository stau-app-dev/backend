import { pubsub } from 'firebase-functions'
import { get } from 'request-promise'
import * as admin from 'firebase-admin'
import {
  STA_ANNOUNCEMENT_SITE_URL
} from '../data/consts'
import { GeneralAnnouncement } from '../models/announcements'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

export const syncGeneralAnnouncements2am = pubsub
  .schedule('0 2 * * *') // This is 2:00 AM UTC by default
  .timeZone('America/Toronto') // Ensures it's 2:00 AM EST/EDT
  .onRun(async () => {
    const startString = 'ancmnt = "'
    const endString = '".split(",");'
    const splitString = '$%-%$'
    const collectionName = 'newGeneralAnnouncements'

    try {
      const data: string = await get({
        uri: STA_ANNOUNCEMENT_SITE_URL,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0'
        }
      })
      const rawHTML = data.substring(
        data.indexOf(startString) + startString.length,
        data.indexOf(endString)
      )

      const announcements = rawHTML.split(',')

      if (
        announcements.length === 0 ||
        (announcements.length === 1 &&
          announcements[0].toLowerCase().trim() === 'no announcements today')
      ) {
        const snapshot = await db.collection(collectionName).get()
        const deletePromises = snapshot.docs.map((doc) => doc.ref.delete())
        await Promise.all(deletePromises)

        console.log('No announcements today. Collection cleared.')
        return null
      }

      const formatted: GeneralAnnouncement[] = announcements.map((htmlAnnouncement) => {
        const announcement = decodeURIComponent(htmlAnnouncement)
        const [title, content] = announcement.split(splitString)
        return {
          title: title.trim(),
          content: content.trim(),
        }
      })

      const snapshot = await db.collection(collectionName).get()
      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete())
      await Promise.all(deletePromises)

      const writePromises = formatted.map((announcement) =>
        db.collection(collectionName).add(announcement)
      )
      await Promise.all(writePromises)

      console.log('Announcements synced successfully.')
      return null
    } catch (error) {
      console.error('Error syncing announcements:', error)
      return null
    }
  })

