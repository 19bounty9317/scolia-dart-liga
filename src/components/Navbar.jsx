import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

function Navbar({ user }) {
  const handleLogout = async () => {
    await signOut(auth)
  }

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.navContent}>
        <h1 style={styles.logo}>Scolia Dart Liga</h1>
        <div style={styles.navLinks}>
          <Link to="/" style={styles.link}>Tabelle</Link>
          <Link to="/spieltage" style={styles.link}>Spieltage</Link>
          <Link to="/statistiken" style={styles.link}>Statistiken</Link>
          <Link to="/profil" style={styles.link}>Profil</Link>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: 'linear-gradient(135deg, #1a2142 0%, #0a0e27 100%)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(0, 255, 136, 0.2)'
  },
  navContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px'
  },
  logo: {
    fontSize: '28px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  link: {
    textDecoration: 'none',
    color: '#a0aec0',
    fontWeight: '600',
    transition: 'all 0.3s',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }
}

export default Navbar
