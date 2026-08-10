import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { authApi, type LoginPayload, type RegisterPayload } from '@/services/authApi'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR' }

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true }
    case 'AUTH_SUCCESS':
      return { user: action.payload, isLoading: false, isAuthenticated: true }
    case 'AUTH_LOGOUT':
      return { user: null, isLoading: false, isAuthenticated: false }
    case 'AUTH_ERROR':
      return { user: null, isLoading: false, isAuthenticated: false }
    default:
      return state
  }
}

interface AuthContextValue extends AuthState {
  login: (data: LoginPayload) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const refreshUser = useCallback(async () => {
    dispatch({ type: 'AUTH_START' })
    try {
      const user = await authApi.me()
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
    } catch {
      dispatch({ type: 'AUTH_ERROR' })
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = useCallback(async (data: LoginPayload) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const user = await authApi.login(data)
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' })
      throw error
    }
  }, [])

  const register = useCallback(async (data: RegisterPayload) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const user = await authApi.register(data)
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' })
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }, [])

  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: user })
  }, [])

  const value = useMemo(
    () => ({ ...state, login, register, logout, refreshUser, updateUser }),
    [state, login, register, logout, refreshUser, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
