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
  const [topStats, setTopStats] = useState({
    topShortlegs: [0, 0, 0],
    topHighFinishes: [0, 0, 0]
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
        setTopStats(data.topStats || topStats)
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
          <h3>Meine Gesamt-Statistiken</h3>
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

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Meine Top 3 Werte</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
          Diese Werte werden automatisch aus deinen Spielen aktualisiert
        </p>

        <div>
          <h4 style={{ color: 'var(--accent-primary)', marginTop: '16px', marginBottom: '12px' }}>🏆 Top 3 Shortlegs</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Deine besten Legs (niedrigste Dart-Anzahl)
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {topStats.topShortlegs.map((value, index) => (
              <div key={index} style={{ 
                padding: '12px 20px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                minWidth: '80px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                  {value || '-'}
                </div>
                {value > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Darter
                  </div>
                )}
              </div>
            ))}
          </div>

          <h4 style={{ color: 'var(--accent-primary)', marginTop: '20px', marginBottom: '12px' }}>🎯 Top 3 High Finishes</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Deine höchsten Finishes
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {topStats.topHighFinishes.map((value, index) => (
              <div key={index} style={{ 
                padding: '12px 20px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                minWidth: '80px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                  {value || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profil
