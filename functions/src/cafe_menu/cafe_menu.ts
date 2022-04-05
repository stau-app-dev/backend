import { https } from 'firebase-functions'
import { db } from '../admin'
import { GENERIC_ERROR_MESSAGE } from '../data/consts'
import { CafeItem } from '../models/cafe_item'
import { getSignedUrlFromFilePath } from '../storage'

export const getCafeMenuItems = https.onRequest(async (req, res) => {
  try {
    const { isTodaysSpecial } = req.query
    console.log('isTodaysSpecial: ', isTodaysSpecial)
    const itemsDocs = await db
      .collection('newCafeMenu')
      .where('isTodaysSpecial', '==', isTodaysSpecial === 'true')
      .orderBy('name', 'asc')
      .get()

    const items: CafeItem[] = itemsDocs.docs.map((doc) => {
      return {
        ...doc.data(),
        pictureUrl: '',
      }
    }) as CafeItem[]

    for (const item of items) {
      item.pictureUrl = await getSignedUrlFromFilePath(
        `newCafeMenuItems/${item.pictureId}`
      )
    }

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

// NOTE: Frontend tell user that it will be auto capitalized?
export const addCafeMenuItem = https.onRequest(async (req, res) => {
  try {
    const { name, price, pictureId, todaysSpecial } = req.body
    if (!name || !price || !pictureId || !todaysSpecial) {
      throw new Error('Missing required parameters')
    }

    const item = {
      name: capitalizeFirstLetter(name),
      price,
      pictureId,
      todaysSpecial,
    }

    await db.collection('newCafeMenu').add(item)

    res.json({
      data: {
        message: 'Successfully added item!',
        item: item,
      },
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

const capitalizeFirstLetter = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1)
