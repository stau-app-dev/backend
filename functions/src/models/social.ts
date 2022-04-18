export interface Club {
  admins: string[]
  description: string
  joinPreference: number // 0 = no one can join, 1 = requires admin approval, 2 = anyone can join
  members: string[]
  name: string
  pending: string[]
  pictureId: string
}

export interface ClubQuickAccessItem {
  id: string
  name: string
  pictureId: string
  pictureUrl: string
}
