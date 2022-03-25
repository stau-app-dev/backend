import { https } from 'firebase-functions'
import { get } from 'request-promise'
import { STA_ANNOUNCEMENT_SITE_URL } from '../data/consts'

// NOTE: The site uses script injection, can't use cheerio or similar
export const getAnnouncements = https.onRequest(async (req, res) => {
  const startString = 'ancmnt = "'
  const endString = '".split(",");'
  const splitString = '$%-%$'
  try {
    const data = await get(STA_ANNOUNCEMENT_SITE_URL)
    const rawHTML = data.substring(
      data.indexOf(startString) + startString.length,
      data.indexOf(endString)
    )
    const decoded = decodeURIComponent(rawHTML)
    const announcements = decoded.split(',')
    const formatted = announcements.map((announcement) => {
      const [title, content] = announcement.split(splitString)
      return {
        title: title.trim(),
        content: content.trim(),
      }
    })
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
          message: 'An error occurred. Please try again later.',
        },
      })
    }
  }
})
