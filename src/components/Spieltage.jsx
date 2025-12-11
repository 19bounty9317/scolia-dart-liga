import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '../firebase'

function Spieltage({ user }) {
  const [matchdays, setMatchdays] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [player1Legs, setPlayer1Legs] = useState('')
  const [player2Legs, setPlayer2Legs] = useState('')

  useEffect(() => {
    loadMatchdays()
  }, [])

  const loadMatchdays = async () => {
    try {
      const matchdaysSnap = await getDocs(collection(db, 'matchdays'))
      const matchesSnap = await getDocs(collection(db, 'matches'))
      
      const matchdaysData = []
      
      for (const mdDoc of matchdaysSnap.docs) {
        const mdData = mdDoc.data()
        const matches = []
        
        for (const mDoc of matchesSnap.docs) {
          const match = mDoc.data()
          if (match.matchdayId === mdDoc.id) {
            const p1Doc = await getDoc(doc(db, 'players', match.player1Id))
            const p2Doc = await getDoc(doc(db, 'players', match.player2Id))
            
            matches.push({
              id: mDoc.id,
              ...match,
              player1Name: p1Doc.data()?.name || 'Unbekannt',
              player2Name: p2Doc.data()?.name || 'Unbekannt'
            })
          }
        }
        
        matchdaysData.push({
          id: mdDoc.id,
          ...mdData,
          matches
        })
      }
      
      matchdaysData.sort((a, b) => b.week - a.week)
      setMatchdays(matchdaysData)
    } catch (err) {
      console.error('Fehler beim Laden der Spieltage:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResult = async () => {
    if (!selectedMatch || player1Legs === '' || player2Legs === '') return
    
    const legs1 = parseInt(player1Legs)
    const legs2 = parseInt(player2Legs)
    
    if (legs1 + legs2 !== 10) {
      alert('Die Summe der Legs muss 10 ergeben (Best of 10)!')
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
          player1Submitted: true
        })
      } else {
        if (currentData.player2Submitted) {
          alert('Du hast bereits ein Ergebnis eingereicht!')
          return
        }
        await updateDoc(matchRef, {
          player2LegsSubmitted: legs1,
          player1LegsSubmitted: legs2,
          player2Submitted: true
        })
      }
      
      const updatedDoc = await getDoc(matchRef)
      const updatedData = updatedDoc.data()
      
      if (updatedData.player1Submitted && updatedData.player2Submitted) {
        if (updatedData.player1Legs === updatedData.player1LegsSubmitted &&
            updatedData.player2Legs === updatedData.player2LegsSubmitted) {
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
      loadMatchdays()
    } catch (err) {
      console.error('Fehler beim Eintragen des Ergebnisses:', err)
      alert('Fehler beim Eintragen!')
    }
  }

  if (loading) return <div className="card"><p>Laden...</p></div>

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '32px' }}>🎯 Spieltage</h2>
      
      {matchdays.map(md => (
        <div key={md.id} className="card" style={{ marginBottom: '20px' }}>
          <h3>Woche {md.week}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            📅 {new Date(md.startDate?.seconds * 1000).toLocaleDateString('de-DE')} - {new Date(md.endDate?.seconds * 1000).toLocaleDateString('de-DE')}
          </p>
          
          {md.matches.map(match => (
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
          ))}
        </div>
      ))}
      
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
              Best of 10 Legs (Summe muss 10 ergeben)<br/>
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
