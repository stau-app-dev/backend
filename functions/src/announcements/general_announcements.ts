import { https } from 'firebase-functions'
import { get } from 'request-promise'
import * as cors from 'cors'
import {
  GENERIC_ERROR_MESSAGE,
  STA_ANNOUNCEMENT_SITE_URL,
} from '../data/consts'
import { GeneralAnnouncement } from '../models/announcements'

// Shared CORS config
const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true) // allow curl, server-to-server
    }
    if (origin === 'https://staugustinechs.ca') {
      return callback(null, true)
    }
    if (origin.startsWith('http://localhost')) {
      return callback(null, true)
    }
    return callback(new Error(`CORS not allowed for origin: ${origin}`))
  }
})

export const getGeneralAnnouncements = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const startString = 'ancmnt = "'
    const endString = '".split(",");'
    const splitString = '$%-%$'

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
      console.log('announcements: ', announcements)

      if (
        announcements.length === 0 ||
        (announcements.length === 1 &&
          announcements[0].toLowerCase().trim() === 'no announcements today')
      ) {
        res.set('Access-Control-Allow-Origin', req.headers.origin || '')
        res.json({ data: [] })
        return
      }

      const formatted: GeneralAnnouncement[] = announcements.map((htmlAnnouncement) => {
        const announcement = decodeURIComponent(htmlAnnouncement)
        const [title, content] = announcement.split(splitString)
        return {
          title: title.trim(),
          content: content.trim(),
        }
      })

      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.json({ data: formatted })
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: { message: error.message } })
      } else {
        res.status(500).json({ error: { message: GENERIC_ERROR_MESSAGE } })
      }
    }
  })
})

export const getAnnouncementFormUrl = https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    const formUrl =
      'https://docs.google.com/forms/d/e/1FAIpQLSeZ7HIVHTsd5wMjx2heWPwXd92RDmtAhY4wcaK-Gj-7cLrWXA/viewform'

    res.json({
      data: {
        formUrl,
      },
    })
  })
})
