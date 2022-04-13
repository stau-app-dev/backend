import { https } from 'firebase-functions'
import { db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_CLUBS_COLLECTION,
  NEW_CLUBS_QUICK_ACCESS_COLLECTION,
} from '../data/consts'
import { Club, ClubQuickAccessItem } from '../models/social'

export const addClub = https.onRequest(async (req, res) => {
  try {
    const { description, email, joinPreference, name, pictureId } = JSON.parse(
      req.body
    )
    if (!description || !email || !joinPreference || !name || !pictureId) {
      throw new Error('Missing required parameters')
    }

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

    await db
      .collection(NEW_CLUBS_QUICK_ACCESS_COLLECTION)
      .doc(clubAddRes.id)
      .create({
        pictureId,
        name,
      } as ClubQuickAccessItem)

    res.json({
      data: {
        message: 'Successfully added club!',
        club: club,
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
