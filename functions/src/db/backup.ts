import { pubsub } from 'firebase-functions'
import { client } from '../admin'

export const backupFirestore = pubsub.schedule('0 0 * * *').onRun(async () => {
  try {
    console.log('Beginning backup...')
    const bucketName = 'gs://firestore-backup-bucket'
    const projectId = 'staugustinechsapp'
    const databaseName = client.databasePath(projectId, '(default)')

    const responses = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: bucketName,
    })

    for await (const response of responses) {
      console.log(response)
    }
  } catch (error) {
    console.log(error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Unknown error')
  }
})
