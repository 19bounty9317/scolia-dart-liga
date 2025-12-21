import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

function Statistiken() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const playersSnap = await getDocs(collection(db, 'players'))
      const statsData = []
      
      playersSnap.forEach(doc => {
        const data = doc.data()
        statsData.push({
          name: data.name,
          shortlegs: data.stats?.shortlegs || 0,
          oneEighties: data.stats?.oneEighties || 0,
          highFinish: data.stats?.highFinish || 0,
          bestOfTen: data.stats?.bestOfTen || 0
        })
      })
      
      setStats(statsData)
    } catch (err) {
      console.error('Fehler beim Laden der Statistiken:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTopShortlegs = () => {
    return [...stats]
      .filter(p => p.shortlegs > 0)
      .sort((a, b) => b.shortlegs - a.shortlegs)
      .slice(0, 3)
  }

  const getTopHighFinish = () => {
    return [...stats]
      .filter(p => p.highFinish > 0)
      .sort((a, b) => b.highFinish - a.highFinish)
      .slice(0, 3)
  }

  const getTopOneEighties = () => {
    return [...stats]
      .filter(p => p.oneEighties > 0)
      .sort((a, b) => b.oneEighties - a.oneEighties)
      .slice(0, 3)
  }

  const getTopAverage = () => {
    return [...stats]
      .filter(p => p.bestOfTen > 0)
      .sort((a, b) => b.bestOfTen - a.bestOfTen)
      .slice(0, 3)
  }

  if (loading) return <div className="card"><p>Laden...</p></div>

  const topShortlegs = getTopShortlegs()
  const topHighFinish = getTopHighFinish()
  const topOneEighties = getTopOneEighties()
  const topAverage = getTopAverage()

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '32px' }}>📊 Statistiken</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '20px' }}>🏆 Top 3 Shortlegs</h3>
          {topShortlegs.length > 0 ? (
            topShortlegs.map((player, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: index === 0 ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: index === 0 ? 'var(--accent-primary)' : index === 1 ? '#a0aec0' : '#718096'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <strong>{player.name}</strong>
                </div>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: 'var(--accent-primary)'
                }}>
                  {player.shortlegs}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Noch keine Daten</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '20px' }}>🎯 Top 3 High Finish</h3>
          {topHighFinish.length > 0 ? (
            topHighFinish.map((player, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: index === 0 ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: index === 0 ? 'var(--accent-primary)' : index === 1 ? '#a0aec0' : '#718096'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <strong>{player.name}</strong>
                </div>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: 'var(--accent-primary)'
                }}>
                  {player.highFinish}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Noch keine Daten</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '20px' }}>💯 Top 3 180er</h3>
          {topOneEighties.length > 0 ? (
            topOneEighties.map((player, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: index === 0 ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: index === 0 ? 'var(--accent-primary)' : index === 1 ? '#a0aec0' : '#718096'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <strong>{player.name}</strong>
                </div>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: 'var(--accent-primary)'
                }}>
                  {player.oneEighties}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Noch keine Daten</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '20px' }}>📈 Top 3 Average</h3>
          {topAverage.length > 0 ? (
            topAverage.map((player, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: index === 0 ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: index === 0 ? 'var(--accent-primary)' : index === 1 ? '#a0aec0' : '#718096'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <strong>{player.name}</strong>
                </div>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: 'var(--accent-primary)'
                }}>
                  {player.bestOfTen}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Noch keine Daten</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Alle Spieler-Statistiken</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Spieler</th>
                <th>Shortlegs</th>
                <th>180er</th>
                <th>High Finish</th>
                <th>Best of 10</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((player, index) => (
                <tr key={index}>
                  <td><strong>{player.name}</strong></td>
                  <td>{player.shortlegs}</td>
                  <td>{player.oneEighties}</td>
                  <td>{player.highFinish}</td>
                  <td>{player.bestOfTen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Statistiken
