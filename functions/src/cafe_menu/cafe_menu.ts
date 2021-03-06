import { https } from 'firebase-functions'
import { db, cors } from '../admin'
import { GENERIC_ERROR_MESSAGE, NEW_CAFE_MENU_COLLECTION } from '../data/consts'
import { CafeItem } from '../models/cafe_item'
import { getFileNamesFromFolder, getSignedUrlFromFilePath } from '../storage'

const capitalizeFirstLetter = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1)

export const getCafeMenuItems = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
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
          id: doc.id,
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
})

export const addCafeMenuItem = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { name, price, pictureId, isTodaysSpecial } = req.body
      if (!name || !price || !pictureId || !isTodaysSpecial) {
        res.status(400).send({ error: 'Invalid parameters' })
        return
      }

      const item = {
        name: capitalizeFirstLetter(name),
        price: Number(price),
        pictureId,
        isTodaysSpecial: isTodaysSpecial === 'true',
      }

      const ref = await db.collection(NEW_CAFE_MENU_COLLECTION).add(item)

      res.json({
        data: {
          message: 'Successfully added item!',
          item: { id: ref.id, ...item },
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
})

export const updateCafeMenuItem = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { id, name, price, pictureId, isTodaysSpecial } = req.body
      if (!id || !name || !price || !pictureId || !isTodaysSpecial) {
        res.status(400).send({ error: 'Invalid parameters' })
        return
      }

      const item = {
        name: capitalizeFirstLetter(name),
        price: Number(price),
        pictureId,
        isTodaysSpecial: isTodaysSpecial === 'true',
      }

      await db.collection(NEW_CAFE_MENU_COLLECTION).doc(id).update(item)

      res.json({
        data: {
          message: 'Successfully updated item!',
          item: { id, ...item },
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
})

export const deleteCafeMenuItem = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { id } = req.body
      if (!id) {
        res.status(400).send({ error: 'Invalid parameters' })
        return
      }

      await db.collection(NEW_CAFE_MENU_COLLECTION).doc(id).delete()

      res.json({
        data: {
          message: 'Successfully deleted item!',
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
})

export const getCafeMenuPictures = https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { limit } = req.query
      if (!limit) {
        res.status(400).send({ error: 'Invalid parameters' })
        return
      }

      const limitParam = limit && Number(limit) > 0 ? Number(limit) : undefined
      const fileNames = await getFileNamesFromFolder(
        'newCafeMenuItems',
        limitParam
      )

      res.json({
        data: fileNames,
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
})
