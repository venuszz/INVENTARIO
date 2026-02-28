// API Types for React Query

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page?: number
  pageSize?: number
}
