import { https } from 'firebase-functions'
import { auth } from 'firebase-admin'

type Request = https.Request & { user: auth.DecodedIdToken }
