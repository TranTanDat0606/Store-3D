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
  const isTestSession = useRef(false)

  const startGame = useCallback(async (orderId: string) => {
    isTestSession.current = false
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

  const startTestGame = useCallback(async () => {
    isTestSession.current = true
    setState({ status: 'starting', sessionId: null, expiresAt: null, result: null, error: null })
    // Fully client-side — no DB persistence, no backend call
    const sessionId = `test-${crypto.randomUUID()}`
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min
    sessionRef.current = sessionId
    setState({
      status: 'playing',
      sessionId,
      expiresAt,
      result: null,
      error: null,
    })
    return { sessionId, expiresAt: expiresAt.toISOString() }
  }, [])

  const completeGame = useCallback(async (score: number) => {
    const sessionId = sessionRef.current
    if (!sessionId) return null

    setState((s) => ({ ...s, status: 'completing' }))

    try {
      if (isTestSession.current) {
        // Test mode — fully client-side, no backend call
        isTestSession.current = false
        sessionRef.current = null
        const result: GameCompleteResponse = {
          score,
          reward: null,
        }
        setState((s) => ({ ...s, status: 'done', result }))
        return result
      }

      // Normal user — server validates, persists, awards
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
    isTestSession.current = false
    setState({ status: 'idle', sessionId: null, expiresAt: null, result: null, error: null })
  }, [])

  return { ...state, startGame, startTestGame, completeGame, reset }
}
