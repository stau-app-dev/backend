import { https } from 'firebase-functions'
import { db, admin } from '../admin'  // <- assuming admin is exported in ../admin

// ------------------------------
// Delete Graduated Students
// ------------------------------
export const deleteGraduatedStudents = https.onRequest(async (req, res) => {
  try {
    // Two-digit years of graduated students
    const graduatedYears = [25, 24, 23, 22, 21, 20, 19, 18]

    const auth = admin.auth()
    let deletedCount = 0
    let failedCount = 0
    let pageToken: string | undefined

    do {
      const result = await auth.listUsers(1000, pageToken)

      const usersToDelete: string[] = []

      for (const user of result.users) {
        if (!user.email) continue
        const email = user.email.toLowerCase()

        // Only @ycdsbk12.ca emails
        if (email.endsWith('@ycdsbk12.ca')) {
          // Extract the two-digit year
          const match = email.match(/(\d{2})@ycdsbk12\.ca$/)
          if (match) {
            const year = parseInt(match[1], 10)

            if (graduatedYears.includes(year)) {
              usersToDelete.push(user.uid)
              console.log(`Deleting user: ${email} (${user.uid})`)

              // Delete the Firestore doc from newUsers
              try {
                await db.collection('newUsers').doc(user.uid).delete()
                console.log(`Deleted Firestore doc: newUsers/${user.uid}`)
              } catch (err) {
                console.error(`Failed to delete Firestore doc for ${user.uid}`, err)
              }
            }
          }
        }
      }

      if (usersToDelete.length > 0) {
        const deleteResult = await auth.deleteUsers(usersToDelete)
        deletedCount += deleteResult.successCount
        failedCount += deleteResult.failureCount
        console.log(
          `Deleted ${deleteResult.successCount}, failed ${deleteResult.failureCount} for this batch`
        )
      }

      pageToken = result.pageToken
    } while (pageToken)

    res.status(200).json({
      message: 'Graduated student cleanup complete',
      deletedCount,
      failedCount,
    })
  } catch (error) {
    console.error('deleteGraduatedStudents failed:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
