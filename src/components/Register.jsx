import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: name })
      
      await setDoc(doc(db, 'players', userCredential.user.uid), {
        name,
        email,
        isAdmin: false,
        isTestAccount: false,
        stats: {
          shortlegs: 0,
          oneEighties: 0,
          highFinish: 0,
          bestOfTen: 0
        },
        createdAt: new Date()
      })
      
      navigate('/')
    } catch (err) {
      setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
    }
  }

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '80px' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎯</div>
        <h2 style={{ marginBottom: '8px', fontSize: '32px' }}>
          Scolia Dart Liga
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Werde Teil der Liga!</p>
        <h3 style={{ marginBottom: '24px', textAlign: 'left' }}>Registrierung</h3>
        {error && <p style={{ color: '#f56565', marginBottom: '10px' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Passwort (min. 6 Zeichen)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Registrieren
          </button>
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Bereits registriert? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
