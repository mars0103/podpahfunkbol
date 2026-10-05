import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../../lib/api'
import crest from '../../assets/vetorescudo.png'

export default function AdminAuthGuard({ children }) {
  const [status, setStatus] = useState('checking')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet('/auth/me.php')
      .then((data) => setStatus(data.authenticated ? 'authenticated' : 'anonymous'))
      .catch(() => setStatus('offline'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await apiPost('/auth/login.php', { username, password })
      setStatus('authenticated')
    } catch (err) {
      setError(err.message)
    }
  }

  if (status === 'checking') {
    return <div className="admin-login-wrap">Carregando...</div>
  }

  if (status === 'offline') {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <h1>Painel indisponível</h1>
          <p>
            Não foi possível conectar ao servidor local (XAMPP). Confirme que o Apache e o MySQL estão rodando e
            recarregue a página.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'anonymous') {
    return (
      <div className="admin-login-wrap">
        <img className="admin-login-crest" src={crest} alt="Podpah Funkbol Clube" />
        <form className="admin-login-card" onSubmit={handleSubmit}>
          <h1>Painel Podpah Funkbol</h1>
          <label>
            Usuário
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit">Entrar</button>
        </form>
      </div>
    )
  }

  return children
}
