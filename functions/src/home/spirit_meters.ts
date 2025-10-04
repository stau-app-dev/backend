import { https, pubsub } from 'firebase-functions'
import { db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_SPIRIT_METERS_COLLECTION,
  NEW_USERS_COLLECTION,
  YCDSBK12_EMAIL,
} from '../data/consts'
import { SpiritMeters } from '../models/home'
import * as cors from 'cors'

// Reuse the same CORS config
const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true) // server-to-server, curl, etc.
    }

    // Allow production domain
    if (origin === 'https://staugustinechs.ca') {
      return callback(null, true)
    }

    if (origin.endsWith('.app.github.dev')) {
      return callback(null, true)
    }

    // Allow any localhost (any port)
    if (origin.startsWith('http://localhost')) {
      return callback(null, true)
    }

    // Otherwise block
    return callback(new Error(`CORS not allowed for origin: ${origin}`))
  },
})

export const getSpiritMeters = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const spiritMetersDoc = await db
        .collection(NEW_SPIRIT_METERS_COLLECTION)
        .doc('spiritMeters')
        .get()

      const spiritMeters: SpiritMeters = spiritMetersDoc.data() as SpiritMeters

      // Add explicit CORS headers
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')

      res.json({
        data: spiritMeters,
      })
    } catch (error) {
      res.status(500).json({
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
    }
  })
})

// ----------------------------------------------
// Shared core: compute and persist base spirit meters
// ----------------------------------------------
export async function computeAndPersistBaseSpiritMeters(): Promise<void> {
  // School year end is next calendar year if current month >= September (8)
  const now = new Date()
  const month = now.getMonth() // 0-based
  const schoolYearEnd = month >= 8 ? now.getFullYear() + 1 : now.getFullYear()

  const counters: SpiritMeters = { nine: 0, ten: 0, eleven: 0, twelve: 0 }

  const snapshot = await db.collection(NEW_USERS_COLLECTION).get()
  snapshot.forEach((doc) => {
    const data = doc.data() as { email?: string }
    const email = (data.email || '').toLowerCase()

    if (!email.endsWith(YCDSBK12_EMAIL)) return

    // Extract two trailing digits from the local part (before @)
    const local = email.split('@')[0]
    const m = local.match(/(\d{2})$/)
    if (!m) return

    const yy = parseInt(m[1], 10)
    if (Number.isNaN(yy)) return

    const gradYear = 2000 + yy
    // grade = 12 when gradYear === schoolYearEnd
    const grade = 12 - (gradYear - schoolYearEnd)

    if (grade === 9) counters.nine += 1
    else if (grade === 10) counters.ten += 1
    else if (grade === 11) counters.eleven += 1
    else if (grade === 12) counters.twelve += 1
  })

  // Normalize so the best grade is 100 and others are relative (integers)
  const maxCount = Math.max(
    counters.nine,
    counters.ten,
    counters.eleven,
    counters.twelve
  )
  const normalized: SpiritMeters =
    maxCount === 0
      ? { nine: 0, ten: 0, eleven: 0, twelve: 0 }
      : {
          nine: Math.round((counters.nine / maxCount) * 100),
          ten: Math.round((counters.ten / maxCount) * 100),
          eleven: Math.round((counters.eleven / maxCount) * 100),
          twelve: Math.round((counters.twelve / maxCount) * 100),
        }

  await db.collection(NEW_SPIRIT_METERS_COLLECTION).doc('spiritMeters').set(
    {
      nine: normalized.nine,
      ten: normalized.ten,
      eleven: normalized.eleven,
      twelve: normalized.twelve,
      // raw totals for visibility
      nineTotal: counters.nine,
      tenTotal: counters.ten,
      elevenTotal: counters.eleven,
      twelveTotal: counters.twelve,
    },
    { merge: true }
  )
}

// ----------------------------------------------
// Compute base spirit meters from signed-in users
// One point per student with @ycdsbk12.ca email
// Grade inferred from two-digit grad year at end of local-part.
// Example: john.smith26@ycdsbk12.ca => graduating 2026
// ----------------------------------------------
export const getBaseSpiritMetersNew = https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      await computeAndPersistBaseSpiritMeters()

      // Minimal response (no content)
      res.set('Access-Control-Allow-Origin', req.headers.origin || '')
      res.set('Vary', 'Origin')
      res.status(204).send()
    } catch (error) {
      res.status(500).json({
        error: {
          message:
            error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
        },
      })
    }
  })
})

// ----------------------------------------------
// Scheduled: update spirit meters daily at 2:00 AM Toronto-time
// ----------------------------------------------
export const updateBaseSpiritMetersDaily = pubsub
  .schedule('0 2 * * *') // minute=0, hour=2, every day
  .timeZone('America/Toronto')
  .onRun(async () => {
    try {
      await computeAndPersistBaseSpiritMeters()
      console.log('updateBaseSpiritMetersDaily: updated successfully')
    } catch (error) {
      console.error(
        'updateBaseSpiritMetersDaily failed',
        error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE
      )
    }
    return null
  })
