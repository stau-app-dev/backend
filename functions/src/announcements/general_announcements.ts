import { https } from 'firebase-functions'
import { get } from 'request-promise'
import {
  GENERIC_ERROR_MESSAGE,
  STA_ANNOUNCEMENT_SITE_URL,
} from '../data/consts'
import { GeneralAnnouncement } from '../models/announcements'

// NOTE: The site uses script injection, can't use cheerio or similar
export const getGeneralAnnouncements = https.onRequest(async (req, res) => {
  const startString = 'ancmnt = "'
  const endString = '".split(",");'
  const splitString = '$%-%$'
  try {
    const data: string = await get(STA_ANNOUNCEMENT_SITE_URL)
    const rawHTML = data.substring(
      data.indexOf(startString) + startString.length,
      data.indexOf(endString)
    )
    const announcements = rawHTML.split(',')
    const formatted: GeneralAnnouncement[] = announcements.map(
      (htmlAnnouncement) => {
        const announcement = decodeURIComponent(htmlAnnouncement)
        const [title, content] = announcement.split(splitString)
        return {
          title: title.trim(),
          content: content.trim(),
        }
      }
    )
    res.json({
      data: formatted,
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
