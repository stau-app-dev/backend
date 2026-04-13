import * as admin from 'firebase-admin'
import corsLib = require('cors')

admin.initializeApp()
export { admin }

const firestore = admin.firestore()
const client = new admin.firestore.v1.FirestoreAdminClient()
export { firestore as db, client }

const auth = admin.auth()
export { auth }

const storage = admin.storage()
export { storage }

const cors = corsLib({ origin: true })
export { cors }
