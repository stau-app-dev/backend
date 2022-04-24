import { admin } from '../admin'
import { Response } from 'firebase-functions'
import { Request } from '../types'

const authMiddleware = async (req: Request, res: Response, next: Function) => {
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
    req.user = decodedIdToken
    next()
  } catch (error) {
    res.status(403).send({ error: 'Unauthorized' })
  }
}

export default authMiddleware
