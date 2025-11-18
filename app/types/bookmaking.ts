export interface Book {
  id: string
  title: string
  description?: string | null
  date: string
  category: string
  image?: string | null
  championship?: string | null
  country?: string | null
  isHotEvent: boolean
  isNationalSport: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  userId: string
  createdAt: string
  updatedAt: string
  isLive: boolean
  isUpcoming: boolean
  isAcceptingBets: boolean
  displayStatus: string
  teams: Team[]
  events: Event[]
}

export interface Team {
  id: string
  name: string
  image?: string | null
  bookId?: string | null
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  name: string
  isFirstFastOption: boolean
  isSecondFastOption: boolean
  bookId: string
  homeTeam?: Team | null
  awayTeam?: Team | null
  homeTeamId?: string | null
  awayTeamId?: string | null
  createdAt: string
  updatedAt: string
  outcomes: Outcome[]
}

export interface Outcome {
  id: string
  name: string
  odds: number
  result: 'PENDING' | 'WON' | 'LOST' | 'VOID'
  order: number
  eventId: string
  createdAt: string
  updatedAt: string
  probability: number
  stake: number
}