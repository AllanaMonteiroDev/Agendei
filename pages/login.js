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

  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    if (isSignUp) {
     const { data, error } = await supabase.auth.signUp({
  email,
  password,
})

if (!error) {
  const hoje = new Date()

  const vencimento = new Date()
  vencimento.setDate(hoje.getDate() + 7)

  const { error: clienteError } = await supabase
    .from('clientes')
    .insert({
      email,
      nome: email,
      status: 'teste',
      vencimento,
    })

  if (clienteError) {
    console.log(clienteError)
  }
}
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
        .form-group { margin-bottom: 1rem; }
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
