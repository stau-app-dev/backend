import { https } from 'firebase-functions'

export const getDayNumber = https.onRequest((req, res) => {
  res.send({
    data: {
      dayNumber: 1,
    },
  })
})
