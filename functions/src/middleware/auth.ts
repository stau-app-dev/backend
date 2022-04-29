import { admin, db } from '../admin'
import { Response } from 'firebase-functions'
import { Request } from '../types'
import { GENERIC_ERROR_MESSAGE, NEW_USERS_COLLECTION } from '../data/consts'
import { User } from '../models/users'

const authMiddleware = async (
  req: Request,
  res: Response,
  next: Function,
  requiredStatus: Number = 0
) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer ')
  ) {
    res.status(403).send({ error: 'Unauthorized' })
    return
  }
  const idToken = req.headers.authorization.split('Bearer ')[1]
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken)
    const userDoc = await db
      .collection(NEW_USERS_COLLECTION)
      .where('email', '==', decodedIdToken.email)
      .get()
    if (userDoc.empty) {
      res.status(403).send({ error: 'Unauthorized' })
      return
    }
    if ((userDoc.docs[0].data() as User).status < requiredStatus) {
      res.status(403).send({ error: 'Unauthorized' })
      return
    }

    req.user = decodedIdToken
    next()
  } catch (error: any) {
    if (error instanceof Error) {
      res.status(500).json({
        error: {
          message: error.message,
        },
      })
    } else if (error.code && error.code === 'auth/id-token-expired') {
      res.status(401).json({
        error: {
          message: 'Token expired',
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
}

export default authMiddleware
