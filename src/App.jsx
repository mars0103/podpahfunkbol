import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ElencoPage from './pages/ElencoPage'
import KingsLeaguePage from './pages/KingsLeaguePage'
import ParceriasPage from './pages/ParceriasPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/elenco" element={<ElencoPage />} />
        <Route path="/kings-league" element={<KingsLeaguePage />} />
        <Route path="/parcerias" element={<ParceriasPage />} />
      </Route>
    </Routes>
  )
}
