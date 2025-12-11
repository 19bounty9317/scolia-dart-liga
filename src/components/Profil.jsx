import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'

function Profil({ user }) {
  const [playerData, setPlayerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState({
    shortlegs: 0,
    oneEighties: 0,
    highFinish: 0,
    bestOfTen: 0
  })

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    try {
      const playerDoc = await getDoc(doc(db, 'players', user.uid))
      if (playerDoc.exists()) {
        const data = playerDoc.data()
        setPlayerData(data)
        setStats(data.stats || stats)
      }
    } catch (err) {
      console.error('Fehler beim Laden des Profils:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStats = async () => {
    try {
      await updateDoc(doc(db, 'players', user.uid), { stats })
      alert('Statistiken aktualisiert!')
      setEditing(false)
      loadProfile()
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      alert('Fehler beim Speichern!')
    }
  }

  if (loading) return <div className="card"><p>Laden...</p></div>

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Mein Profil</h2>
        <p><strong>Name:</strong> {playerData?.name}</p>
        <p><strong>E-Mail:</strong> {playerData?.email}</p>
        {playerData?.isAdmin && (
          <div style={{ marginTop: '20px' }}>
            <Link to="/admin">
              <button className="btn btn-primary">Admin-Panel</button>
            </Link>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Meine Statistiken</h3>
          {!editing && (
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              Bearbeiten
            </button>
          )}
        </div>

        {!editing ? (
          <div>
            <p><strong>Shortlegs:</strong> {stats.shortlegs}</p>
            <p><strong>180er:</strong> {stats.oneEighties}</p>
            <p><strong>High Finish:</strong> {stats.highFinish}</p>
            <p><strong>Best of 10:</strong> {stats.bestOfTen}</p>
          </div>
        ) : (
          <div>
            <label>Shortlegs</label>
            <input
              type="number"
              value={stats.shortlegs}
              onChange={(e) => setStats({ ...stats, shortlegs: parseInt(e.target.value) || 0 })}
            />
            <label>180er</label>
            <input
              type="number"
              value={stats.oneEighties}
              onChange={(e) => setStats({ ...stats, oneEighties: parseInt(e.target.value) || 0 })}
            />
            <label>High Finish</label>
            <input
              type="number"
              value={stats.highFinish}
              onChange={(e) => setStats({ ...stats, highFinish: parseInt(e.target.value) || 0 })}
            />
            <label>Best of 10</label>
            <input
              type="number"
              value={stats.bestOfTen}
              onChange={(e) => setStats({ ...stats, bestOfTen: parseInt(e.target.value) || 0 })}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={handleSaveStats}>
                Speichern
              </button>
              <button className="btn btn-secondary" onClick={() => {
                setEditing(false)
                setStats(playerData.stats || stats)
              }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profil
