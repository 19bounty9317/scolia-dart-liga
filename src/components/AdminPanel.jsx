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

  useEffect(() => {
    checkAdmin()
  }, [user])

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
    setMatchdays(matchdaysData.sort((a, b) => b.week - a.week))
    
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
    console.log('Editing matchday:', matchday)
    try {
      setEditingMatchday(matchday)
      setWeek(matchday.week.toString())
      
      // Handle different date formats
      let startDate
      if (matchday.startDate?.seconds) {
        // Firestore Timestamp
        startDate = new Date(matchday.startDate.seconds * 1000)
      } else if (matchday.startDate?.toDate) {
        // Firestore Timestamp object
        startDate = matchday.startDate.toDate()
      } else if (matchday.startDate) {
        // Regular Date or string
        startDate = new Date(matchday.startDate)
      } else {
        startDate = new Date()
      }
      
      const dateString = startDate.toISOString().split('T')[0]
      console.log('Setting date to:', dateString)
      setDate(dateString)
    } catch (err) {
      console.error('Fehler beim Bearbeiten:', err)
      alert('Fehler beim Laden der Daten: ' + err.message)
    }
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

  if (loading) return <div className="card"><p>Laden...</p></div>
  if (!isAdmin) return <div className="card"><p>Kein Zugriff. Nur für Admins.</p></div>

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '32px' }}>⚙️ Admin-Panel</h2>
      
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
            <button className="btn btn-secondary" onClick={() => {
              setEditingMatchday(null)
              setWeek('')
              setDate('')
            }}>
              Abbrechen
            </button>
          </div>
        )}
      </div>

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

      <div className="card">
        <h3>Spiele verwalten</h3>
        {matches.map(match => (
          <div key={match.id} style={{ 
            padding: '16px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '12px', 
            marginBottom: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ fontSize: '16px' }}>{match.player1Name} vs {match.player2Name}</strong>
              
              {match.confirmed && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '18px' }}>
                    ✓ Bestätigt: {match.player1Legs}:{match.player2Legs}
                  </span>
                </div>
              )}
              
              {!match.confirmed && (match.player1Submitted || match.player2Submitted) && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <p style={{ color: '#ed8936', fontWeight: 'bold', marginBottom: '8px' }}>⏳ Ausstehende Bestätigung</p>
                  
                  {match.player1Submitted && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--accent-primary)' }}>{match.player1Name}:</strong>
                      <span style={{ marginLeft: '8px', color: 'var(--text-primary)' }}>
                        {match.player1Legs}:{match.player2Legs}
                      </span>
                      {match.player1Stats && (
                        <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          (SL: {match.player1Stats.shortlegs}, 180: {match.player1Stats.oneEighties}, 
                          HF: {match.player1Stats.highFinish}, Avg: {match.player1Stats.bestOfTen})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {match.player2Submitted && (
                    <div>
                      <strong style={{ color: 'var(--accent-primary)' }}>{match.player2Name}:</strong>
                      <span style={{ marginLeft: '8px', color: 'var(--text-primary)' }}>
                        {match.player2LegsSubmitted}:{match.player1LegsSubmitted}
                      </span>
                      {match.player2Stats && (
                        <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          (SL: {match.player2Stats.shortlegs}, 180: {match.player2Stats.oneEighties}, 
                          HF: {match.player2Stats.highFinish}, Avg: {match.player2Stats.bestOfTen})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {match.player1Submitted && match.player2Submitted && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'var(--accent-dart)', borderRadius: '6px' }}>
                      <strong style={{ color: 'white' }}>⚠️ Ergebnisse stimmen nicht überein!</strong>
                      <p style={{ color: 'white', fontSize: '13px', marginTop: '4px' }}>
                        {match.player1Name}: {match.player1Legs}:{match.player2Legs} | 
                        {match.player2Name}: {match.player2LegsSubmitted}:{match.player1LegsSubmitted}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {!match.player1Submitted && !match.player2Submitted && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    ⏸️ Noch keine Eingaben
                  </span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => handleResetMatch(match.id)}>
                Zurücksetzen
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteMatch(match.id)}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPanel
