import { https } from 'firebase-functions'
import { admin, db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_CLUBS_COLLECTION,
  NEW_CLUBS_QUICK_ACCESS_COLLECTION,
  NEW_USERS_COLLECTION,
} from '../data/consts'
import { Club } from '../models/social'

export const getClub = https.onRequest(async (req, res) => {
  try {
    const { clubId } = req.query
    if (typeof clubId !== 'string') {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const clubDoc = await db.collection(NEW_CLUBS_COLLECTION).doc(clubId).get()

    if (!clubDoc.exists) {
      res.status(404).send({ error: 'Club not found' })
      return
    }

    const club = clubDoc.data() as Club

    res.json({
      data: club,
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

export const addClub = https.onRequest(async (req, res) => {
  try {
    const { description, email, joinPreference, name, pictureId } = JSON.parse(
      req.body
    )
    if (!description || !email || !joinPreference || !name || !pictureId) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const userDoc = await db
      .collection(NEW_USERS_COLLECTION)
      .where('email', '==', email)
      .get()
    if (userDoc.empty) {
      res.status(404).send({ error: 'User not found' })
      return
    }
    const userId = userDoc.docs[0].id

    const club = {
      admins: [email],
      description,
      joinPreference: Number(joinPreference),
      members: [],
      name,
      pending: [],
      pictureId,
    } as Club

    const clubAddRes = await db.collection(NEW_CLUBS_COLLECTION).add(club)
    await Promise.all([
      await db
        .collection(NEW_CLUBS_QUICK_ACCESS_COLLECTION)
        .doc(clubAddRes.id)
        .create({
          pictureId,
          name,
        }),

      await db
        .collection(NEW_USERS_COLLECTION)
        .doc(userId)
        .update({
          clubs: admin.firestore.FieldValue.arrayUnion(clubAddRes.id),
        }),
    ])

    res.json({
      data: {
        message: 'Successfully added club!',
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
