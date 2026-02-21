import apiClient from './apiClient'
import type {
  LoginResponse,
  RegisterPayload,
  User,
  UserInvitation,
} from '@/types'

export const authService = {
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<{ status: string; data: LoginResponse }>(
      '/auth/register',
      payload,
    )
    return data.data
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<{ status: string; data: LoginResponse }>(
      '/auth/login',
      { email, password },
    )
    return data.data
  },

  logout: async () => {
    await apiClient.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { accessToken: string }
    }>('/auth/refresh', { refreshToken })
    return data.data
  },

  inviteUser: async (payload: {
    email: string
    role: string
    firstName: string
    lastName: string
  }) => {
    const { data } = await apiClient.post<{
      status: string
      data: { invitation: unknown; token: string }
    }>('/auth/invite', payload)
    return data.data
  },

  acceptInvitation: async (token: string, password: string, phone: string) => {
    const { data } = await apiClient.post<{ status: string; data: LoginResponse }>(
      '/auth/accept-invitation',
      { token, password, phone },
    )
    return data.data
  },

  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<{ status: string; data: { user: User } }>(
      '/users/me',
    )
    return data.data.user
  },

  getMe: async () => {
    const { data } = await apiClient.get<{ status: string; data: { user: User; permissions: string[]; role: string } }>(
      '/auth/me',
    )
    return data.data
  },

  getInvitations: async (): Promise<UserInvitation[]> => {
    const { data } = await apiClient.get<{ status: string; data: { invitations: UserInvitation[] } }>(
      '/auth/invitations',
    )
    return data.data.invitations
  },

  cancelInvitation: async (id: string): Promise<void> => {
    await apiClient.delete(`/auth/invitations/${id}`)
  },
}
