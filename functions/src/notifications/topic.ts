import { https } from 'firebase-functions'
import { admin } from '../admin'
import { GENERAL_TOPIC, GENERIC_ERROR_MESSAGE } from '../data/consts'

export const sendToGeneralTopic = https.onRequest(async (req, res) => {
  try {
    const { message } = JSON.parse(req.body)

    if (typeof message !== 'string') {
      res.status(400).json({
        error: {
          message: 'Message is required',
        },
      })
      return
    }

    const data = {
      notification: {
        title: 'New Announcement from St. Augustine CHS',
        body: message,
      },
    }

    const response = await admin.messaging().sendToTopic(GENERAL_TOPIC, data)

    res.json({
      data: {
        response,
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
