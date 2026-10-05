import { useState } from 'react'
import { gameAuth } from '../../lib/campaignApi'
export default function GameAccount({ onSuccess, onBack, resetToken = '' }) {
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login')
  const [fields, setFields] = useState({ username: '', email: '', login: '', password: '' })
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('')
  function changeMode(next) { setMode(next); setError(''); setMessage(''); setFields(f => ({ ...f, password: '' })) }
  const field = name => ({ value: fields[name], onChange: e => setFields({ ...fields, [name]: e.target.value }) })
  async function submit(e) {
    e.preventDefault(); if (busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const data = await gameAuth(mode, { ...fields, token: resetToken })
      if (data.user) onSuccess(data.user)
      else { setMessage(data.message); if (mode === 'reset') { setMode('login'); setFields(f => ({ ...f, password: '' })) } }
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <section className="cp-account"><span className="fb-eyebrow">SUA CONTA. SEU RECORDE.</span>
    <h1>{mode === 'register' ? 'CRIE SEU USUÁRIO' : mode === 'forgot' ? 'ESQUECEU A SENHA?' : mode === 'reset' ? 'NOVA SENHA' : 'ENTRE NO JOGO'}</h1>
    <p>{mode === 'register' ? 'Só o básico para jogar e guardar seu recorde.' : mode === 'forgot' ? 'Vamos enviar um link de recuperação para seu e-mail.' : 'Seu progresso no ranking acompanha você em qualquer dispositivo.'}</p>
    <form onSubmit={submit}>
      {mode === 'register' && <label>Usuário<input autoFocus required aria-label="Usuário" aria-describedby="cp-username-help" autoComplete="username" minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" placeholder="Seu nome no ranking" {...field('username')} /><small id="cp-username-help">3 a 20 letras, números ou underline.</small></label>}
      {mode === 'login' && <label>Usuário ou e-mail<input autoFocus required autoComplete="username" maxLength={254} {...field('login')} /></label>}
      {(mode === 'register' || mode === 'forgot') && <label>E-mail<input type="email" required autoComplete="email" maxLength={254} {...field('email')} /></label>}
      {mode !== 'forgot' && <label>Senha<input aria-label="Senha" type="password" required minLength={mode === 'login' ? 1 : 8} maxLength={64} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...field('password')} />{mode !== 'login' && <small>No mínimo 8 caracteres.</small>}</label>}
      {error && <p className="cp-error" role="alert">{error}</p>}{message && <p className="cp-success" role="status">{message}</p>}
      <button className="fb-primary" disabled={busy}>{busy ? 'AGUARDE…' : mode === 'register' ? 'CRIAR CONTA E JOGAR' : mode === 'forgot' ? 'ENVIAR LINK' : mode === 'reset' ? 'SALVAR NOVA SENHA' : 'ENTRAR'}</button>
    </form>
    {mode === 'login' && <><button className="fb-text-button" onClick={() => changeMode('register')}>Não tenho conta · criar cadastro</button><button className="fb-text-button" onClick={() => changeMode('forgot')}>Esqueci minha senha</button></>}
    {mode !== 'login' && <button className="fb-text-button" onClick={() => changeMode('login')}>Já tenho conta · entrar</button>}
    <button className="fb-text-button" onClick={onBack}>← Voltar à quadra</button>
  </section>
}
