import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

function AdminPanel({ user }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [matchdays, setMatchdays] = useState([])
  const [week, setWeek] = useState('')
  const [date, setDate] = useState('')
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [selectedMatchday, setSelectedMatchday] = useState('')
  const [matches, setMatches] = useState([])
  const [editingMatchday, setEditingMatchday] = useState(null)
  const [editingMatchdayMatches, setEditingMatchdayMatches] = useState([])
  const [editingMatch, setEditingMatch] = useState(null)
  const [editPlayer1Legs, setEditPlayer1Legs] = useState('')
  const [editPlayer2Legs, setEditPlayer2Legs] = useState('')
  const [editPlayer1Stats, setEditPlayer1Stats] = useState({
    shortlegs: 0,
    oneEighties: 0,
    highFinish: 0,
    bestOfTen: 0
  })
  const [editPlayer2Stats, setEditPlayer2Stats] = useState({
    shortlegs: 0,
    oneEighties: 0,
    highFinish: 0,
    bestOfTen: 0
  })

  useEffect(() => {
    checkAdmin()
  }, [user])

  // Update editingMatchdayMatches when matches change
  useEffect(() => {
    if (editingMatchday) {
      const matchdayMatches = matches.filter(m => m.matchdayId === editingMatchday.id)
      setEditingMatchdayMatches(matchdayMatches)
    }
  }, [matches, editingMatchday])

  const checkAdmin = async () => {
    try {
      const playerDoc = await getDoc(doc(db, 'players', user.uid))
      if (playerDoc.exists() && playerDoc.data().isAdmin) {
        setIsAdmin(true)
        loadData()
      }
    } catch (err) {
      console.error('Fehler:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    const playersSnap = await getDocs(collection(db, 'players'))
    const playersData = []
    playersSnap.forEach(doc => {
      playersData.push({ id: doc.id, ...doc.data() })
    })
    setPlayers(playersData)

    const matchdaysSnap = await getDocs(collection(db, 'matchdays'))
    const matchdaysData = []
    matchdaysSnap.forEach(doc => {
      matchdaysData.push({ id: doc.id, ...doc.data() })
    })
    setMatchdays(matchdaysData.sort((a, b) => a.week - b.week))
    
    const matchesSnap = await getDocs(collection(db, 'matches'))
    const matchesData = []
    for (const mDoc of matchesSnap.docs) {
      const match = mDoc.data()
      const p1Doc = await getDoc(doc(db, 'players', match.player1Id))
      const p2Doc = await getDoc(doc(db, 'players', match.player2Id))
      matchesData.push({
        id: mDoc.id,
        ...match,
        player1Name: p1Doc.data()?.name || 'Unbekannt',
        player2Name: p2Doc.data()?.name || 'Unbekannt'
      })
    }
    setMatches(matchesData)
  }

  const handleCreateMatchday = async () => {
    if (!week || !date) {
      alert('Bitte Woche und Startdatum eingeben!')
      return
    }
    try {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6) // +6 Tage = Sonntag
      
      await addDoc(collection(db, 'matchdays'), {
        week: parseInt(week),
        startDate: startDate,
        endDate: endDate,
        createdAt: new Date()
      })
      alert('Spieltag erstellt! Zeitraum: Mo-So')
      setWeek('')
      setDate('')
      loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Erstellen!')
    }
  }

  const handleCreateMatch = async () => {
    if (!selectedMatchday || !player1 || !player2) {
      alert('Bitte alle Felder ausfüllen!')
      return
    }
    if (player1 === player2) {
      alert('Spieler können nicht gegen sich selbst spielen!')
      return
    }
    try {
      await addDoc(collection(db, 'matches'), {
        matchdayId: selectedMatchday,
        player1Id: player1,
        player2Id: player2,
        player1Legs: 0,
        player2Legs: 0,
        player1Submitted: false,
        player2Submitted: false,
        confirmed: false,
        createdAt: new Date()
      })
      alert('Spiel erstellt!')
      setPlayer1('')
      setPlayer2('')
      loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Erstellen!')
    }
  }

  const handleDeleteMatch = async (matchId) => {
    if (!confirm('Spiel wirklich löschen?')) return
    try {
      await deleteDoc(doc(db, 'matches', matchId))
      alert('Spiel gelöscht!')
      loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Löschen!')
    }
  }

  const handleDeleteMatchday = async (matchdayId) => {
    if (!confirm('Spieltag wirklich löschen? Alle Spiele werden ebenfalls gelöscht!')) return
    try {
      const matchesToDelete = matches.filter(m => m.matchdayId === matchdayId)
      for (const match of matchesToDelete) {
        await deleteDoc(doc(db, 'matches', match.id))
      }
      await deleteDoc(doc(db, 'matchdays', matchdayId))
      alert('Spieltag und alle Spiele gelöscht!')
      loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Löschen!')
    }
  }

  const handleEditMatchday = (matchday) => {
    try {
      setEditingMatchday(matchday)
      setWeek(matchday.week.toString())
      
      // Handle different date formats
      let startDate
      if (matchday.startDate?.seconds) {
        startDate = new Date(matchday.startDate.seconds * 1000)
      } else if (matchday.startDate?.toDate) {
        startDate = matchday.startDate.toDate()
      } else if (matchday.startDate) {
        startDate = new Date(matchday.startDate)
      } else {
        startDate = new Date()
      }
      
      const dateString = startDate.toISOString().split('T')[0]
      setDate(dateString)
      
      // Load matches for this matchday
      const matchdayMatches = matches.filter(m => m.matchdayId === matchday.id)
      setEditingMatchdayMatches(matchdayMatches)
    } catch (err) {
      console.error('Fehler beim Bearbeiten:', err)
      alert('Fehler beim Laden der Daten: ' + err.message)
    }
  }

  const handleEditMatch = (match) => {
    setEditingMatch(match)
    setEditPlayer1Legs(match.player1Legs?.toString() || '0')
    setEditPlayer2Legs(match.player2Legs?.toString() || '0')
    setEditPlayer1Stats(match.player1Stats || { shortlegs: 0, oneEighties: 0, highFinish: 0, bestOfTen: 0 })
    setEditPlayer2Stats(match.player2Stats || { shortlegs: 0, oneEighties: 0, highFinish: 0, bestOfTen: 0 })
  }

  const handleSaveMatchResult = async () => {
    if (!editingMatch) return
    
    const legs1 = parseInt(editPlayer1Legs)
    const legs2 = parseInt(editPlayer2Legs)
    
    // Validierung: Best of 10
    const maxLegs = Math.max(legs1, legs2)
    const minLegs = Math.min(legs1, legs2)
    const isValidResult = (maxLegs === 6 && minLegs >= 0 && minLegs <= 5) || 
                          (legs1 === 5 && legs2 === 5) ||
                          (legs1 === 0 && legs2 === 0) // Erlaubt Reset auf 0:0
    
    if (!isValidResult && !(legs1 === 0 && legs2 === 0)) {
      alert('Ungültiges Ergebnis! Bei Best of 10 gewinnt wer zuerst 6 Legs hat (z.B. 6:0, 6:3, 6:5) oder es endet 5:5 unentschieden.')
      return
    }
    
    try {
      const isReset = legs1 === 0 && legs2 === 0
      
      await updateDoc(doc(db, 'matches', editingMatch.id), {
        player1Legs: legs1,
        player2Legs: legs2,
        player1LegsSubmitted: legs1,
        player2LegsSubmitted: legs2,
        player1Submitted: !isReset,
        player2Submitted: !isReset,
        confirmed: !isReset,
        player1Stats: isReset ? null : editPlayer1Stats,
        player2Stats: isReset ? null : editPlayer2Stats
      })
      
      alert(isReset ? 'Spiel zurückgesetzt!' : 'Ergebnis gespeichert und bestätigt!')
      setEditingMatch(null)
      setEditPlayer1Legs('')
      setEditPlayer2Legs('')
      setEditPlayer1Stats({ shortlegs: 0, oneEighties: 0, highFinish: 0, bestOfTen: 0 })
      setEditPlayer2Stats({ shortlegs: 0, oneEighties: 0, highFinish: 0, bestOfTen: 0 })
      await loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  const handleSaveStatsOnly = async () => {
    if (!editingMatch) return
    
    try {
      await updateDoc(doc(db, 'matches', editingMatch.id), {
        player1Stats: editPlayer1Stats,
        player2Stats: editPlayer2Stats
      })
      
      alert('Statistiken aktualisiert!')
      setEditingMatch(null)
      setEditPlayer1Stats({ shortlegs: 0, oneEighties: 0, highFinish: 0, bestOfTen: 0 })
      setEditPlayer2Stats({ shortlegs: 0, oneEighties: 0, highFinish: 0, bestOfTen: 0 })
      await loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  const handleCloseMatchdayEdit = () => {
    setEditingMatchday(null)
    setEditingMatchdayMatches([])
    setEditingMatch(null)
    setWeek('')
    setDate('')
  }

  const handleUpdateMatchday = async () => {
    if (!editingMatchday || !week || !date) {
      alert('Bitte alle Felder ausfüllen!')
      return
    }
    
    console.log('Updating matchday:', {
      id: editingMatchday.id,
      week: week,
      date: date
    })
    
    try {
      const startDate = new Date(date)
      if (isNaN(startDate.getTime())) {
        alert('Ungültiges Datum!')
        return
      }
      
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      
      console.log('Updating with:', {
        week: parseInt(week),
        startDate: startDate,
        endDate: endDate
      })
      
      await updateDoc(doc(db, 'matchdays', editingMatchday.id), {
        week: parseInt(week),
        startDate: startDate,
        endDate: endDate
      })
      
      alert('Spieltag erfolgreich aktualisiert!')
      setEditingMatchday(null)
      setWeek('')
      setDate('')
      await loadData()
    } catch (err) {
      console.error('Fehler beim Aktualisieren:', err)
      alert('Fehler beim Aktualisieren: ' + err.message)
    }
  }

  const handleResetMatch = async (matchId) => {
    if (!confirm('Spiel zurücksetzen? Alle Eingaben werden gelöscht!')) return
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        player1Legs: 0,
        player2Legs: 0,
        player1Submitted: false,
        player2Submitted: false,
        confirmed: false,
        player1Stats: null,
        player2Stats: null,
        player1LegsSubmitted: 0,
        player2LegsSubmitted: 0
      })
      alert('Spiel zurückgesetzt!')
      loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Zurücksetzen!')
    }
  }

  const handleResetTable = async () => {
    if (!confirm('⚠️ Tabelle zurücksetzen?\n\nDies wird:\n- Alle Punkte, Siege, Niederlagen zurücksetzen\n- Alle bestätigten Spiele zurücksetzen\n\nStatistiken und Spieltage bleiben erhalten!')) return
    
    try {
      // Reset all matches
      for (const match of matches) {
        await updateDoc(doc(db, 'matches', match.id), {
          player1Legs: 0,
          player2Legs: 0,
          player1Submitted: false,
          player2Submitted: false,
          confirmed: false,
          player1Stats: null,
          player2Stats: null,
          player1LegsSubmitted: 0,
          player2LegsSubmitted: 0
        })
      }
      
      alert('✅ Tabelle erfolgreich zurückgesetzt!')
      loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Zurücksetzen der Tabelle: ' + err.message)
    }
  }

  const handleResetStats = async () => {
    if (!confirm('⚠️ Statistiken zurücksetzen?\n\nDies wird:\n- Alle Spieler-Statistiken löschen (180er, Shortlegs, High Finish, Average)\n- Top 3 Werte zurücksetzen\n\nTabelle und Spieltage bleiben erhalten!')) return
    
    try {
      // Reset all player stats
      for (const player of players) {
        await updateDoc(doc(db, 'players', player.id), {
          stats: {
            shortlegs: 0,
            oneEighties: 0,
            highFinish: 0,
            bestOfTen: 0,
            averageData: { total: 0, count: 0 }
          },
          topStats: {
            topShortlegs: [0, 0, 0],
            topHighFinishes: [0, 0, 0]
          }
        })
      }
      
      alert('✅ Statistiken erfolgreich zurückgesetzt!')
      loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Zurücksetzen der Statistiken: ' + err.message)
    }
  }

  const handleResetMatchdays = async () => {
    if (!confirm('⚠️ ACHTUNG: Alle Spieltage löschen?\n\nDies wird:\n- Alle Spieltage löschen\n- Alle Spiele löschen\n\nDiese Aktion kann NICHT rückgängig gemacht werden!')) return
    
    if (!confirm('Bist du dir WIRKLICH sicher? Alle Spieltage und Spiele gehen verloren!')) return
    
    try {
      // Delete all matches
      for (const match of matches) {
        await deleteDoc(doc(db, 'matches', match.id))
      }
      
      // Delete all matchdays
      for (const matchday of matchdays) {
        await deleteDoc(doc(db, 'matchdays', matchday.id))
      }
      
      alert('✅ Alle Spieltage erfolgreich gelöscht!')
      loadData()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Löschen der Spieltage: ' + err.message)
    }
  }

  if (loading) return <div className="card"><p>Laden...</p></div>
  if (!isAdmin) return <div className="card"><p>Kein Zugriff. Nur für Admins.</p></div>

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '32px' }}>⚙️ Admin-Panel</h2>
      
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,51,102,0.1), rgba(255,51,102,0.05))', border: '2px solid var(--accent-dart)' }}>
        <h3 style={{ color: 'var(--accent-dart)' }}>⚠️ Reset-Funktionen</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          Wähle aus, was du zurücksetzen möchtest. Jede Funktion arbeitet unabhängig.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>📊 Tabelle zurücksetzen</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Setzt alle Spiele und Ergebnisse zurück. Statistiken und Spieltage bleiben erhalten.
            </p>
            <button 
              className="btn btn-danger" 
              onClick={handleResetTable}
              style={{ width: '100%' }}
            >
              Tabelle zurücksetzen
            </button>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>📈 Statistiken zurücksetzen</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Löscht alle Spieler-Statistiken (180er, Shortlegs, High Finish, Average). Tabelle und Spieltage bleiben erhalten.
            </p>
            <button 
              className="btn btn-danger" 
              onClick={handleResetStats}
              style={{ width: '100%' }}
            >
              Statistiken zurücksetzen
            </button>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid #ff3366' }}>
            <h4 style={{ marginBottom: '8px', fontSize: '16px', color: 'var(--accent-dart)' }}>🗑️ Alle Spieltage löschen</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <strong style={{ color: 'var(--accent-dart)' }}>ACHTUNG:</strong> Löscht alle Spieltage und Spiele permanent. Kann NICHT rückgängig gemacht werden!
            </p>
            <button 
              className="btn btn-danger" 
              onClick={handleResetMatchdays}
              style={{ width: '100%', background: 'var(--accent-dart)', fontWeight: 'bold' }}
            >
              ⚠️ Alle Spieltage löschen
            </button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>{editingMatchday ? 'Spieltag bearbeiten' : 'Spieltag erstellen'}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          {editingMatchday 
            ? 'Bearbeite den Spieltag. Änderungen werden sofort gespeichert.' 
            : 'Wähle den Montag als Startdatum. Der Spieltag läuft automatisch bis Sonntag.'}
        </p>
        <input
          type="number"
          placeholder="Woche (z.B. 1)"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {!editingMatchday ? (
          <button className="btn btn-primary" onClick={handleCreateMatchday}>
            Spieltag erstellen (Mo-So)
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleUpdateMatchday}>
              Spieltag aktualisieren
            </button>
            <button className="btn btn-secondary" onClick={handleCloseMatchdayEdit}>
              Abbrechen
            </button>
          </div>
        )}
      </div>

      {/* Spieltag-Bearbeitungs-Modal */}
      {editingMatchday && (
        <div className="card" style={{ border: '2px solid var(--accent-primary)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--accent-primary)' }}>
            📋 Spiele in Woche {editingMatchday.week}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            Klicke auf "Ergebnis ändern" um das Ergebnis eines Spiels zu bearbeiten.
          </p>
          
          {editingMatchdayMatches.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Keine Spiele für diesen Spieltag</p>
          ) : (
            editingMatchdayMatches.map(match => (
              <div key={match.id} style={{ 
                padding: '16px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                marginBottom: '12px',
                border: editingMatch?.id === match.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '16px' }}>{match.player1Name} vs {match.player2Name}</strong>
                    {match.confirmed ? (
                      <span style={{ marginLeft: '12px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                        ✓ {match.player1Legs}:{match.player2Legs}
                      </span>
                    ) : match.player1Submitted || match.player2Submitted ? (
                      <span style={{ marginLeft: '12px', color: '#ed8936' }}>
                        ⏳ Ausstehend
                      </span>
                    ) : (
                      <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>
                        ⏸️ Offen
                      </span>
                    )}
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleEditMatch(match)}
                    style={{ fontSize: '14px', padding: '8px 16px' }}
                  >
                    Ergebnis ändern
                  </button>
                </div>
                
                {/* Inline-Bearbeitung für dieses Match */}
                {editingMatch?.id === match.id && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: 'var(--bg-primary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--accent-primary)'
                  }}>
                    <h4 style={{ marginBottom: '12px', color: 'var(--accent-primary)' }}>Ergebnis bearbeiten</h4>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          {match.player1Name}
                        </label>
                        <input
                          type="number"
                          value={editPlayer1Legs}
                          onChange={(e) => setEditPlayer1Legs(e.target.value)}
                          min="0"
                          max="6"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>:</span>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          {match.player2Name}
                        </label>
                        <input
                          type="number"
                          value={editPlayer2Legs}
                          onChange={(e) => setEditPlayer2Legs(e.target.value)}
                          min="0"
                          max="6"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      Best of 10: Spiel endet bei 6 Legs (z.B. 6:0, 6:1, 6:3) oder 5:5 unentschieden. Setze auf 0:0 zum Zurücksetzen.
                    </p>
                    
                    {/* Statistiken für Player 1 */}
                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '12px', color: 'var(--accent-primary)' }}>
                        Statistiken {match.player1Name}
                      </h4>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Shortleg (Darts)
                          </label>
                          <input
                            type="number"
                            value={editPlayer1Stats.shortlegs}
                            onChange={(e) => setEditPlayer1Stats({ ...editPlayer1Stats, shortlegs: parseInt(e.target.value) || 0 })}
                            min="0"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            180er
                          </label>
                          <input
                            type="number"
                            value={editPlayer1Stats.oneEighties}
                            onChange={(e) => setEditPlayer1Stats({ ...editPlayer1Stats, oneEighties: parseInt(e.target.value) || 0 })}
                            min="0"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            High Finish
                          </label>
                          <input
                            type="number"
                            value={editPlayer1Stats.highFinish}
                            onChange={(e) => setEditPlayer1Stats({ ...editPlayer1Stats, highFinish: parseInt(e.target.value) || 0 })}
                            min="0"
                            max="170"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Average
                          </label>
                          <input
                            type="number"
                            value={editPlayer1Stats.bestOfTen}
                            onChange={(e) => setEditPlayer1Stats({ ...editPlayer1Stats, bestOfTen: parseInt(e.target.value) || 0 })}
                            min="0"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Statistiken für Player 2 */}
                    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '12px', color: 'var(--accent-primary)' }}>
                        Statistiken {match.player2Name}
                      </h4>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Shortleg (Darts)
                          </label>
                          <input
                            type="number"
                            value={editPlayer2Stats.shortlegs}
                            onChange={(e) => setEditPlayer2Stats({ ...editPlayer2Stats, shortlegs: parseInt(e.target.value) || 0 })}
                            min="0"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            180er
                          </label>
                          <input
                            type="number"
                            value={editPlayer2Stats.oneEighties}
                            onChange={(e) => setEditPlayer2Stats({ ...editPlayer2Stats, oneEighties: parseInt(e.target.value) || 0 })}
                            min="0"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            High Finish
                          </label>
                          <input
                            type="number"
                            value={editPlayer2Stats.highFinish}
                            onChange={(e) => setEditPlayer2Stats({ ...editPlayer2Stats, highFinish: parseInt(e.target.value) || 0 })}
                            min="0"
                            max="170"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Average
                          </label>
                          <input
                            type="number"
                            value={editPlayer2Stats.bestOfTen}
                            onChange={(e) => setEditPlayer2Stats({ ...editPlayer2Stats, bestOfTen: parseInt(e.target.value) || 0 })}
                            min="0"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button className="btn btn-primary" onClick={handleSaveMatchResult}>
                        Speichern
                      </button>
                      <button className="btn btn-secondary" onClick={() => setEditingMatch(null)}>
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          
          <button 
            className="btn btn-secondary" 
            onClick={handleCloseMatchdayEdit}
            style={{ marginTop: '12px' }}
          >
            Spieltag-Bearbeitung schließen
          </button>
        </div>
      )}

      <div className="card">
        <h3>Spiel erstellen</h3>
        <select value={selectedMatchday} onChange={(e) => setSelectedMatchday(e.target.value)}>
          <option value="">Spieltag wählen</option>
          {matchdays.map(md => (
            <option key={md.id} value={md.id}>Woche {md.week}</option>
          ))}
        </select>
        <select value={player1} onChange={(e) => setPlayer1(e.target.value)}>
          <option value="">Spieler 1 wählen</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={player2} onChange={(e) => setPlayer2(e.target.value)}>
          <option value="">Spieler 2 wählen</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={handleCreateMatch}>
          Spiel erstellen
        </button>
      </div>

      <div className="card">
        <h3>Spieltage verwalten</h3>
        {matchdays.map(md => (
          <div key={md.id} style={{ 
            padding: '16px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '12px', 
            marginBottom: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Woche {md.week}</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  {new Date(md.startDate?.seconds * 1000).toLocaleDateString('de-DE')} - {new Date(md.endDate?.seconds * 1000).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => handleEditMatchday(md)}>
                  Bearbeiten
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteMatchday(md.id)}>
                  Löschen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPanel
