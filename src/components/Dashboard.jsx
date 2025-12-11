import { Routes, Route } from 'react-router-dom'
import Tabelle from './Tabelle'
import Spieltage from './Spieltage'
import Statistiken from './Statistiken'
import Profil from './Profil'
import AdminPanel from './AdminPanel'

function Dashboard({ user }) {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Tabelle />} />
        <Route path="/spieltage" element={<Spieltage user={user} />} />
        <Route path="/statistiken" element={<Statistiken />} />
        <Route path="/profil" element={<Profil user={user} />} />
        <Route path="/admin" element={<AdminPanel user={user} />} />
      </Routes>
    </div>
  )
}

export default Dashboard
