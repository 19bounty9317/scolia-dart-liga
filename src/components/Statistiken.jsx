import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

function Statistiken() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('180er') // 180er, shortlegs, highFinish, average

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

  const getSortedStats = () => {
    const filtered = stats.filter(p => {
      if (activeTab === '180er') return p.oneEighties > 0
      if (activeTab === 'shortlegs') return p.shortlegs > 0
      if (activeTab === 'highFinish') return p.highFinish > 0
      if (activeTab === 'average') return p.bestOfTen > 0
      return false
    })

    return filtered.sort((a, b) => {
      if (activeTab === '180er') return b.oneEighties - a.oneEighties
      if (activeTab === 'shortlegs') return a.shortlegs - b.shortlegs // Kleiner = besser
      if (activeTab === 'highFinish') return b.highFinish - a.highFinish
      if (activeTab === 'average') return b.bestOfTen - a.bestOfTen
      return 0
    })
  }

  if (loading) return <div className="card"><p>Laden...</p></div>

  const sortedStats = getSortedStats()
  const top3 = sortedStats.slice(0, 3)
  const rest = sortedStats.slice(3)

  const getValueLabel = () => {
    if (activeTab === '180er') return 'Anzahl'
    if (activeTab === 'shortlegs') return 'Darts'
    if (activeTab === 'highFinish') return 'Punkte'
    if (activeTab === 'average') return 'Average'
    return 'Wert'
  }

  const getValue = (player) => {
    if (activeTab === '180er') return player.oneEighties
    if (activeTab === 'shortlegs') return player.shortlegs
    if (activeTab === 'highFinish') return player.highFinish
    if (activeTab === 'average') return player.bestOfTen
    return 0
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '32px' }}>📊 Statistiken</h2>
      
      {/* Top 3 für alle Kategorien */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Top 3 180er */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,51,102,0.1), rgba(255,51,102,0.05))', border: '2px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--accent-primary)' }}>💯 Top 3 180er</h3>
          {stats.filter(p => p.oneEighties > 0).sort((a, b) => b.oneEighties - a.oneEighties).slice(0, 3).map((player, index) => (
            <div key={index} style={{ 
              padding: '12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px', 
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
                <strong style={{ fontSize: '14px' }}>{player.name}</strong>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {player.oneEighties}
              </span>
            </div>
          ))}
        </div>

        {/* Top 3 Shortlegs */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,51,102,0.1), rgba(255,51,102,0.05))', border: '2px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--accent-primary)' }}>🏆 Top 3 Shortlegs</h3>
          {stats.filter(p => p.shortlegs > 0).sort((a, b) => a.shortlegs - b.shortlegs).slice(0, 3).map((player, index) => (
            <div key={index} style={{ 
              padding: '12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px', 
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
                <strong style={{ fontSize: '14px' }}>{player.name}</strong>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {player.shortlegs}
              </span>
            </div>
          ))}
        </div>

        {/* Top 3 High Finish */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,51,102,0.1), rgba(255,51,102,0.05))', border: '2px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--accent-primary)' }}>🎯 Top 3 High Finish</h3>
          {stats.filter(p => p.highFinish > 0).sort((a, b) => b.highFinish - a.highFinish).slice(0, 3).map((player, index) => (
            <div key={index} style={{ 
              padding: '12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px', 
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
                <strong style={{ fontSize: '14px' }}>{player.name}</strong>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {player.highFinish}
              </span>
            </div>
          ))}
        </div>

        {/* Top 3 Average */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,51,102,0.1), rgba(255,51,102,0.05))', border: '2px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--accent-primary)' }}>📈 Top 3 Average</h3>
          {stats.filter(p => p.bestOfTen > 0).sort((a, b) => b.bestOfTen - a.bestOfTen).slice(0, 3).map((player, index) => (
            <div key={index} style={{ 
              padding: '12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px', 
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
                <strong style={{ fontSize: '14px' }}>{player.name}</strong>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {player.bestOfTen}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className={activeTab === '180er' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('180er')}
            style={{ flex: '1', minWidth: '120px' }}
          >
            💯 180er
          </button>
          <button 
            className={activeTab === 'shortlegs' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('shortlegs')}
            style={{ flex: '1', minWidth: '120px' }}
          >
            🏆 Shortlegs
          </button>
          <button 
            className={activeTab === 'highFinish' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('highFinish')}
            style={{ flex: '1', minWidth: '120px' }}
          >
            🎯 High Finish
          </button>
          <button 
            className={activeTab === 'average' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('average')}
            style={{ flex: '1', minWidth: '120px' }}
          >
            📈 Average
          </button>
        </div>
      </div>

      {/* Vollständige Liste */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>
          {activeTab === '180er' && 'Bestleistungen 180er'}
          {activeTab === 'shortlegs' && 'Bestleistungen Shortlegs'}
          {activeTab === 'highFinish' && 'Bestleistungen High Finish'}
          {activeTab === 'average' && 'Bestleistungen Average'}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Platz</th>
                <th>{getValueLabel()}</th>
                <th>Spieler</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((player, index) => (
                <tr key={index} style={{ 
                  background: index < 3 ? 'rgba(255,51,102,0.05)' : 'transparent'
                }}>
                  <td><strong>{index + 1}</strong></td>
                  <td><strong style={{ color: 'var(--accent-primary)' }}>{getValue(player)}</strong></td>
                  <td>{player.name}</td>
                </tr>
              ))}
              {sortedStats.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Noch keine Daten
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Statistiken
