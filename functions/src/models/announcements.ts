export interface ClubAnnouncement {
  id: string
  clubId: string
  clubName: string
  content: string
  createdAt: Date
  creatorName: string
}

export interface GeneralAnnouncement {
  title: string
  content: string
}
