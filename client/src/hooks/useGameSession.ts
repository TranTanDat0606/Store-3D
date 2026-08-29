import { useCallback, useState } from 'react'
import { rewardApi, type GameCompleteResponse } from '@/services/rewardApi'

type GameStatus = 'idle' | 'starting' | 'playing' | 'completing' | 'done'

interface GameSessionState {
  status: GameStatus
  sessionId: string | null
  expiresAt: Date | null
  result: GameCompleteResponse | null
  error: string | null
}

export function useGameSession() {
  const [state, setState] = useState<GameSessionState>({
    status: 'idle',
    sessionId: null,
    expiresAt: null,
    result: null,
    error: null,
  })

  const startGame = useCallback(async (orderId: string) => {
    setState({ status: 'starting', sessionId: null, expiresAt: null, result: null, error: null })
    try {
      const { sessionId, expiresAt } = await rewardApi.startGame(orderId)
      setState({
        status: 'playing',
        sessionId,
        expiresAt: new Date(expiresAt),
        result: null,
        error: null,
      })
      return { sessionId, expiresAt }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể bắt đầu trò chơi'
      setState((s) => ({ ...s, status: 'idle', error: message }))
      return null
    }
  }, [])

  const completeGame = useCallback(async (score: number) => {
    setState((s) => {
      if (!s.sessionId) return s
      return { ...s, status: 'completing' }
    })

    const sessionId = state.sessionId
    if (!sessionId) return null

    try {
      const result = await rewardApi.completeGame(sessionId, score)
      setState((s) => ({ ...s, status: 'done', result }))
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể hoàn thành trò chơi'
      setState((s) => ({ ...s, status: 'idle', error: message }))
      return null
    }
  }, [state.sessionId])

  const reset = useCallback(() => {
    setState({ status: 'idle', sessionId: null, expiresAt: null, result: null, error: null })
  }, [])

  return { ...state, startGame, completeGame, reset }
}
