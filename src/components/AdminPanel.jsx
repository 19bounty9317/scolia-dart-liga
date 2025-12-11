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
    setMatchdays(matchdaysData)
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

  if (loading) return <div className="card"><p>Laden...</p></div>
  if (!isAdmin) return <div className="card"><p>Kein Zugriff. Nur für Admins.</p></div>

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '32px' }}>⚙️ Admin-Panel</h2>
      
      <div className="card">
        <h3>Spieltag erstellen</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          Wähle den Montag als Startdatum. Der Spieltag läuft automatisch bis Sonntag.
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
        <button className="btn btn-primary" onClick={handleCreateMatchday}>
          Spieltag erstellen (Mo-So)
        </button>
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
    </div>
  )
}

export default AdminPanel
