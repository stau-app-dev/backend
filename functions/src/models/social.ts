export interface Club {
  admins: string[]
  description: string
  joinPreference: number
  members: string[]
  name: string
  pending: string[]
  pictureId: string
}

export interface ClubQuickAccessItem {
  pictureId: string
  name: string
}
