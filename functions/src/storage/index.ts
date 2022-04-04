import { storage } from '../admin'

export const getSignedUrlFromFilePath = async (filePath: string) => {
  const fileUrl = await storage
    .bucket()
    .file(filePath)
    .getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  return fileUrl[0]
}
