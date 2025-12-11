import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setError('Login fehlgeschlagen. Bitte überprüfe deine Daten.')
    }
  }

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '80px' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎯</div>
        <h2 style={{ marginBottom: '8px', fontSize: '32px' }}>
          Scolia Dart Liga
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Willkommen zurück!</p>
        <h3 style={{ marginBottom: '24px', textAlign: 'left' }}>Login</h3>
        {error && <p style={{ color: '#f56565', marginBottom: '10px' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Einloggen
          </button>
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Noch kein Account? <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>Registrieren</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
