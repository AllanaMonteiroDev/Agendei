import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/app')
    })
  }, [])

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: 'https://agendei-peach.vercel.app/app',
        skipBrowserRedirect: false
      }
    })
    if (error) { setMessage(error.message); setLoading(false) }
  }

  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Verifique seu e-mail para confirmar o cadastro!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage('E-mail ou senha incorretos.')
      else router.push('/app')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: 'DM Sans', sans-serif;
          background: #FDF8F5;
          min-height: 100vh;
        }
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.25rem;
        }
        .back {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #9B6B7A;
          font-size: 14px;
          cursor: pointer;
          background: none;
          border: none;
          font-family: inherit;
          margin-bottom: 2rem;
        }
        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          color: #C2185B;
          font-weight: 700;
          text-align: center;
          margin-bottom: 4px;
        }
        .tagline {
          color: #9B6B7A;
          font-size: 14px;
          text-align: center;
          font-weight: 300;
          margin-bottom: 2rem;
        }
        .card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          width: 100%;
          max-width: 380px;
          border: 1px solid rgba(194,24,91,0.1);
          box-shadow: 0 4px 24px rgba(194,24,91,0.06);
        }
        .title {
          font-size: 18px;
          font-weight: 500;
          color: #1A0A0F;
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .btn-google {
          width: 100%;
          padding: 13px;
          background: white;
          color: #1A0A0F;
          border: 1px solid #e8e0e4;
          border-radius: 99px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: inherit;
          margin-bottom: 1.25rem;
          transition: background 0.15s;
        }
        .btn-google:hover { background: #FDF8F5; }
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.25rem;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: #e8e0e4;
        }
        .divider-text {
          color: #9B6B7A;
          font-size: 13px;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .label {
          display: block;
          font-size: 13px;
          color: #9B6B7A;
          margin-bottom: 6px;
        }
        .input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #e8e0e4;
          background: #FDF8F5;
          font-size: 15px;
          color: #1A0A0F;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: #C2185B; }
        .msg {
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .msg.err { background: #FDECEA; color: #C62828; }
        .msg.ok { background: #E8F5E9; color: #2E7D32; }
        .btn-main {
          width: 100%;
          padding: 13px;
          background: #C2185B;
          color: white;
          border: none;
          border-radius: 99px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          margin-top: 0.25rem;
          transition: background 0.15s;
        }
        .btn-main:hover { background: #880E4F; }
        .btn-main:disabled { opacity: 0.7; }
        .switch {
          text-align: center;
          margin-top: 1.25rem;
          font-size: 14px;
          color: #9B6B7A;
        }
        .switch-link {
          color: #C2185B;
          cursor: pointer;
          font-weight: 500;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #9B6B7A;
          margin-top: 1.5rem;
          max-width: 380px;
        }
        .footer a { color: #C2185B; text-decoration: none; }
      `}</style>

      <div className="page">
        <button className="back" onClick={() => router.push('/')}>← Voltar</button>

        <div className="logo">agendei</div>
        <p className="tagline">Sua agenda profissional</p>

        <div className="card">
          <h2 className="title">{isSignUp ? 'Criar conta grátis' : 'Entrar na sua conta'}</h2>

          <button className="btn-google" onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3-11.4-7.2l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            {loading ? 'Aguarde...' : 'Entrar com Google'}
          </button>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">ou</span>
            <div className="divider-line" />
          </div>

          <form onSubmit={handleEmail}>
            <div className="form-group">
              <label className="label">E-mail</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required />
            </div>
            <div className="form-group">
              <label className="label">Senha</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} />
            </div>
            {message && (
              <div className={`msg ${message.includes('incorretos') || message.includes('erro') ? 'err' : 'ok'}`}>
                {message}
              </div>
            )}
            <button className="btn-main" type="submit" disabled={loading}>
              {loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <div className="switch">
            {isSignUp ? 'Já tem conta? ' : 'Ainda não tem conta? '}
            <span className="switch-link" onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}>
              {isSignUp ? 'Entrar' : 'Criar grátis'}
            </span>
          </div>
        </div>

        <p className="footer">
          Ao entrar, você concorda com os{' '}
          <a href="/termos">Termos de Uso</a> e a{' '}
          <a href="/privacidade">Política de Privacidade</a>
        </p>
      </div>
    </>
  )
}