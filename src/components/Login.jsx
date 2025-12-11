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
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#667eea' }}>
          🎯 Scolia Dart Liga
        </h2>
        <h3 style={{ marginBottom: '20px' }}>Login</h3>
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
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Noch kein Account? <Link to="/register" style={{ color: '#667eea' }}>Registrieren</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
