import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import { GENERAL_TOPIC, STA_DAY_NUMBER_SITE_URL } from '../data/consts'
import { DayNumber } from '../models/home'
import { get } from 'request-promise'
import { backOff } from 'exponential-backoff'

import admin from 'firebase-admin'
admin.initializeApp()

export const dayNumberNotification = onSchedule(
  'every day 08:30',
  async (event) => {
    const searchString = 'Day '
    let data

    try {
      data = await backOff(async () => get(STA_DAY_NUMBER_SITE_URL))
      logger.log('Fetched day number data')
    } catch (error) {
      logger.error('Error getting day number data: ' + error)
      return
    }

    const dayNumber: DayNumber['dayNumber'] = parseInt(
      data.substring(
        data.lastIndexOf(searchString) + searchString.length,
        data.lastIndexOf(searchString) + searchString.length + 1
      )
    )

    const notif = {
      notification: {
        title: 'Good morning, Titans.',
        body: `Today is Day ${dayNumber}!`,
      },
    }
    try {
      await admin.messaging().sendToTopic(GENERAL_TOPIC, notif)
      logger.log('Sent day number notifications to everyone')
    } catch (error) {
      logger.error('Error sending Day Number Notifications: ' + error)
    }
  }
)
