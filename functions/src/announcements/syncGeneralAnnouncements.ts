import { https } from 'firebase-functions'
import { get } from 'request-promise'
import * as admin from 'firebase-admin'
import {
  GENERIC_ERROR_MESSAGE,
  STA_ANNOUNCEMENT_SITE_URL,
} from '../data/consts'
import { GeneralAnnouncement } from '../models/announcements'

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

export const syncGeneralAnnouncements = https.onRequest(async (req, res) => {
  const startString = 'ancmnt = "'
  const endString = '".split(",");'
  const splitString = '$%-%$'
  const collectionName = 'newGeneralAnnouncements'

  try {
    // Fetch the HTML content
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
      // Clear collection if there are no valid announcements
      const snapshot = await db.collection(collectionName).get()
      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete())
      await Promise.all(deletePromises)

      res.json({ message: 'No announcements today. Collection cleared.' })
      return
    }

    // Parse the announcements
    const formatted: GeneralAnnouncement[] = announcements.map((htmlAnnouncement) => {
      const announcement = decodeURIComponent(htmlAnnouncement)
      const [title, content] = announcement.split(splitString)
      return {
        title: title.trim(),
        content: content.trim(),
      }
    })

    // Clear the existing collection
    const snapshot = await db.collection(collectionName).get()
    const deletePromises = snapshot.docs.map((doc) => doc.ref.delete())
    await Promise.all(deletePromises)

    // Write new announcements
    const writePromises = formatted.map((announcement) =>
      db.collection(collectionName).add(announcement)
    )
    await Promise.all(writePromises)

    res.json({ message: 'Announcements synced successfully.' })
  } catch (error) {
    console.error('Error syncing announcements:', error)
    const message = error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE
    res.status(500).json({ error: { message } })
  }
})

