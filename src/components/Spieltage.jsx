import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '../firebase'

function Spieltage({ user }) {
  const [matchdays, setMatchdays] = useState([])
  const [selectedMatchdayId, setSelectedMatchdayId] = useState('')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [player1Legs, setPlayer1Legs] = useState('')
  const [player2Legs, setPlayer2Legs] = useState('')
  const [stats, setStats] = useState({
    shortlegs: 0,
    oneEighties: 0,
    highFinish: 0,
    bestOfTen: 0
  })

  useEffect(() => {
    loadMatchdays()
  }, [])

  useEffect(() => {
    if (selectedMatchdayId) {
      loadMatches(selectedMatchdayId)
    }
  }, [selectedMatchdayId])

  const loadMatchdays = async () => {
    try {
      const matchdaysSnap = await getDocs(collection(db, 'matchdays'))
      const matchesSnap = await getDocs(collection(db, 'matches'))
      
      // Create a map of matchday statuses
      const matchdayStatuses = {}
      
      matchesSnap.forEach(doc => {
        const match = doc.data()
        const mdId = match.matchdayId
        
        if (!matchdayStatuses[mdId]) {
          matchdayStatuses[mdId] = { total: 0, confirmed: 0, hasError: false }
        }
        
        matchdayStatuses[mdId].total++
        
        if (match.confirmed) {
          matchdayStatuses[mdId].confirmed++
        } else if (match.player1Submitted && match.player2Submitted) {
          // Both submitted but not confirmed = mismatch error
          matchdayStatuses[mdId].hasError = true
        }
      })
      
      const matchdaysData = []
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Reset to start of day for comparison
      
      matchdaysSnap.forEach(doc => {
        const mdId = doc.id
        const mdData = doc.data()
        const status = matchdayStatuses[mdId] || { total: 0, confirmed: 0, hasError: false }
        
        // Get start and end dates
        let startDate, endDate
        if (mdData.startDate?.seconds) {
          startDate = new Date(mdData.startDate.seconds * 1000)
          endDate = new Date(mdData.endDate.seconds * 1000)
        } else {
          startDate = new Date(mdData.startDate)
          endDate = new Date(mdData.endDate)
        }
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        
        let statusIndicator = '🔴' // Red = open matches (default)
        
        // Check if matchday is currently active (today is between start and end)
        if (now >= startDate && now <= endDate) {
          statusIndicator = '🟠' // Orange = current/active matchday
        } else if (status.hasError) {
          statusIndicator = '⚠️' // Warning = error/mismatch
        } else if (status.total > 0 && status.confirmed === status.total) {
          statusIndicator = '🟢' // Green = all confirmed
        }
        
        matchdaysData.push({
          id: mdId,
          ...mdData,
          statusIndicator
        })
      })
      
      matchdaysData.sort((a, b) => a.week - b.week)
      setMatchdays(matchdaysData)
      
      // Auto-select first matchday (lowest week number)
      if (matchdaysData.length > 0) {
        setSelectedMatchdayId(matchdaysData[0].id)
      }
    } catch (err) {
      console.error('Fehler beim Laden der Spieltage:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMatches = async (matchdayId) => {
    setLoadingMatches(true)
    try {
      // Load all players once
      const playersSnap = await getDocs(collection(db, 'players'))
      const playersMap = {}
      playersSnap.forEach(doc => {
        playersMap[doc.id] = doc.data().name
      })
      
      // Load only matches for this matchday using query
      const matchesQuery = query(
        collection(db, 'matches'),
        where('matchdayId', '==', matchdayId)
      )
      const matchesSnap = await getDocs(matchesQuery)
      const matchesData = []
      
      matchesSnap.forEach(mDoc => {
        const match = mDoc.data()
        matchesData.push({
          id: mDoc.id,
          ...match,
          player1Name: playersMap[match.player1Id] || 'Unbekannt',
          player2Name: playersMap[match.player2Id] || 'Unbekannt'
        })
      })
      
      setMatches(matchesData)
    } catch (err) {
      console.error('Fehler beim Laden der Spiele:', err)
    } finally {
      setLoadingMatches(false)
    }
  }

  const handleSubmitResult = async () => {
    if (!selectedMatch || player1Legs === '' || player2Legs === '') return
    
    const legs1 = parseInt(player1Legs)
    const legs2 = parseInt(player2Legs)
    
    // Best of 10: Gewinner braucht 6 Legs, Verlierer kann max 5 haben
    // Gültige Ergebnisse: 6:0, 6:1, 6:2, 6:3, 6:4, 6:5 (oder umgekehrt)
    // Unentschieden: 5:5
    const maxLegs = Math.max(legs1, legs2)
    const minLegs = Math.min(legs1, legs2)
    
    const isValidResult = (maxLegs === 6 && minLegs >= 0 && minLegs <= 5) || 
                          (legs1 === 5 && legs2 === 5) // Unentschieden
    
    if (!isValidResult || legs1 < 0 || legs2 < 0 || legs1 > 6 || legs2 > 6) {
      alert('Ungültiges Ergebnis! Bei Best of 10 gewinnt wer zuerst 6 Legs hat (z.B. 6:0, 6:3, 6:5) oder es endet 5:5 unentschieden.')
      return
    }
    
    try {
      const matchRef = doc(db, 'matches', selectedMatch.id)
      const matchDoc = await getDoc(matchRef)
      const currentData = matchDoc.data()
      
      const isPlayer1 = user.uid === selectedMatch.player1Id
      const isPlayer2 = user.uid === selectedMatch.player2Id
      
      if (!isPlayer1 && !isPlayer2) {
        alert('Du bist nicht Teil dieses Spiels!')
        return
      }
      
      if (isPlayer1) {
        if (currentData.player1Submitted) {
          alert('Du hast bereits ein Ergebnis eingereicht!')
          return
        }
        await updateDoc(matchRef, {
          player1Legs: legs1,
          player2Legs: legs2,
          player1Submitted: true,
          player1Stats: stats
        })
        
        // Update player stats and top values
        const playerRef = doc(db, 'players', user.uid)
        const playerDoc = await getDoc(playerRef)
        const currentStats = playerDoc.data().stats || {}
        const currentTopStats = playerDoc.data().topStats || { topShortlegs: [0, 0, 0], topHighFinishes: [0, 0, 0] }
        
        // Calculate new average
        const currentAvgData = currentStats.averageData || { total: 0, count: 0 }
        const newTotal = currentAvgData.total + stats.bestOfTen
        const newCount = stats.bestOfTen > 0 ? currentAvgData.count + 1 : currentAvgData.count
        const newAverage = newCount > 0 ? Math.round((newTotal / newCount) * 10) / 10 : 0
        
        // Update top shortlegs if new value is better
        const newTopShortlegs = [...currentTopStats.topShortlegs, stats.shortlegs]
          .filter(v => v > 0)
          .sort((a, b) => a - b) // Sort ascending (lower is better for shortlegs)
          .slice(0, 3)
        while (newTopShortlegs.length < 3) newTopShortlegs.push(0)
        
        // Update top high finishes if new value is better
        const newTopHighFinishes = [...currentTopStats.topHighFinishes, stats.highFinish]
          .filter(v => v > 0)
          .sort((a, b) => b - a) // Sort descending (higher is better)
          .slice(0, 3)
        while (newTopHighFinishes.length < 3) newTopHighFinishes.push(0)
        
        await updateDoc(playerRef, {
          stats: {
            shortlegs: (currentStats.shortlegs || 0) + stats.shortlegs,
            oneEighties: (currentStats.oneEighties || 0) + stats.oneEighties,
            highFinish: Math.max(currentStats.highFinish || 0, stats.highFinish),
            bestOfTen: newAverage,
            averageData: { total: newTotal, count: newCount }
          },
          topStats: {
            topShortlegs: newTopShortlegs,
            topHighFinishes: newTopHighFinishes
          }
        })
      } else {
        if (currentData.player2Submitted) {
          alert('Du hast bereits ein Ergebnis eingereicht!')
          return
        }
        await updateDoc(matchRef, {
          player2LegsSubmitted: legs1,
          player1LegsSubmitted: legs2,
          player2Submitted: true,
          player2Stats: stats
        })
        
        // Update player stats and top values
        const playerRef = doc(db, 'players', user.uid)
        const playerDoc = await getDoc(playerRef)
        const currentStats = playerDoc.data().stats || {}
        const currentTopStats = playerDoc.data().topStats || { topShortlegs: [0, 0, 0], topHighFinishes: [0, 0, 0] }
        
        // Calculate new average
        const currentAvgData = currentStats.averageData || { total: 0, count: 0 }
        const newTotal = currentAvgData.total + stats.bestOfTen
        const newCount = stats.bestOfTen > 0 ? currentAvgData.count + 1 : currentAvgData.count
        const newAverage = newCount > 0 ? Math.round((newTotal / newCount) * 10) / 10 : 0
        
        // Update top shortlegs if new value is better
        const newTopShortlegs = [...currentTopStats.topShortlegs, stats.shortlegs]
          .filter(v => v > 0)
          .sort((a, b) => a - b) // Sort ascending (lower is better for shortlegs)
          .slice(0, 3)
        while (newTopShortlegs.length < 3) newTopShortlegs.push(0)
        
        // Update top high finishes if new value is better
        const newTopHighFinishes = [...currentTopStats.topHighFinishes, stats.highFinish]
          .filter(v => v > 0)
          .sort((a, b) => b - a) // Sort descending (higher is better)
          .slice(0, 3)
        while (newTopHighFinishes.length < 3) newTopHighFinishes.push(0)
        
        await updateDoc(playerRef, {
          stats: {
            shortlegs: (currentStats.shortlegs || 0) + stats.shortlegs,
            oneEighties: (currentStats.oneEighties || 0) + stats.oneEighties,
            highFinish: Math.max(currentStats.highFinish || 0, stats.highFinish),
            bestOfTen: newAverage,
            averageData: { total: newTotal, count: newCount }
          },
          topStats: {
            topShortlegs: newTopShortlegs,
            topHighFinishes: newTopHighFinishes
          }
        })
      }
      
      const updatedDoc = await getDoc(matchRef)
      const updatedData = updatedDoc.data()
      
      if (updatedData.player1Submitted && updatedData.player2Submitted) {
        // Player1 speichert: player1Legs, player2Legs
        // Player2 speichert: player2LegsSubmitted (seine Legs), player1LegsSubmitted (Gegner Legs)
        // Vergleich: player1Legs muss gleich player2LegsSubmitted sein (beide = Player1's Legs)
        //            player2Legs muss gleich player1LegsSubmitted sein (beide = Player2's Legs)
        if (updatedData.player1Legs === updatedData.player2LegsSubmitted &&
            updatedData.player2Legs === updatedData.player1LegsSubmitted) {
          await updateDoc(matchRef, { confirmed: true })
          alert('Ergebnis bestätigt!')
        } else {
          alert('Die Ergebnisse stimmen nicht überein! Bitte kontaktiert einen Admin.')
        }
      } else {
        alert('Ergebnis eingereicht! Warte auf Bestätigung des Gegners.')
      }
      
      setSelectedMatch(null)
      setPlayer1Legs('')
      setPlayer2Legs('')
      setStats({ shortlegs: 0, oneEighties: 0, highFinish: 0, bestOfTen: 0 })
      if (selectedMatchdayId) {
        loadMatches(selectedMatchdayId)
      }
    } catch (err) {
      console.error('Fehler beim Eintragen des Ergebnisses:', err)
      alert('Fehler beim Eintragen!')
    }
  }

  if (loading) return <div className="card"><p>Laden...</p></div>

  const selectedMatchday = matchdays.find(md => md.id === selectedMatchdayId)

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '32px' }}>
        <span style={{ filter: 'none', background: 'none', WebkitTextFillColor: 'initial' }}>🎯</span>
        {' '}Spieltage
      </h2>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
          Spieltag auswählen
        </label>
        <select 
          value={selectedMatchdayId} 
          onChange={(e) => setSelectedMatchdayId(e.target.value)}
          style={{ fontSize: '16px', padding: '12px' }}
        >
          {matchdays.map(md => (
            <option key={md.id} value={md.id}>
              {md.statusIndicator} Woche {md.week} ({new Date(md.startDate?.seconds * 1000).toLocaleDateString('de-DE')} - {new Date(md.endDate?.seconds * 1000).toLocaleDateString('de-DE')})
            </option>
          ))}
        </select>
      </div>

      {loadingMatches ? (
        <div className="card"><p>Spiele werden geladen...</p></div>
      ) : selectedMatchday && (
        <div className="card">
          <h3>Woche {selectedMatchday.week}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            📅 {new Date(selectedMatchday.startDate?.seconds * 1000).toLocaleDateString('de-DE')} - {new Date(selectedMatchday.endDate?.seconds * 1000).toLocaleDateString('de-DE')}
          </p>
          
          {matches.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Noch keine Spiele für diesen Spieltag</p>
          ) : (
            matches.map(match => (
              <div key={match.id} style={{ 
                padding: '18px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                marginBottom: '12px',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{match.player1Name}</strong> vs <strong>{match.player2Name}</strong>
                    {match.confirmed && (
                      <span style={{ marginLeft: '10px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                        ✓ {match.player1Legs}:{match.player2Legs}
                      </span>
                    )}
                    {!match.confirmed && match.player1Submitted && !match.player2Submitted && (
                      <span style={{ marginLeft: '10px', color: '#ed8936' }}>
                        ⏳ {match.player1Name} hat eingetragen - warte auf {match.player2Name}
                      </span>
                    )}
                    {!match.confirmed && match.player2Submitted && !match.player1Submitted && (
                      <span style={{ marginLeft: '10px', color: '#ed8936' }}>
                        ⏳ {match.player2Name} hat eingetragen - warte auf {match.player1Name}
                      </span>
                    )}
                    {!match.confirmed && match.player1Submitted && match.player2Submitted && (
                      <span style={{ marginLeft: '10px', color: 'var(--accent-dart)' }}>
                        ⚠️ Ergebnisse stimmen nicht überein! Admin kontaktieren.
                      </span>
                    )}
                  </div>
                  {!match.confirmed && (user.uid === match.player1Id || user.uid === match.player2Id) && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setSelectedMatch(match)}
                    >
                      Ergebnis eintragen
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {selectedMatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
            <h3>Ergebnis eintragen</h3>
            <p>{selectedMatch.player1Name} vs {selectedMatch.player2Name}</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Best of 10 Legs (First to 6 gewinnt, z.B. 6:0, 6:3, 6:5 oder 5:5 unentschieden)<br/>
              <strong style={{ color: 'var(--accent-primary)' }}>Sieg = 3 Punkte</strong> | Unentschieden = 1 Punkt
            </p>
            <input
              type="number"
              placeholder={`Legs ${selectedMatch.player1Name}`}
              value={player1Legs}
              onChange={(e) => setPlayer1Legs(e.target.value)}
              min="0"
              max="10"
            />
            <input
              type="number"
              placeholder={`Legs ${selectedMatch.player2Name}`}
              value={player2Legs}
              onChange={(e) => setPlayer2Legs(e.target.value)}
              min="0"
              max="10"
            />
            
            <h4 style={{ marginTop: '20px', marginBottom: '10px', color: 'var(--accent-primary)' }}>
              Deine Statistiken in diesem Spiel
            </h4>
            
            <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Shortlegs (Anzahl Darts für ein Leg)</label>
            <input
              type="number"
              placeholder="z.B. 15 für 15-Darter"
              value={stats.shortlegs}
              onChange={(e) => setStats({ ...stats, shortlegs: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '12px' }}>
              Dein bester Shortleg in diesem Spiel (wird automatisch in Top 3 gespeichert)
            </p>
            
            <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>180er</label>
            <input
              type="number"
              placeholder="Anzahl 180er"
              value={stats.oneEighties}
              onChange={(e) => setStats({ ...stats, oneEighties: parseInt(e.target.value) || 0 })}
              min="0"
            />
            
            <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>High Finish</label>
            <input
              type="number"
              placeholder="z.B. 120"
              value={stats.highFinish}
              onChange={(e) => setStats({ ...stats, highFinish: parseInt(e.target.value) || 0 })}
              min="0"
              max="170"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '12px' }}>
              Dein höchster Finish in diesem Spiel (wird automatisch in Top 3 gespeichert)
            </p>
            
            <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Best of 10 Average</label>
            <input
              type="number"
              placeholder="z.B. 75"
              value={stats.bestOfTen}
              onChange={(e) => setStats({ ...stats, bestOfTen: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '12px' }}>
              Dein Durchschnitt in diesem Spiel (wird in Gesamt-Durchschnitt eingerechnet)
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={handleSubmitResult}>
                Bestätigen
              </button>
              <button className="btn btn-secondary" onClick={() => {
                setSelectedMatch(null)
                setPlayer1Legs('')
                setPlayer2Legs('')
              }}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Spieltage
