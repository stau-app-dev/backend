import { https } from 'firebase-functions'
import { admin, db } from '../admin'
import {
  GENERIC_ERROR_MESSAGE,
  NEW_CLUB_ANNOUNCEMENTS_COLLECTION,
} from '../data/consts'
import { ClubAnnouncement } from '../models/announcements'

export const getClubAnnouncements = https.onRequest(async (req, res) => {
  try {
    const { clubId } = req.query
    const clubAnnouncementDocs = await db
      .collection(NEW_CLUB_ANNOUNCEMENTS_COLLECTION)
      .where('clubId', '==', clubId)
      .orderBy('createdAt', 'desc')
      .get()

    const clubAnnouncements: ClubAnnouncement[] = clubAnnouncementDocs.docs.map(
      (doc) => {
        var data = doc.data()
        data.id = doc.id
        return data as ClubAnnouncement
      }
    ) as ClubAnnouncement[]

    res.json({
      data: clubAnnouncements,
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

export const addClubAnnouncement = https.onRequest(async (req, res) => {
  try {
    const { clubId, clubName, content, creatorName } = JSON.parse(req.body)
    if (!clubId || !clubName || !content || !creatorName) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    const clubAnnouncement = {
      clubId,
      clubName,
      content,
      createdAt: new Date(),
      creatorName,
    } as ClubAnnouncement

    await Promise.all([
      await db
        .collection(NEW_CLUB_ANNOUNCEMENTS_COLLECTION)
        .add(clubAnnouncement),
      await admin.messaging().sendToTopic(clubId, {
        notification: {
          title: `${clubName} has a new announcement`,
          body: content,
        },
      }),
    ])

    res.json({
      data: {
        message: 'Successfully added announcement!',
        clubAnnouncement: clubAnnouncement,
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

export const deleteClubAnnouncement = https.onRequest(async (req, res) => {
  try {
    const { id } = JSON.parse(req.body)
    if (!id) {
      res.status(400).send({ error: 'Invalid parameters' })
      return
    }

    await db.collection(NEW_CLUB_ANNOUNCEMENTS_COLLECTION).doc(id).delete()

    res.json({
      data: {
        message: 'Successfully deleted announcement!',
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
