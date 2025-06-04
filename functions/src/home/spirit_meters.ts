import { https } from 'firebase-functions'
import { db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_SPIRIT_METERS_COLLECTION,
} from '../data/consts'
import { SpiritMeters } from '../models/home'

export const getSpiritMeters = https.onRequest(async (req, res) => {
  try {
    const spiritMetersDoc = await db
      .collection(NEW_SPIRIT_METERS_COLLECTION)
      .doc('spiritMeters')
      .get()

    const spiritMeters: SpiritMeters = spiritMetersDoc.data() as SpiritMeters
    res.json({
      data: spiritMeters,
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
