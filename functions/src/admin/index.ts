import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as Cors from 'cors'

admin.initializeApp(functions.config().firebase)
export { admin }

const firestore = admin.firestore()
const client = new admin.firestore.v1.FirestoreAdminClient()
export { firestore as db, client }

const auth = admin.auth()
export { auth }

const storage = admin.storage()
export { storage }

const cors = Cors({ origin: true })
export { cors }
