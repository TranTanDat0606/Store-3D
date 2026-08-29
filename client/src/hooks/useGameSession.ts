import { useCallback, useRef, useState } from 'react'
import { rewardApi, type GameCompleteResponse } from '@/services/rewardApi'
import { getErrorMessage } from '@/services/apiClient'

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

  const sessionRef = useRef<string | null>(null)

  const startGame = useCallback(async (orderId: string) => {
    setState({ status: 'starting', sessionId: null, expiresAt: null, result: null, error: null })
    try {
      const { sessionId, expiresAt } = await rewardApi.startGame(orderId)
      sessionRef.current = sessionId
      setState({
        status: 'playing',
        sessionId,
        expiresAt: new Date(expiresAt),
        result: null,
        error: null,
      })
      return { sessionId, expiresAt }
    } catch (err) {
      sessionRef.current = null
      const message = getErrorMessage(err)
      setState((s) => ({ ...s, status: 'idle', error: message }))
      return null
    }
  }, [])

  const completeGame = useCallback(async (score: number) => {
    const sessionId = sessionRef.current
    if (!sessionId) return null

    setState((s) => ({ ...s, status: 'completing' }))

    try {
      const result = await rewardApi.completeGame(sessionId, score)
      sessionRef.current = null
      setState((s) => ({ ...s, status: 'done', result }))
      return result
    } catch (err) {
      sessionRef.current = null
      const message = getErrorMessage(err)
      setState((s) => ({ ...s, status: 'idle', error: message }))
      return null
    }
  }, [])

  const reset = useCallback(() => {
    sessionRef.current = null
    setState({ status: 'idle', sessionId: null, expiresAt: null, result: null, error: null })
  }, [])

  return { ...state, startGame, completeGame, reset }
}
