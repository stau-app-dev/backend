import { https } from 'firebase-functions'
import { db } from '../admin'
import { GENERIC_ERROR_MESSAGE, NEW_CAFE_MENU_COLLECTION } from '../data/consts'
import { CafeItem } from '../models/cafe_item'
import { getSignedUrlFromFilePath } from '../storage'

export const getCafeMenuItems = https.onRequest(async (req, res) => {
  try {
    const { isTodaysSpecial, limit } = req.query
    let itemsDocs

    if (limit && Number(limit) > 0) {
      itemsDocs = await db
        .collection(NEW_CAFE_MENU_COLLECTION)
        .limit(Number(limit))
        .where('isTodaysSpecial', '==', isTodaysSpecial === 'true')
        .orderBy('name', 'asc')
        .get()
    } else {
      itemsDocs = await db
        .collection(NEW_CAFE_MENU_COLLECTION)
        .where('isTodaysSpecial', '==', isTodaysSpecial === 'true')
        .orderBy('name', 'asc')
        .get()
    }

    const items: CafeItem[] = itemsDocs.docs.map((doc) => {
      return {
        ...doc.data(),
        pictureUrl: '',
      }
    }) as CafeItem[]

    await Promise.all([
      ...items.map(async (item) => {
        item.pictureUrl = await getSignedUrlFromFilePath(
          `newCafeMenuItems/${item.pictureId}`
        )
      }),
    ])

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
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const item = {
      name: capitalizeFirstLetter(name),
      price,
      pictureId,
      todaysSpecial,
    }

    await db.collection(NEW_CAFE_MENU_COLLECTION).add(item)

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
