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
        <h1 style={styles.logo}>🎯 Scolia Dart Liga</h1>
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
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  navContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px'
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  link: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: '500',
    transition: 'color 0.3s'
  }
}

export default Navbar
