import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp(functions.config().firebase)

const firestore = admin.firestore()
export { firestore as db }

const auth = admin.auth()
export { auth }
