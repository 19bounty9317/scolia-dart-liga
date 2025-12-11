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

  if (loading) return <div className="card"><p>Laden...</p></div>

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px' }}>Spieler-Statistiken</h2>
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
  )
}

export default Statistiken
