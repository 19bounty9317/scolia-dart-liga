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
      const matchesSnap = await getDocs(collection(db, 'matches'))
      
      // Build player stats from matches
      const playerStats = {}
      
      playersSnap.forEach(doc => {
        const data = doc.data()
        if (data.isTestAccount) return
        
        playerStats[doc.id] = {
          name: data.name,
          shortlegs: 0,      // Bester (kleinster) Wert
          oneEighties: 0,    // Summe
          highFinish: 0,     // Bester (höchster) Wert
          bestOfTen: 0       // Bester (höchster) Wert
        }
      })
      
      // Aggregate stats from all confirmed matches
      matchesSnap.forEach(doc => {
        const match = doc.data()
        if (!match.confirmed) return
        
        // Player 1 stats
        if (playerStats[match.player1Id] && match.player1Stats) {
          const stats = match.player1Stats
          
          // Shortlegs: Nur bester (kleinster) Wert, aber nur wenn > 0
          if (stats.shortlegs > 0) {
            if (playerStats[match.player1Id].shortlegs === 0) {
              playerStats[match.player1Id].shortlegs = stats.shortlegs
            } else {
              playerStats[match.player1Id].shortlegs = Math.min(
                playerStats[match.player1Id].shortlegs,
                stats.shortlegs
              )
            }
          }
          
          // 180er: Summe
          playerStats[match.player1Id].oneEighties += stats.oneEighties || 0
          
          // High Finish: Bester (höchster) Wert
          playerStats[match.player1Id].highFinish = Math.max(
            playerStats[match.player1Id].highFinish,
            stats.highFinish || 0
          )
          
          // Average: Bester (höchster) Wert
          if (stats.bestOfTen > 0) {
            playerStats[match.player1Id].bestOfTen = Math.max(
              playerStats[match.player1Id].bestOfTen,
              stats.bestOfTen
            )
          }
        }
        
        // Player 2 stats
        if (playerStats[match.player2Id] && match.player2Stats) {
          const stats = match.player2Stats
          
          // Shortlegs: Nur bester (kleinster) Wert, aber nur wenn > 0
          if (stats.shortlegs > 0) {
            if (playerStats[match.player2Id].shortlegs === 0) {
              playerStats[match.player2Id].shortlegs = stats.shortlegs
            } else {
              playerStats[match.player2Id].shortlegs = Math.min(
                playerStats[match.player2Id].shortlegs,
                stats.shortlegs
              )
            }
          }
          
          // 180er: Summe
          playerStats[match.player2Id].oneEighties += stats.oneEighties || 0
          
          // High Finish: Bester (höchster) Wert
          playerStats[match.player2Id].highFinish = Math.max(
            playerStats[match.player2Id].highFinish,
            stats.highFinish || 0
          )
          
          // Average: Bester (höchster) Wert
          if (stats.bestOfTen > 0) {
            playerStats[match.player2Id].bestOfTen = Math.max(
              playerStats[match.player2Id].bestOfTen,
              stats.bestOfTen
            )
          }
        }
      })
      
      const statsData = Object.values(playerStats)
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
      .sort((a, b) => a.shortlegs - b.shortlegs) // Kleinere Zahl = besser
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
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Bester Shortleg pro Spieler
          </p>
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
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Bester Average pro Spieler
          </p>
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
                <th>Bester Shortleg</th>
                <th>180er (Gesamt)</th>
                <th>High Finish</th>
                <th>Bester Ø</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((player, index) => (
                <tr key={index}>
                  <td><strong>{player.name}</strong></td>
                  <td>{player.shortlegs || '-'}</td>
                  <td>{player.oneEighties}</td>
                  <td>{player.highFinish || '-'}</td>
                  <td>{player.bestOfTen || '-'}</td>
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
