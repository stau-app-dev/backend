import { https } from 'firebase-functions'
import { db, storage } from '../admin'
import { GENERIC_ERROR_MESSAGE } from '../data/consts'
import { CafeItem } from '../models/cafe_item'

export const getCafeMenuItems = https.onRequest(async (req, res) => {
  try {
    const itemsDocs = await db
      .collection('newCafeMenu')
      .orderBy('name', 'asc')
      .get()

    const items: CafeItem[] = itemsDocs.docs.map((doc) => {
      return {
        ...doc.data(),
        pictureUrl: '',
      }
    }) as CafeItem[]

    for (const item of items) {
      item.pictureUrl = await getCafeMenuItemPictureUrl(item.pictureId)
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
    const { name, price, pictureId } = req.body
    if (!name || !price || !pictureId) {
      throw new Error('Missing required parameters')
    }

    const item = {
      name: capitalizeFirstLetter(name),
      price,
      pictureId,
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

const getCafeMenuItemPictureUrl = async (pictureId: string) => {
  const fileUrl = await storage
    .bucket()
    .file(`newCafeMenuItems/${pictureId}`)
    .getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    })
  console.log(fileUrl)
  return fileUrl[0]
}

const capitalizeFirstLetter = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1)
