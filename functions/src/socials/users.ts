import { https } from 'firebase-functions'
import { admin, db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_CLUBS_COLLECTION,
  NEW_CLUBS_QUICK_ACCESS_COLLECTION,
  NEW_USERS_COLLECTION,
} from '../data/consts'
import { Club, ClubQuickAccessItem } from '../models/social'
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

export const addUserToClub = https.onRequest(async (req, res) => {
  try {
    const { userId, clubId } = req.query
    if (typeof userId !== 'string' || typeof clubId !== 'string') {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db.collection(NEW_USERS_COLLECTION).doc(userId).get()

    if (!userDoc.exists) {
      res.status(404).send({ error: 'User not found' })
      return
    }

    const clubDoc = await db.collection(NEW_CLUBS_COLLECTION).doc(clubId).get()

    if (!clubDoc.exists) {
      res.status(404).send({ error: 'Club not found' })
      return
    }

    const club = clubDoc.data() as Club

    if (club.members.includes(userId)) {
      res.status(400).send({ error: 'User already in club' })
      return
    }

    if (club.pending.includes(userId)) {
      res.status(400).send({ error: 'User already pending in club' })
      return
    }

    if (club.admins.includes(userId)) {
      res.status(400).send({ error: 'User already admin in club' })
      return
    }

    if (club.joinPreference === 0) {
      res.status(400).send({ error: 'Club does not allow new members' })
      return
    }

    await db
      .collection(NEW_CLUBS_COLLECTION)
      .doc(clubId)
      .update({
        members: admin.firestore.FieldValue.arrayUnion(userId),
      })

    await db
      .collection(NEW_CLUBS_COLLECTION)
      .doc(clubId)
      .update({
        pending: admin.firestore.FieldValue.arrayRemove(userId),
      })

    await db
      .collection(NEW_USERS_COLLECTION)
      .doc(userId)
      .update({
        clubs: admin.firestore.FieldValue.arrayUnion(clubId),
      })

    res.json({
      data: {
        message: 'User added to club',
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

export const removeUserFromClub = https.onRequest(async (req, res) => {
  try {
    const { userId, clubId } = req.query
    if (typeof userId !== 'string' || typeof clubId !== 'string') {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db.collection(NEW_USERS_COLLECTION).doc(userId).get()

    if (!userDoc.exists) {
      res.status(404).send({ error: 'User not found' })
      return
    }

    const clubDoc = await db.collection(NEW_CLUBS_COLLECTION).doc(clubId).get()

    if (!clubDoc.exists) {
      res.status(404).send({ error: 'Club not found' })
      return
    }

    const club = clubDoc.data() as Club

    if (!club.members.includes(userId)) {
      res.status(400).send({ error: 'User not in club' })
      return
    }

    await db
      .collection(NEW_CLUBS_COLLECTION)
      .doc(clubId)
      .update({
        members: admin.firestore.FieldValue.arrayRemove(userId),
      })

    await db
      .collection(NEW_CLUBS_COLLECTION)
      .doc(clubId)
      .update({
        pending: admin.firestore.FieldValue.arrayRemove(userId),
      })

    await db
      .collection(NEW_USERS_COLLECTION)
      .doc(userId)
      .update({
        clubs: admin.firestore.FieldValue.arrayRemove(clubId),
      })

    res.json({
      data: {
        message: 'User removed from club',
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
