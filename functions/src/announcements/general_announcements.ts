import { https } from 'firebase-functions'
import { get } from 'request-promise'
import * as cors from 'cors'
import {
  GENERIC_ERROR_MESSAGE,
  STA_ANNOUNCEMENT_SITE_URL,
} from '../data/consts'
import { GeneralAnnouncement } from '../models/announcements'
import { db, admin } from '../admin'

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
  },
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
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0',
        },
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
        res.set('Access-Control-Allow-Origin', req.headers.origin || '')
        res.set('Vary', 'Origin')
        res.json({ data: [] })
        return
      }

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

      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.json({ data: formatted })
    } catch (error) {
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.status(500).json({
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
    }
  })
})

export const getGeneralAnnouncementsNew = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('newGeneralAnnouncements').get()

      const now = admin.firestore.Timestamp.now()
      // Build a function to compute a YYYY-MM-DD key in America/Toronto
      const torontoFmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Toronto',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      const toDateKey = (
        ts: admin.firestore.Timestamp | null
      ): string | null => {
        if (!ts) return null
        const d = ts.toDate()
        const parts = torontoFmt.formatToParts(d)
        const year = parts.find((p) => p.type === 'year')?.value
        const month = parts.find((p) => p.type === 'month')?.value
        const day = parts.find((p) => p.type === 'day')?.value
        if (!year || !month || !day) return null
        return `${year}-${month}-${day}`
      }
      const todayKey = toDateKey(now)

      const toTimestamp = (value: any): admin.firestore.Timestamp | null => {
        if (!value) return null
        // Already a Firestore Timestamp
        if (value instanceof admin.firestore.Timestamp) return value
        // Try Firestore-like object
        if (
          value &&
          typeof value.seconds === 'number' &&
          typeof value.nanoseconds === 'number'
        ) {
          return new admin.firestore.Timestamp(value.seconds, value.nanoseconds)
        }
        // Try parseable string or number
        try {
          const s = String(value).trim()
          if (!s) return null
          if (/^\d{13}$/.test(s)) {
            return admin.firestore.Timestamp.fromMillis(Number(s))
          }
          if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
            const d = new Date(s.replace(' ', 'T') + 'Z')
            return isNaN(d.getTime())
              ? null
              : admin.firestore.Timestamp.fromDate(d)
          }
          const d = new Date(s)
          return isNaN(d.getTime())
            ? null
            : admin.firestore.Timestamp.fromDate(d)
        } catch {
          return null
        }
      }

      const formatted: GeneralAnnouncement[] = snapshot.docs
        .map((doc) => {
          const data = doc.data() as any
          const title = typeof data.title === 'string' ? data.title : ''
          const content = typeof data.content === 'string' ? data.content : ''
          const username =
            typeof data.username === 'string' ? data.username : ''
          const startTs = toTimestamp(data.startdate)
          const endTs = toTimestamp(data.enddate)
          return { title, content, username, startTs, endTs }
        })
        .filter((row) => {
          // Domain filter: must be @ycdsb.ca
          const domainOk = /@ycdsb\.ca$/i.test(row.username)
          if (!domainOk) return false
          // Date window filter by local day (America/Toronto):
          // include if startDateKey <= todayKey <= endDateKey (inclusive).
          if (!row.startTs || !todayKey) return false
          const startKey = toDateKey(row.startTs)
          const endKey = toDateKey(row.endTs)
          if (!startKey) return false
          const afterStart = startKey <= todayKey
          const beforeEnd = !endKey || todayKey <= endKey
          return afterStart && beforeEnd
        })
        .map((row) => ({
          title: row.title.trim(),
          content: row.content.trim(),
        }))

      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.json({ data: formatted })
    } catch (error) {
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.status(500).json({
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
    }
  })
})

export const getAnnouncementFormUrl = https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    const formUrl =
      'https://docs.google.com/forms/d/e/1FAIpQLSeZ7HIVHTsd5wMjx2heWPwXd92RDmtAhY4wcaK-Gj-7cLrWXA/viewform'

    res.set('Access-Control-Allow-Origin', req.headers.origin || '')
    res.set('Vary', 'Origin')
    res.json({
      data: { formUrl },
    })
  })
})

// Upsert a general announcement into Firestore from Apps Script (GET or POST)
// Maps: ID -> id, Timestamp -> timestamp, Username -> username,
//       Group -> title, Announce -> content, Startdate -> startdate, Enddate -> enddate
export const saveGeneralAnnouncementNew = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const src: any = req.method === 'POST' ? req.body : req.query

      // helpers to clean incoming values that may be percent-encoded
      const stripCRLF = (s: string) => s.replace(/[\r\n]+/g, '')
      const decodeMaybe = (s: string) => {
        const v = stripCRLF(String(s))
        if (v.includes('%')) {
          try {
            return decodeURIComponent(v)
          } catch {
            return v
          }
        }
        return v
      }

      const id = decodeMaybe(src.ID ?? src.id ?? '').trim()
      const timestampStr = decodeMaybe(
        src.Timestamp ?? src.timestamp ?? ''
      ).trim()
      const username = decodeMaybe(src.Username ?? src.username ?? '').trim()
      const title = decodeMaybe(src.Group ?? src.title ?? '').trim()
      const content = decodeMaybe(src.Announce ?? src.content ?? '').trim()
      const startdateStr = decodeMaybe(
        src.Startdate ?? src.startdate ?? ''
      ).trim()
      const enddateStr = decodeMaybe(src.Enddate ?? src.enddate ?? '').trim()

      const missing: string[] = []
      if (!id) missing.push('ID')
      if (!timestampStr) missing.push('Timestamp')
      if (!username) missing.push('Username')
      if (!title) missing.push('Group/title')
      if (!content) missing.push('Announce/content')

      if (missing.length) {
        res.set('Access-Control-Allow-Origin', req.headers.origin || '')
        res.set('Vary', 'Origin')
        res.status(400).json({
          error: { message: `Missing required fields: ${missing.join(', ')}` },
        })
        return
      }

      // parse date-like value to JS Date then to Firestore Timestamp
      const toDate = (input: string): Date | null => {
        if (!input) return null
        const s = input.trim()
        if (!s) return null
        // Accept milliseconds
        if (/^\d{13}$/.test(s)) {
          const d = new Date(Number(s))
          return isNaN(d.getTime()) ? null : d
        }
        // Accept Google Sheets style: M/D/YYYY HH:MM:SS (no timezone)
        // Parsed as local time to match spreadsheet display
        if (/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2}$/.test(s)) {
          const [mdy, hms] = s.split(' ')
          const [mStr, dStr, yStr] = mdy.split('/')
          const [hhStr, mmStr, ssStr] = hms.split(':')
          const y = Number(yStr)
          const m = Number(mStr)
          const dDay = Number(dStr)
          const hh = Number(hhStr)
          const mm = Number(mmStr)
          const ss = Number(ssStr)
          const d = new Date(y, m - 1, dDay, hh, mm, ss)
          return isNaN(d.getTime()) ? null : d
        }
        // Convert 'YYYY-MM-DD HH:MM:SS' to ISO 'YYYY-MM-DDTHH:MM:SSZ'
        // Normalize multiple spaces into single space in case formatting is odd
        const norm = s.replace(/\s+/g, ' ')
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(norm)) {
          const iso = norm.replace(' ', 'T') + 'Z'
          const d = new Date(iso)
          return isNaN(d.getTime()) ? null : d
        }
        // Fallback: try as-is (ISO or other)
        const d = new Date(s)
        return isNaN(d.getTime()) ? null : d
      }

      const tsDate = toDate(timestampStr)
      if (!tsDate) {
        res.set('Access-Control-Allow-Origin', req.headers.origin || '')
        res.set('Vary', 'Origin')
        res.status(400).json({ error: { message: 'Invalid Timestamp format' } })
        return
      }

      const startDate = toDate(startdateStr)
      const endDate = toDate(enddateStr)

      const docData = {
        id,
        timestamp: admin.firestore.Timestamp.fromDate(tsDate),
        username,
        title,
        content,
        startdate: startDate
          ? admin.firestore.Timestamp.fromDate(startDate)
          : null,
        enddate: endDate ? admin.firestore.Timestamp.fromDate(endDate) : null,
      }

      await db
        .collection('newGeneralAnnouncements')
        .doc(id)
        .set(docData, { merge: true })

      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.json({ data: { id } })
      return
    } catch (error) {
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.status(500).json({
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
      return
    }
  })
})
