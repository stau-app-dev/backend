import { https } from 'firebase-functions'
import { admin, db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_CLUBS_COLLECTION,
  NEW_CLUBS_QUICK_ACCESS_COLLECTION,
  NEW_USERS_COLLECTION,
} from '../data/consts'
import { Club, ClubQuickAccessItem } from '../models/social'
import { User } from '../models/users'
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

    await Promise.all([
      ...clubs.map(async (club) => {
        club.pictureUrl = await getSignedUrlFromFilePath(
          `newClubBanners/${club.pictureId}`
        )
      }),
    ])

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

export const getUserClubsNotJoined = https.onRequest(async (req, res) => {
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
    const clubs = await db.collection(NEW_CLUBS_QUICK_ACCESS_COLLECTION).get()

    const clubsNotJoined = clubs.docs.filter(
      (club) => !clubIds.includes(club.id)
    )
    const clubsNotJoinedData = clubsNotJoined.map(
      (club) =>
        ({
          id: club.id,
          ...club.data(),
          pictureUrl: '',
        } as ClubQuickAccessItem)
    )

    await Promise.all([
      ...clubsNotJoinedData.map(async (club) => {
        club.pictureUrl = await getSignedUrlFromFilePath(
          `newClubBanners/${club.pictureId}`
        )
      }),
    ])

    res.json({
      data: clubsNotJoinedData,
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
    const { userEmail, clubId } = JSON.parse(req.body)
    if (!userEmail || !clubId) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db
      .collection(NEW_USERS_COLLECTION)
      .where('email', '==', userEmail)
      .get()
    if (userDoc.empty) {
      res.status(404).send({ error: 'User not found' })
      return
    }
    const userId = userDoc.docs[0].id
    const user = userDoc.docs[0].data() as User
    const token = user.msgTokens[0]

    const clubDoc = await db.collection(NEW_CLUBS_COLLECTION).doc(clubId).get()
    if (!clubDoc.exists) {
      res.status(404).send({ error: 'Club not found' })
      return
    }
    const club = clubDoc.data() as Club

    if (club.members.includes(userEmail) || club.admins.includes(userEmail)) {
      res.status(400).send({ error: 'User is already a member of this club' })
      return
    }

    await Promise.all([
      await db
        .collection(NEW_CLUBS_COLLECTION)
        .doc(clubId)
        .update({
          members: admin.firestore.FieldValue.arrayUnion(userEmail),
          pending: admin.firestore.FieldValue.arrayRemove(userEmail),
        }),
      await db
        .collection(NEW_USERS_COLLECTION)
        .doc(userId)
        .update({
          clubs: admin.firestore.FieldValue.arrayUnion(clubId),
          notifications: admin.firestore.FieldValue.arrayUnion(clubId),
        }),
      await admin.messaging().subscribeToTopic(token, clubId),
    ])

    res.json({
      data: {
        message: 'User has been added to the club!',
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

export const addUserToPendingClub = https.onRequest(async (req, res) => {
  try {
    const { userEmail, clubId } = JSON.parse(req.body)
    if (!userEmail || !clubId) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db
      .collection(NEW_USERS_COLLECTION)
      .where('email', '==', userEmail)
      .get()
    if (userDoc.empty) {
      res.status(404).send({ error: 'User not found' })
      return
    }
    const user = userDoc.docs[0].data() as User
    const token = user.msgTokens[0]

    const clubDoc = await db.collection(NEW_CLUBS_COLLECTION).doc(clubId).get()
    if (!clubDoc.exists) {
      res.status(404).send({ error: 'Club not found' })
      return
    }
    const club = clubDoc.data() as Club

    if (
      club.members.includes(userEmail) ||
      club.pending.includes(userEmail) ||
      club.admins.includes(userEmail)
    ) {
      res.status(400).send({ error: 'User is already a member of this club' })
      return
    }

    await Promise.all([
      await db
        .collection(NEW_CLUBS_COLLECTION)
        .doc(clubId)
        .update({
          pending: admin.firestore.FieldValue.arrayUnion(userEmail),
        }),
      await admin.messaging().subscribeToTopic(token, clubId),
    ])

    res.json({
      data: {
        message: 'You have been added to the pending list',
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

export const promoteUserToAdmin = https.onRequest(async (req, res) => {
  try {
    const { userEmail, clubId } = JSON.parse(req.body)
    if (!userEmail || !clubId) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db
      .collection(NEW_USERS_COLLECTION)
      .where('email', '==', userEmail)
      .get()
    if (userDoc.empty) {
      res.status(404).send({ error: 'User not found' })
      return
    }

    const clubDoc = await db.collection(NEW_CLUBS_COLLECTION).doc(clubId).get()
    if (!clubDoc.exists) {
      res.status(404).send({ error: 'Club not found' })
      return
    }
    const club = clubDoc.data() as Club

    if (!club.members.includes(userEmail)) {
      res.status(400).send({ error: 'User is not a member of this club' })
      return
    }

    await db
      .collection(NEW_CLUBS_COLLECTION)
      .doc(clubId)
      .update({
        admins: admin.firestore.FieldValue.arrayUnion(userEmail),
        members: admin.firestore.FieldValue.arrayRemove(userEmail),
      })

    res.json({
      data: {
        message: 'User has been promoted to admin',
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
    const { userEmail, clubId } = JSON.parse(req.body)
    if (!userEmail || !clubId) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db
      .collection(NEW_USERS_COLLECTION)
      .where('email', '==', userEmail)
      .get()
    if (userDoc.empty) {
      res.status(404).send({ error: 'User not found' })
      return
    }
    const userId = userDoc.docs[0].id
    const user = userDoc.docs[0].data() as User
    const token = user.msgTokens[0]

    const clubDoc = await db.collection(NEW_CLUBS_COLLECTION).doc(clubId).get()
    if (!clubDoc.exists) {
      res.status(404).send({ error: 'Club not found' })
      return
    }
    const club = clubDoc.data() as Club

    if (
      !club.members.includes(userEmail) &&
      !club.admins.includes(userEmail) &&
      !club.pending.includes(userEmail)
    ) {
      res.status(400).send({ error: 'User is not a member of this club' })
      return
    }

    await Promise.all([
      await db
        .collection(NEW_CLUBS_COLLECTION)
        .doc(clubId)
        .update({
          admins: admin.firestore.FieldValue.arrayRemove(userEmail),
          members: admin.firestore.FieldValue.arrayRemove(userEmail),
          pending: admin.firestore.FieldValue.arrayRemove(userEmail),
        }),
      await db
        .collection(NEW_USERS_COLLECTION)
        .doc(userId)
        .update({
          clubs: admin.firestore.FieldValue.arrayRemove(clubId),
          notifications: admin.firestore.FieldValue.arrayRemove(clubId),
        }),
      await admin.messaging().unsubscribeFromTopic(token, clubId),
    ])

    res.json({
      data: {
        message: 'User has been removed from the club',
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
