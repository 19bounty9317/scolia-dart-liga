import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '../firebase'

function OnlineStatus({ userId, showText = false }) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (!userId) return

    const statusRef = ref(rtdb, `status/${userId}`)
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val()
      setIsOnline(data?.online || false)
    })

    return () => unsubscribe()
  }, [userId])

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: isOnline ? '#48bb78' : '#f56565',
        display: 'inline-block',
        boxShadow: isOnline ? '0 0 8px rgba(72, 187, 120, 0.6)' : 'none'
      }} />
      {showText && (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  )
}

export default OnlineStatus
