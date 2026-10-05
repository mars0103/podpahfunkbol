import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ElencoPage from './pages/ElencoPage'
import KingsLeaguePage from './pages/KingsLeaguePage'
import ParceriasPage from './pages/ParceriasPage'
import BlogPostPage from './pages/BlogPostPage'
import BlogAdminPage from './pages/BlogAdminPage'
import GamePage from './pages/GamePage'
import AdminLayout from './pages/admin/AdminLayout'
import DinoPhrasesAdminPage from './pages/admin/DinoPhrasesAdminPage'
import MatchesAdminPage from './pages/admin/MatchesAdminPage'
import StandingsAdminPage from './pages/admin/StandingsAdminPage'
import TeamsAdminPage from './pages/admin/TeamsAdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/jogo" element={<GamePage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/elenco" element={<ElencoPage />} />
        <Route path="/kings-league" element={<KingsLeaguePage />} />
        <Route path="/parcerias" element={<ParceriasPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="blog" element={<BlogAdminPage />} />
        <Route path="times" element={<TeamsAdminPage />} />
        <Route path="dino" element={<DinoPhrasesAdminPage />} />
        <Route path="jogos" element={<MatchesAdminPage />} />
        <Route path="tabela" element={<StandingsAdminPage />} />
      </Route>
    </Routes>
  )
}
