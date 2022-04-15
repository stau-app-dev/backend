import { https } from 'firebase-functions'
import { db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_CLUBS_QUICK_ACCESS_COLLECTION,
  NEW_USERS_COLLECTION,
} from '../data/consts'
import { ClubQuickAccessItem } from '../models/social'
import { getSignedUrlFromFilePath } from '../storage'

export const getUserClubs = https.onRequest(async (req, res) => {
  try {
    const { userId } = req.query
    if (typeof userId !== 'string') {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db.collection(NEW_USERS_COLLECTION).doc(userId).get()

    if (!userDoc.exists) {
      res.status(404).send({ error: 'User not found' })
      return
    }

    const clubIds = userDoc.get('clubs') as string[]
    const clubs = await Promise.all(
      clubIds.map(async (clubId) => {
        const clubDoc = await db
          .collection(NEW_CLUBS_QUICK_ACCESS_COLLECTION)
          .doc(clubId)
          .get()
        return {
          id: clubId,
          ...clubDoc.data(),
          pictureUrl: '',
        } as ClubQuickAccessItem
      })
    )

    for (const club of clubs) {
      club.pictureUrl = await getSignedUrlFromFilePath(
        `newClubBanners/${club.pictureId}`
      )
    }

    res.json({
      data: clubs,
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
