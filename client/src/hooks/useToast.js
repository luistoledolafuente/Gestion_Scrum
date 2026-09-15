import { useCallback, useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState('')
  const showToast = useCallback((nextMessage) => setMessage(nextMessage), [])
  const dismiss = useCallback(() => setMessage(''), [])
  return { message, showToast, dismiss }
}
