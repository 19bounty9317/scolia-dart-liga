import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

function Tabelle() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStandings()
  }, [])

  const loadStandings = async () => {
    try {
      const playersSnap = await getDocs(collection(db, 'players'))
      const matchesSnap = await getDocs(collection(db, 'matches'))
      
      const playerStats = {}
      
      playersSnap.forEach(doc => {
        const data = doc.data()
        playerStats[doc.id] = {
          name: data.name,
          points: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          legsWon: 0,
          legsLost: 0,
          legDiff: 0
        }
      })
      
      matchesSnap.forEach(doc => {
        const match = doc.data()
        if (match.confirmed) {
          const p1 = match.player1Id
          const p2 = match.player2Id
          const legs1 = match.player1Legs
          const legs2 = match.player2Legs
          
          if (playerStats[p1] && playerStats[p2]) {
            playerStats[p1].legsWon += legs1
            playerStats[p1].legsLost += legs2
            playerStats[p2].legsWon += legs2
            playerStats[p2].legsLost += legs1
            
            if (legs1 > legs2) {
              playerStats[p1].points += 2
              playerStats[p1].wins += 1
              playerStats[p2].losses += 1
            } else if (legs2 > legs1) {
              playerStats[p2].points += 2
              playerStats[p2].wins += 1
              playerStats[p1].losses += 1
            } else {
              playerStats[p1].points += 1
              playerStats[p2].points += 1
              playerStats[p1].draws += 1
              playerStats[p2].draws += 1
            }
          }
        }
      })
      
      const standingsArray = Object.values(playerStats).map(p => ({
        ...p,
        legDiff: p.legsWon - p.legsLost
      }))
      
      standingsArray.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.legDiff !== a.legDiff) return b.legDiff - a.legDiff
        return b.legsWon - a.legsWon
      })
      
      setStandings(standingsArray)
    } catch (err) {
      console.error('Fehler beim Laden der Tabelle:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="card"><p>Laden...</p></div>

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px' }}>Liga-Tabelle</h2>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Platz</th>
              <th>Spieler</th>
              <th>Punkte</th>
              <th>S</th>
              <th>U</th>
              <th>N</th>
              <th>Legs</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => (
              <tr key={index}>
                <td><strong>{index + 1}</strong></td>
                <td>{player.name}</td>
                <td><strong>{player.points}</strong></td>
                <td>{player.wins}</td>
                <td>{player.draws}</td>
                <td>{player.losses}</td>
                <td>{player.legsWon}:{player.legsLost}</td>
                <td style={{ color: player.legDiff > 0 ? 'green' : player.legDiff < 0 ? 'red' : 'black' }}>
                  {player.legDiff > 0 ? '+' : ''}{player.legDiff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Tabelle
