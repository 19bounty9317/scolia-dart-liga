import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database'
import { auth, rtdb } from './firebase'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      
      if (currentUser) {
        // Set user online status
        const userStatusRef = ref(rtdb, `status/${currentUser.uid}`)
        const isOnlineData = {
          online: true,
          lastSeen: serverTimestamp()
        }
        const isOfflineData = {
          online: false,
          lastSeen: serverTimestamp()
        }
        
        // Set online
        set(userStatusRef, isOnlineData)
        
        // Set offline on disconnect
        onDisconnect(userStatusRef).set(isOfflineData)
      }
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
        <h2>Laden...</h2>
      </div>
    )
  }

  return (
    <Router>
      {user && <Navbar user={user} />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/*" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App
