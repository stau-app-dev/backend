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

export const getFileNamesFromFolder = async (
  folderPath: string,
  limit?: number
) => {
  // Need to add one to the limit to account for the folder itself
  const limitParam = limit ? limit + 1 : undefined

  let fileNames = await storage
    .bucket()
    .getFiles({
      prefix: folderPath,
      maxResults: limitParam,
    })
    .then((files) => {
      return files[0].map((file) => file.name)
    })

  // Remove the first index because it is the folder path
  fileNames = fileNames.slice(1)

  // Remove folder path from the file names
  return fileNames.map((fileName) => fileName.replace(`${folderPath}/`, ''))
}
