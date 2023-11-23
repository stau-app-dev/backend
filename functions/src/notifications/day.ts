import * as functions from 'firebase-functions'

import { logger } from 'firebase-functions'
import { GENERAL_TOPIC, STA_DAY_NUMBER_SITE_URL } from '../data/consts'
import { DayNumber } from '../models/home'
import { get } from 'request-promise'
import { backOff } from 'exponential-backoff'

import * as admin from 'firebase-admin'

export const dayNumberNotification = functions.pubsub.schedule('every day 08:30').timeZone('America/Toronto').onRun((context) => {  
    const searchString = 'Day '
    let data: String

    try {
      data = backOff(async () => get(STA_DAY_NUMBER_SITE_URL)).toString()
      logger.log('Fetched day number data: '+data);
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
      admin.messaging().sendToTopic(GENERAL_TOPIC, notif)
      logger.log('Sent day number notifications to everyone')
    } catch (error) {
      logger.error('Error sending Day Number Notifications: ' + error)
    }
  })

