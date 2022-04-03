import { https } from 'firebase-functions'
import { db } from '../admin'
import { GENERIC_ERROR_MESSAGE } from '../data/consts'
import { CafeItem } from '../models/cafe_item'

export const getCafeMenuItems = https.onRequest(async (req, res) => {
  try {
    const itemsDocs = await db
      .collection('newCafeMenu')
      .orderBy('name', 'desc')
      .get()

    const items: CafeItem[] = itemsDocs.docs.map((doc) => {
      return doc.data() as CafeItem
    }) as CafeItem[]

    res.json({
      data: items,
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
