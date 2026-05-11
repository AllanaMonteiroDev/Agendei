import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const AREAS = [
  { id: 'manicure', label: 'Manicure', icon: '💅', servicos: ['Manicure','Pedicure','Gel','Fibra de vidro','Unhas decoradas','Nail art'] },
  { id: 'designer_grafico', label: 'Designer Gráfico', icon: '🎨', servicos: ['Logo','Social media','Identidade visual','Banner','Ilustração','Edição de foto'] },
  { id: 'sobrancelha', label: 'Designer de Sobrancelha', icon: '👁️', servicos: ['Design de sobrancelha','Henna','Micropigmentação','Laminação','Depilação'] },
  { id: 'diarista', label: 'Diarista', icon: '🧹', servicos: ['Faxina completa','Faxina parcial','Organização','Pós-obra','Limpeza de vidros'] },
  { id: 'cabeleireira', label: 'Cabeleireira', icon: '✂️', servicos: ['Corte','Coloração','Hidratação','Escova','Progressiva','Tranças','Luzes'] },
  { id: 'esteticista', label: 'Esteticista', icon: '🌿', servicos: ['Limpeza de pele','Depilação','Massagem','Drenagem linfática','Peeling'] },
  { id: 'confeiteira', label: 'Confeiteira', icon: '🎂', servicos: ['Bolo personalizado','Cupcake','Brigadeiro','Torta','Doces finos','Naked cake'] },
  { id: 'fotografa', label: 'Fotógrafa', icon: '📸', servicos: ['Ensaio feminino','Ensaio família','Aniversário','Gestante','Produto','15 anos'] },
  { id: 'costureira', label: 'Costureira', icon: '👗', servicos: ['Ajuste','Roupa sob medida','Conserto','Customização','Bordado'] },
  { id: 'massoterapeuta', label: 'Massoterapeuta', icon: '💆', servicos: ['Massagem relaxante','Drenagem','Reflexologia','Shiatsu','Pedras quentes'] },
  { id: 'social_media', label: 'Social Media', icon: '💻', servicos: ['Criação de conteúdo','Stories','Feed','Reels','Gestão de perfil'] },
  { id: 'outro', label: 'Outro', icon: '✏️', servicos: [] },
]

export default function AppPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('agenda')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [showAreaPicker, setShowAreaPicker] = useState(false)
  const [conflictWarning, setConflictWarning] = useState(null)

  const [form, setForm] = useState({
    name: '', service: '', customService: '', date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00', value: '', phone: ''
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      loadData(session.user.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        loadData(session.user.id)
      } else {
        router.push('/login')
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadData(userId) {
    setLoading(true)
    const [{ data: apts }, { data: cls }, { data: prof }] = await Promise.all([
      supabase.from('appointments').select('*').eq('user_id', userId).order('date').order('time'),
      supabase.from('clients').select('*').eq('user_id', userId).order('name'),
      supabase.from('profiles').select('*').eq('user_id', userId).single()
    ])
    setAppointments(apts || [])
    setClients(cls || [])
    if (prof) {
      setProfile(prof)
      const area = AREAS.find(a => a.id === prof.area)
      if (area && area.servicos.length > 0) setForm(f => ({ ...f, service: area.servicos[0] }))
    } else {
      setShowAreaPicker(true)
    }
    setLoading(false)
  }

  async function saveArea(areaId) {
    const { data } = await supabase.from('profiles').insert({
      user_id: user.id, area: areaId
    }).select().single()
    setProfile(data)
    setShowAreaPicker(false)
    const area = AREAS.find(a => a.id === areaId)
    if (area && area.servicos.length > 0) setForm(f => ({ ...f, service: area.servicos[0] }))
  }

  function checkConflict(date, time) {
    return appointments.filter(a => {
      const aDate = a.date?.split('T')[0] || a.date
      const aTime = a.time?.slice(0, 5) || a.time
      const checkTime = time?.slice(0, 5) || time
      return aDate === date && aTime === checkTime
    })
  }

  async function saveAppointment(force = false) {
    const servicoFinal = form.service === 'outro' ? form.customService : form.service
    if (!form.name || !form.date || !form.time || !servicoFinal) return

    if (!force) {
      const conflicts = checkConflict(form.date, form.time)
      if (conflicts.length > 0) {
        setConflictWarning(conflicts)
        return
      }
    }

    setSaving(true)
    setConflictWarning(null)
    const apt = {
      user_id: user.id, name: form.name, service: servicoFinal,
      date: form.date, time: form.time, value: parseFloat(form.value) || 0,
      phone: form.phone, status: 'pending'
    }
    const { data, error } = await supabase.from('appointments').insert(apt).select()
    if (!error && data) {
      setAppointments(prev => [...prev, data[0]])
      const existing = clients.find(c => c.name.toLowerCase() === form.name.toLowerCase())
      if (existing) {
        await supabase.from('clients').update({ total: existing.total + apt.value, visits: existing.visits + 1 }).eq('id', existing.id)
        setClients(prev => prev.map(c => c.id === existing.id ? { ...c, total: c.total + apt.value, visits: c.visits + 1 } : c))
      } else {
        const { data: newClient } = await supabase.from('clients').insert({
          user_id: user.id, name: form.name, service: servicoFinal,
          phone: form.phone, total: apt.value, visits: 1
        }).select()
        if (newClient) setClients(prev => [...prev, newClient[0]])
      }
      setSelectedDate(parseISO(form.date))
      setModalOpen(false)
      const area = AREAS.find(a => a.id === profile?.area)
      setForm({
        name: '', service: area?.servicos[0] || '', customService: '',
        date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', value: '', phone: ''
      })
    }
    setSaving(false)
  }

  async function confirmApt(id) {
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a))
  }

  async function deleteApt(id) {
    await supabase.from('appointments').delete().eq('id', id)
    setAppointments(prev => prev.filter(a => a.id !== id))
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const currentArea = AREAS.find(a => a.id === profile?.area)
  const servicos = currentArea ? [...currentArea.servicos, 'Outro (personalizado)'] : []

  const todayApts = appointments.filter(a => {
    try { return isSameDay(parseISO(a.date), selectedDate) } catch { return false }
  }).sort((a, b) => a.time.localeCompare(b.time))

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const thisMonth = new Date()
  const monthApts = appointments.filter(a => {
    try {
      const d = parseISO(a.date)
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear()
    } catch { return false }
  })
  const monthTotal = monthApts.reduce((s, a) => s + (a.value || 0), 0)

  const serviceCount = {}
  monthApts.forEach(a => { serviceCount[a.service] = (serviceCount[a.service] || 0) + 1 })
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const maxCount = topServices[0]?.[1] || 1

  const dateRange = Array.from({ length: 10 }, (_, i) => addDays(subDays(new Date(), 1), i))

  function openModal() {
    setForm(f => ({ ...f, date: format(selectedDate, 'yyyy-MM-dd') }))
    setConflictWarning(null)
    setModalOpen(true)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, background: '#F8F4F6' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #FCE4EC', borderTop: '3px solid #C2185B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#666', fontSize: 14 }}>Carregando...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (showAreaPicker) return (
    <div style={{ minHeight: '100vh', background: '#FDF8F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A0A0F', marginBottom: 8, textAlign: 'center' }}>Bem-vinda ao Agendei!</h1>
      <p style={{ color: '#9B6B7A', fontSize: 15, marginBottom: 2, textAlign: 'center' }}>Qual é a sua área de atuação?</p>
      <p style={{ color: '#9B6B7A', fontSize: 13, marginBottom: 2, textAlign: 'center' }}>Você só precisa escolher uma vez.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400, marginTop: 24 }}>
        {AREAS.map(area => (
          <button key={area.id} onClick={() => saveArea(area.id)} style={{
            background: 'white', border: '1px solid rgba(194,24,91,0.15)',
            borderRadius: 16, padding: '1rem', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            transition: 'all 0.15s', fontFamily: 'inherit'
          }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#C2185B'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(194,24,91,0.15)'}
          >
            <span style={{ fontSize: 28 }}>{area.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1A0A0F', textAlign: 'center' }}>{area.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8F4F6; }
        .app { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #F8F4F6; }
        .header { background: #C2185B; color: white; padding: 1rem 1.25rem 0.75rem; position: sticky; top: 0; z-index: 10; }
        .header-top { display: flex; align-items: center; justify-content: space-between; }
        .logo { font-size: 20px; font-weight: 700; }
        .logo span { font-weight: 300; opacity: 0.8; font-size: 14px; }
        .header-sub { font-size: 12px; opacity: 0.8; margin-top: 3px; }
        .tabs { display: flex; background: white; border-bottom: 1px solid #e8e0e4; }
        .tab { flex: 1; padding: 0.75rem 0.5rem; text-align: center; font-size: 13px; font-weight: 500; color: #666; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; background: none; border-top: none; border-left: none; border-right: none; font-family: inherit; }
        .tab.active { color: #C2185B; border-bottom-color: #C2185B; }
        .content { padding: 1rem; padding-bottom: 100px; }
        .date-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 1rem; scrollbar-width: none; }
        .date-strip::-webkit-scrollbar { display: none; }
        .date-pill { flex-shrink: 0; width: 50px; padding: 8px 4px; border-radius: 12px; text-align: center; cursor: pointer; border: 1px solid #e8e0e4; background: white; transition: all 0.15s; }
        .date-pill.selected { background: #C2185B; border-color: #C2185B; color: white; }
        .date-pill .dname { font-size: 10px; color: #666; }
        .date-pill.selected .dname { color: rgba(255,255,255,0.8); }
        .date-pill .dnum { font-size: 18px; font-weight: 500; }
        .date-pill.has-apt::after { content: '•'; display: block; font-size: 12px; color: #C2185B; line-height: 1; }
        .date-pill.selected.has-apt::after { color: rgba(255,255,255,0.9); }
        .section-title { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem; margin-top: 1rem; }
        .section-title:first-child { margin-top: 0; }
        .card { background: white; border-radius: 12px; border: 1px solid #e8e0e4; padding: 1rem 1.25rem; margin-bottom: 0.75rem; cursor: pointer; transition: transform 0.15s; display: flex; align-items: center; gap: 1rem; }
        .card:active { transform: scale(0.98); }
        .apt-time { text-align: center; min-width: 42px; }
        .apt-time .hour { font-size: 16px; font-weight: 500; }
        .apt-time .min { font-size: 12px; color: #666; }
        .apt-bar { width: 3px; height: 44px; border-radius: 3px; background: #C2185B; }
        .apt-bar.pending { background: #EF9F27; }
        .apt-info { flex: 1; }
        .apt-name { font-size: 15px; font-weight: 500; }
        .apt-service { font-size: 13px; color: #666; margin-top: 2px; }
        .badge { font-size: 11px; padding: 3px 8px; border-radius: 99px; font-weight: 500; }
        .badge.confirmed { background: #E8F5E9; color: #2E7D32; }
        .badge.pending { background: #FFF8E1; color: #F57F17; }
        .empty { text-align: center; padding: 2.5rem 1rem; color: #666; }
        .empty .icon { font-size: 40px; margin-bottom: 0.75rem; }
        .fab { position: fixed; bottom: 5rem; right: calc(50% - 240px + 1.25rem); width: 56px; height: 56px; border-radius: 50%; background: #C2185B; color: white; border: none; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(194,24,91,0.4); z-index: 50; transition: transform 0.15s; }
        @media (max-width: 480px) { .fab { right: 1.25rem; } }
        .fab:active { transform: scale(0.92); }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: white; border-top: 1px solid #e8e0e4; display: flex; z-index: 40; }
        .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 10px 8px; cursor: pointer; color: #666; font-size: 10px; gap: 3px; background: none; border: none; transition: color 0.15s; font-family: inherit; }
        .nav-item.active { color: #C2185B; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
        .overlay.open { opacity: 1; pointer-events: all; }
        .modal { background: white; border-radius: 16px 16px 0 0; padding: 1.25rem; width: 100%; transform: translateY(100%); transition: transform 0.25s; max-height: 92vh; overflow-y: auto; }
        .overlay.open .modal { transform: translateY(0); }
        .modal-handle { width: 36px; height: 4px; background: #e8e0e4; border-radius: 2px; margin: 0 auto 1.25rem; }
        .modal-title { font-size: 18px; font-weight: 600; margin-bottom: 1.25rem; }
        .form-group { margin-bottom: 1rem; }
        .form-label { font-size: 13px; color: #666; margin-bottom: 4px; display: block; }
        .form-input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #e8e0e4; background: #F8F4F6; font-size: 15px; color: #1a1a1a; font-family: inherit; outline: none; }
        .form-input:focus { border-color: #C2185B; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .btn-primary { width: 100%; padding: 13px; background: #C2185B; color: white; border: none; border-radius: 99px; font-size: 15px; font-weight: 500; cursor: pointer; margin-top: 0.5rem; font-family: inherit; }
        .btn-secondary { width: 100%; padding: 11px; background: transparent; color: #666; border: 1px solid #e8e0e4; border-radius: 99px; font-size: 14px; cursor: pointer; margin-top: 0.5rem; font-family: inherit; }
        .avatar { width: 42px; height: 42px; border-radius: 50%; background: #FCE4EC; color: #C2185B; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0; }
        .client-info { flex: 1; }
        .client-name { font-size: 15px; font-weight: 500; }
        .client-detail { font-size: 13px; color: #666; margin-top: 2px; }
        .client-total { text-align: right; }
        .client-total .amount { font-size: 15px; font-weight: 600; color: #C2185B; }
        .client-total .label { font-size: 11px; color: #666; }
        .search-bar { background: white; border: 1px solid #e8e0e4; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
        .search-bar input { border: none; background: transparent; flex: 1; font-size: 14px; color: #1a1a1a; outline: none; font-family: inherit; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }
        .stat-card { background: white; border-radius: 12px; border: 1px solid #e8e0e4; padding: 1rem; }
        .stat-label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .stat-value { font-size: 24px; font-weight: 600; }
        .stat-value.pink { color: #C2185B; }
        .conflict-warning { background: #FFF8E1; border: 1px solid #F59F00; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
        .conflict-title { font-size: 13px; font-weight: 600; color: #854F0B; margin-bottom: 6px; }
        .conflict-text { font-size: 12px; color: #854F0B; margin-bottom: 10px; }
        .conflict-btns { display: flex; gap: 8px; }
        .conflict-btn-cancel { flex: 1; padding: 8px; background: transparent; border: 1px solid #e8e0e4; border-radius: 99px; font-size: 13px; cursor: pointer; font-family: inherit; }
        .conflict-btn-confirm { flex: 1; padding: 8px; background: #EF9F27; color: white; border: none; border-radius: 99px; font-size: 13px; cursor: pointer; font-family: inherit; font-weight: 500; }
      `}</style>

      <div className="app">
        <div className="header">
          <div className="header-top">
            <div className="logo">
              agendei<span>.pro</span>
              {currentArea && <span style={{ marginLeft: 8, fontSize: 16 }}>{currentArea.icon}</span>}
            </div>
            <button onClick={signOut} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 13, opacity: 0.8 }}>Sair</button>
          </div>
          <div className="header-sub">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </div>
        </div>

        <div className="tabs">
          {[['agenda', '📅', 'Agenda'], ['clientes', '👥', 'Clientes'], ['resumo', '📊', 'Resumo']].map(([id, icon, label]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              {icon} {label}
            </button>
          ))}
        </div>

        {tab === 'agenda' && (
          <div className="content">
            <div className="date-strip">
              {dateRange.map(d => {
                const ds = format(d, 'yyyy-MM-dd')
                const isSelected = isSameDay(d, selectedDate)
                const hasApt = appointments.some(a => a.date === ds)
                return (
                  <div key={ds} className={`date-pill ${isSelected ? 'selected' : ''} ${hasApt ? 'has-apt' : ''}`}
                    onClick={() => setSelectedDate(d)}>
                    <div className="dname">{DIAS[d.getDay()]}</div>
                    <div className="dnum">{d.getDate()}</div>
                  </div>
                )
              })}
            </div>

            <div className="section-title">
              {isSameDay(selectedDate, new Date()) ? 'Hoje' : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              {' '}— {todayApts.length} agendamento{todayApts.length !== 1 ? 's' : ''}
            </div>

            {todayApts.length === 0 ? (
              <div className="empty">
                <div className="icon">📭</div>
                <p>Nenhum agendamento neste dia</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Toque no + para adicionar</p>
              </div>
            ) : todayApts.map(a => (
              <div key={a.id} className="card" onClick={() => {
                if (window.confirm(`${a.name} — ${a.service}\n${a.time}h · R$${a.value}\n\nOK = Confirmar | Cancelar = Excluir`)) {
                  confirmApt(a.id)
                } else {
                  if (window.confirm('Excluir este agendamento?')) deleteApt(a.id)
                }
              }}>
                <div className="apt-time">
                  <div className="hour">{a.time.slice(0, 2)}</div>
                  <div className="min">{a.time.slice(3, 5)}h</div>
                </div>
                <div className={`apt-bar ${a.status === 'pending' ? 'pending' : ''}`} />
                <div className="apt-info">
                  <div className="apt-name">{a.name}</div>
                  <div className="apt-service">{a.service} · R${a.value}</div>
                </div>
                <span className={`badge ${a.status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                  {a.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'clientes' && (
          <div className="content">
            <div className="search-bar">
              <span>🔍</span>
              <input type="text" placeholder="Buscar cliente..." value={clientSearch}
                onChange={e => setClientSearch(e.target.value)} />
            </div>
            <div className="section-title">{filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}</div>
            {filteredClients.length === 0 ? (
              <div className="empty"><div className="icon">👤</div><p>Nenhuma cliente encontrada</p></div>
            ) : filteredClients.map(c => (
              <div key={c.id} className="card">
                <div className="avatar">{c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                <div className="client-info">
                  <div className="client-name">{c.name}</div>
                  <div className="client-detail">{c.service} · {c.visits} visita{c.visits !== 1 ? 's' : ''}</div>
                  {c.phone && <div className="client-detail">📱 {c.phone}</div>}
                </div>
                <div className="client-total">
                  <div className="amount">R${c.total}</div>
                  <div className="label">total</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'resumo' && (
          <div className="content">
            <div className="section-title">{format(thisMonth, "MMMM 'de' yyyy", { locale: ptBR })}</div>
            <div className="stat-grid">
              <div className="stat-card"><div className="stat-label">Agendamentos</div><div className="stat-value">{monthApts.length}</div></div>
              <div className="stat-card"><div className="stat-label">Recebido</div><div className="stat-value pink">R${monthTotal.toFixed(0)}</div></div>
              <div className="stat-card"><div className="stat-label">Total de clientes</div><div className="stat-value">{clients.length}</div></div>
              <div className="stat-card"><div className="stat-label">Confirmados</div><div className="stat-value">{monthApts.filter(a => a.status === 'confirmed').length}</div></div>
            </div>
            {topServices.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: '1.25rem' }}>Serviços mais pedidos</div>
                {topServices.map(([name, count]) => (
                  <div key={name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{name}</span><span style={{ color: '#666' }}>{count}x</span>
                    </div>
                    <div style={{ background: '#FCE4EC', borderRadius: 4, height: 8 }}>
                      <div style={{ background: '#C2185B', height: 8, borderRadius: 4, width: `${Math.round(count / maxCount * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </>
            )}
            {monthApts.length === 0 && <div className="empty"><div className="icon">📊</div><p>Nenhum dado este mês ainda</p></div>}
          </div>
        )}

        <button className="fab" onClick={openModal}>+</button>

        <nav className="bottom-nav">
          {[['agenda', '📅', 'Agenda'], ['clientes', '👥', 'Clientes'], ['resumo', '📊', 'Resumo']].map(([id, icon, label]) => (
            <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className={`overlay ${modalOpen ? 'open' : ''}`} onClick={e => { if (e.target.classList.contains('overlay')) { setModalOpen(false); setConflictWarning(null) } }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Novo agendamento</div>

            {conflictWarning && (
              <div className="conflict-warning">
                <div className="conflict-title">⚠️ Horário já ocupado!</div>
                <div className="conflict-text">
                  {conflictWarning.map(c => `${c.name} (${c.service})`).join(', ')} já está marcado nesse horário. Deseja marcar mesmo assim?
                </div>
                <div className="conflict-btns">
                  <button className="conflict-btn-cancel" onClick={() => setConflictWarning(null)}>Mudar horário</button>
                  <button className="conflict-btn-confirm" onClick={() => saveAppointment(true)}>Marcar mesmo assim</button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nome da cliente</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Maria Silva" />
            </div>

            <div className="form-group">
              <label className="form-label">Serviço</label>
              <select className="form-input" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
                {servicos.map(s => <option key={s} value={s === 'Outro (personalizado)' ? 'outro' : s}>{s}</option>)}
              </select>
            </div>

            {form.service === 'outro' && (
              <div className="form-group">
                <label className="form-label">Descreva o serviço</label>
                <input className="form-input" value={form.customService} onChange={e => setForm(f => ({ ...f, customService: e.target.value }))} placeholder="Ex: Alongamento em gel" />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Horário</label>
                <input className="form-input" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input className="form-input" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="Ex: 55" />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone (opcional)</label>
              <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(14) 99999-9999" />
            </div>

            <button className="btn-primary" onClick={() => saveAppointment(false)} disabled={saving}>
              {saving ? 'Salvando...' : 'Confirmar agendamento'}
            </button>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); setConflictWarning(null) }}>Cancelar</button>
          </div>
        </div>
      </div>
    </>
  )
}