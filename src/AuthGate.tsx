import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'

type AuthGateProps = {
  children: ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return

      if (error) {
        setMessage('Oturum kontrol edilemedi: ' + error.message)
      }

      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return

      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Giriş yapılıyor...')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage('Giriş yapılamadı: ' + error.message)
    } else {
      setPassword('')
      setMessage('')
    }
  }

  if (loading) {
    return <main style={{ padding: 30 }}>FNDEPO AÇILIYOR...</main>
  }

  if (!session) {
    return (
      <main style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
        <h1>FNDEPO</h1>
        <h2>Giriş Yap</h2>

        <form onSubmit={handleLogin}>
          <label>
            E-posta
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Şifre
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {message && <p role="status">{message}</p>}

          <button type="submit" className="primary">
            Giriş Yap
          </button>
        </form>
      </main>
    )
  }

  return <>{children}</>
}