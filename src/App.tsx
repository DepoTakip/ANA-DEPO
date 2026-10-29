import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { ExcelImportPage } from './src/ExcelImportPage'
import './App.css'

type Stock = {
  code: string
  name: string
  barcode: string
  unit: string
  description: string
  quantity: number
}

type StockMovement = {
  id: number
  stock_code: string
  movement_type: 'GIRIS' | 'CIKIS'
  quantity: number
  notes: string
  created_by_name: string
  created_at: string
}

type ShelfAssignment = {
  id: string
  shelf_code: string
  stock_code: string
  quantity: number
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'stocks' | 'shelves' | 'control' | 'movements' | 'settings' | 'excel-import'>('home')

  const [stocks, setStocks] = useState<Stock[]>(() => {
    try {
      const saved = localStorage.getItem('depotakip_stocks')
      return saved ? (JSON.parse(saved) as Stock[]) : []
    } catch {
      return []
    }
  })

  const [shelves, setShelves] = useState<ShelfAssignment[]>(() => {
    try {
      const saved = localStorage.getItem('depotakip_shelves')
      return saved ? (JSON.parse(saved) as ShelfAssignment[]) : []
    } catch {
      return []
    }
  })

  const [cardSearch, setCardSearch] = useState('')
  const [selectedStockCard, setSelectedStockCard] = useState<Stock | null>(null)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [unit, setUnit] = useState('Adet')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [syncing, setSyncing] = useState(true)

  const [movementSearch, setMovementSearch] = useState('')
  const [movementStockCode, setMovementStockCode] = useState('')
  const [movementType, setMovementType] = useState<'GIRIS' | 'CIKIS'>('GIRIS')
  const [movementQuantity, setMovementQuantity] = useState('')
  const [movementNotes, setMovementNotes] = useState('')
  const [movementMessage, setMovementMessage] = useState('')
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  const [shelfSearch, setShelfSearch] = useState('')
  const [shelfStockCode, setShelfStockCode] = useState('')
  const [shelfCodeInput, setShelfCodeInput] = useState('')
  const [shelfQuantityInput, setShelfQuantityInput] = useState('')
  const [shelfMessage, setShelfMessage] = useState('')

  const [controlSearch, setControlSearch] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSessionLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setSessionLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
      if (!session?.user) {
        setIsAdmin(false)
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()

      setIsAdmin(!error && data?.role === 'admin')
    }

    void checkAdmin()
  }, [session])

  useEffect(() => {
    localStorage.setItem('depotakip_stocks', JSON.stringify(stocks))
  }, [stocks])

  useEffect(() => {
    localStorage.setItem('depotakip_shelves', JSON.stringify(shelves))
  }, [shelves])

  useEffect(() => {
    if (!session) return
    let cancelled = false

    async function syncStocks() {
      setSyncing(true)
      setSyncMessage('Bulut kayıtları kontrol ediliyor...')

      try {
        const saved = localStorage.getItem('depotakip_stocks')
        const localStocks: Stock[] = saved ? JSON.parse(saved) : []

        const { data, error } = await supabase
          .from('stocks')
          .select('code, name, barcode, unit, description, quantity')

        if (error) throw error

        const cloudStocks: Stock[] = (data ?? []).map(row => ({
          code: row.code,
          name: row.name,
          barcode: row.barcode ?? '',
          unit: row.unit ?? 'Adet',
          description: row.description ?? '',
          quantity: Number(row.quantity ?? 0),
        }))

        const cloudCodes = new Set(
          cloudStocks.map(stock => stock.code.toLowerCase())
        )

        const localOnly = localStocks.filter(
          stock => !cloudCodes.has(stock.code.toLowerCase())
        )

        for (let i = 0; i < localOnly.length; i += 100) {
          const { error: insertError } = await supabase
            .from('stocks')
            .insert(localOnly.slice(i, i + 100))

          if (insertError) throw insertError
        }

        const merged = new Map<string, Stock>()
        cloudStocks.forEach(stock => merged.set(stock.code.toLowerCase(), stock))
        localOnly.forEach(stock => merged.set(stock.code.toLowerCase(), stock))

        if (!cancelled) {
          setStocks(Array.from(merged.values()))
          setSyncMessage(`Bulut eşitlemesi tamamlandı. ${localOnly.length} stok aktarıldı.`)
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        if (!cancelled) {
          setSyncMessage('Bulut eşitleme hatası: ' + detail)
        }
      } finally {
        if (!cancelled) setSyncing(false)
      }
    }

    void syncStocks()

    return () => {
      cancelled = true
    }
  }, [session])

  async function loadMovementHistory() {
    setMovementsLoading(true)

    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('id, stock_code, movement_type, quantity, notes, created_at, created_by_name')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setMovements((data ?? []) as StockMovement[])
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMovementMessage('Hareket geçmişi yüklenemedi: ' + detail)
    } finally {
      setMovementsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      void loadMovementHistory()
    }
  }, [session])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setLoginError('Giriş başarısız: ' + error.message)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  async function addMovement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const quantity = Number(movementQuantity)

    if (!movementStockCode) {
      setMovementMessage('Lütfen bir stok seçin.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMovementMessage('Miktar sıfırdan büyük olmalıdır.')
      return
    }

    setMovementMessage('Hareket kaydediliyor...')

    try {
      const { data, error } = await supabase.rpc('register_stock_movement', {
        p_stock_code: movementStockCode,
        p_movement_type: movementType,
        p_quantity: quantity,
        p_notes: movementNotes.trim(),
      })

      if (error) throw error

      const result = (data as Array<{ current_quantity: number | string }> | null)?.[0]

      if (!result) {
        throw new Error('Veritabanından sonuç alınamadı.')
      }

      setStocks(previous =>
        previous.map(stock =>
          stock.code === movementStockCode
            ? { ...stock, quantity: Number(result.current_quantity) }
            : stock
        )
      )

      setMovementMessage('Stok hareketi başarıyla kaydedildi.')
      setMovementQuantity('')
      setMovementNotes('')
      setMovementStockCode('')
      setMovementSearch('')

      await loadMovementHistory()
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMovementMessage('Hareket kaydedilemedi: ' + detail)
    }
  }

  const deleteStock = async (stock: Stock) => {
    if (!isAdmin) {
      alert('Bu işlem için yönetici yetkisi gerekiyor.')
      return
    }

    const confirmed = window.confirm(`"${stock.name}" (${stock.code}) stok kartını silmek istediğine emin misin?`)

    if (!confirmed) return

    const { error } = await supabase.from('stocks').delete().eq('code', stock.code)

    if (error) {
      alert('Stok silinemedi: ' + error.message)
      return
    }

    setStocks(previous => previous.filter(item => item.code !== stock.code))
    if (selectedStockCard?.code === stock.code) {
      setSelectedStockCard(null)
    }

    alert('Stok kartı silindi.')
  }

  async function addStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const cleanCode = code.trim()
    const cleanName = name.trim()

    if (!cleanCode || !cleanName) {
      setMessage('Stok kodu ve stok adı zorunludur.')
      return
    }

    if (stocks.some(stock => stock.code.toLowerCase() === cleanCode.toLowerCase())) {
      setMessage('Bu stok kodu zaten kayıtlı.')
      return
    }

    const newStock: Stock = {
      code: cleanCode,
      name: cleanName,
      barcode: barcode.trim(),
      unit,
      description: description.trim(),
      quantity: 0,
    }

    setMessage('Stok buluta kaydediliyor...')

    try {
      const { error } = await supabase.from('stocks').insert(newStock)

      if (error) {
        setMessage('Stok kaydedilemedi: ' + error.message)
        return
      }

      setStocks(previous => [...previous, newStock])
      setCode('')
      setName('')
      setBarcode('')
      setUnit('Adet')
      setDescription('')
      setMessage('Stok başarıyla kaydedildi.')
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMessage('Kayıt başarısız: ' + detail)
    }
  }

  function backupStocks() {
    if (stocks.length === 0) {
      window.alert('Yedeklenecek stok kaydı bulunamadı.')
      return
    }

    const json = JSON.stringify(stocks, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `depotakip-stok-yedegi-${date}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    window.alert(`${stocks.length} stok kaydı yedeklenmek üzere indirildi.`)
  }

  function handleShelfAssignment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const qty = Number(shelfQuantityInput)
    const cleanShelf = shelfCodeInput.trim().toUpperCase()

    if (!shelfStockCode) {
      setShelfMessage('Lütfen rafa eklenecek stoku seçin.')
      return
    }

    if (!cleanShelf) {
      setShelfMessage('Lütfen raf kodu girin (Örn: A-01).')
      return
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      setShelfMessage('Geçerli bir miktar girin.')
      return
    }

    const targetStock = stocks.find(s => s.code === shelfStockCode)
    if (!targetStock) {
      setShelfMessage('Seçilen stok bulunamadı.')
      return
    }

    const totalAssignedForStock = shelves
      .filter(sh => sh.stock_code === shelfStockCode)
      .reduce((sum, item) => sum + item.quantity, 0)

    const availableStockInDepot = targetStock.quantity - totalAssignedForStock

    if (qty > availableStockInDepot) {
      setShelfMessage(`Hata: Bu üründen boştaki miktar sadece ${availableStockInDepot} ${targetStock.unit}! (${qty} adet atayamazsınız).`)
      return
    }

    const newAssignment: ShelfAssignment = {
      id: Date.now().toString(),
      shelf_code: cleanShelf,
      stock_code: shelfStockCode,
      quantity: qty,
    }

    setShelves(prev => [newAssignment, ...prev])
    setShelfMessage(`Başarılı: ${qty} ${targetStock.unit} ürün ${cleanShelf} rafına yerleştirildi.`)
    setShelfQuantityInput('')
    setShelfCodeInput('')
    setShelfStockCode('')
    setShelfSearch('')
  }

  async function handleResetMovementsAndShelves() {
    if (!isAdmin) {
      alert('Bu işlem için yönetici yetkisi gerekiyor.')
      return
    }

    const confirm1 = window.confirm('Tüm raf atamaları ve stok hareket geçmişi silinecektir. Stok kartlarınız silinmeyecektir. Emin misiniz?')
    if (!confirm1) return

    setResetLoading(true)

    try {
      const { error: moveError } = await supabase.from('stock_movements').delete().neq('id', 0)
      if (moveError) throw moveError

      const { error: stockError } = await supabase.from('stocks').update({ quantity: 0 }).neq('code', '')
      if (stockError) throw stockError

      localStorage.removeItem('depotakip_shelves')
      const resetStocks = stocks.map(s => ({ ...s, quantity: 0 }))
      setStocks(resetStocks)
      localStorage.setItem('depotakip_stocks', JSON.stringify(resetStocks))

      setShelves([])
      setMovements([])
      setSelectedStockCard(null)

      alert('Raf atamaları ve stok hareketleri buluttan kalıcı olarak temizlendi!')
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      alert('Temizleme sırasında hata oluştu: ' + detail)
    } finally {
      setResetLoading(false)
    }
  }

  const filteredCardStocks = cardSearch.trim()
    ? stocks.filter(
        stock =>
          stock.code.toLowerCase().includes(cardSearch.toLowerCase()) ||
          stock.name.toLowerCase().includes(cardSearch.toLowerCase())
      )
    : []

  const filteredMovementStocks = movementSearch.trim()
    ? stocks.filter(
        stock =>
          stock.code.toLowerCase().includes(movementSearch.toLowerCase()) ||
          stock.name.toLowerCase().includes(movementSearch.toLowerCase())
      )
    : []

  const filteredShelfStocks = shelfSearch.trim()
    ? stocks.filter(
        stock =>
          stock.code.toLowerCase().includes(shelfSearch.toLowerCase()) ||
          stock.name.toLowerCase().includes(shelfSearch.toLowerCase())
      )
    : []

  const filteredControlStocks = controlSearch.trim()
    ? stocks.filter(
        stock =>
          stock.code.toLowerCase().includes(controlSearch.toLowerCase().trim()) ||
          stock.name.toLowerCase().includes(controlSearch.toLowerCase().trim())
      )
    : stocks

  if (sessionLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#f8fafc' }}>
        <p>Yükleniyor...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '24px' }}>
            <div className="brand-icon">D</div>
            <div>
              <h2>FNDEPO</h2>
              <span>Stok Yönetim Sistemi</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="login-email">E-posta Adresi</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Şifre</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && <div className="message" style={{ marginTop: '10px' }}>{loginError}</div>}

            <button type="submit" className="primary" style={{ marginTop: '20px', width: '100%', padding: '12px' }}>
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <main className="app sidebar-closed">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">D</div>
          <div>
            <h2>FNDEPO</h2>
            <span>Stok Yönetim Sistemi</span>
          </div>
        </div>

        <div className="menu-label">ANA MENÜ</div>

        <button
          type="button"
          className={activeTab === 'home' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => {
            setActiveTab('home')
            document.querySelector('.app')?.classList.add('sidebar-closed')
          }}
        >
          Ana Sayfa
        </button>

        <button
          type="button"
          className={activeTab === 'stocks' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => {
            setActiveTab('stocks')
            document.querySelector('.app')?.classList.add('sidebar-closed')
          }}
        >
          ▦ Stok Kartları
        </button>

        <button
          type="button"
          className={activeTab === 'shelves' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => {
            setActiveTab('shelves')
            document.querySelector('.app')?.classList.add('sidebar-closed')
          }}
        >
          ▤ Depo ve Raflar
        </button>

        <button
          type="button"
          className={activeTab === 'control' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => {
            setActiveTab('control')
            document.querySelector('.app')?.classList.add('sidebar-closed')
          }}
        >
          📊 Stok Kontrol
        </button>

        <button
          type="button"
          className={activeTab === 'movements' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => {
            setActiveTab('movements')
            document.querySelector('.app')?.classList.add('sidebar-closed')
          }}
        >
          ⇄ Stok Hareketleri
        </button>

        <button
          type="button"
          className={activeTab === 'excel-import' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => {
            setActiveTab('excel-import')
            document.querySelector('.app')?.classList.add('sidebar-closed')
          }}
        >
          📥 Excel ile Aktar
        </button>

        {isAdmin && (
          <button
            type="button"
            className={activeTab === 'settings' ? 'menu-item menu-button active' : 'menu-item menu-button'}
            onClick={() => {
              setActiveTab('settings')
              document.querySelector('.app')?.classList.add('sidebar-closed')
            }}
          >
            ⚙ Ayarlar
          </button>
        )}

        <div style={{ marginTop: 'auto', padding: '15px' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{ width: '100%', background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Çıkış Yap
          </button>
        </div>

        <div className="sidebar-bottom">Depo yönetimi artık daha kolay.</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button"
              className="toggle-sidebar-btn" 
              onClick={() => {
                const appElement = document.querySelector('.app')
                if (appElement) {
                  appElement.classList.toggle('sidebar-closed')
                }
              }}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}
            >
              ☰
            </button>
            <div>
              <span className="eyebrow">DEPO YÖNETİMİ</span>
              <h1>
                {activeTab === 'home'
                  ? 'Ana Sayfa'
                  : activeTab === 'stocks'
                    ? 'Stok Kartları & Arama'
                    : activeTab === 'shelves'
                      ? 'Depo ve Raf Yerleşimi'
                      : activeTab === 'control'
                        ? 'Stok Kontrol & Depo Durumu'
                        : activeTab === 'movements'
                          ? 'Stok Hareketleri'
                          : activeTab === 'excel-import'
                            ? 'Excel ile Toplu Stok ve Raf Aktarımı'
                            : 'Sistem Ayarları'}
              </h1>
            </div>
          </div>
          <div className="user-badge">{isAdmin ? 'Yönetici' : 'Kullanıcı'}</div>
        </header>

        {activeTab === 'home' && (
          <div className="welcome">
            <div>
              <h2>FNDEPO Ağır Vasıta Yedek Parça Deposu</h2>
              <p>Sol üstteki menü butonuna (☰) basarak menüyü açabilir, istediğiniz sekmeyi seçerek otomatik kapanmasını sağlayabilirsiniz.</p>
            </div>
          </div>
        )}

        {activeTab === 'stocks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <p role="status" style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              {syncing ? 'Stoklar eşitleniyor...' : syncMessage}
            </p>

            <div className="layout">
              <section className="panel">
                <div className="panel-heading">
                  <div className="panel-icon">＋</div>
                  <div>
                    <h3>Yeni Stok Kartı</h3>
                    <p>Yıldızlı alanlar zorunludur.</p>
                  </div>
                </div>

                <form onSubmit={addStock}>
                  <label>
                    Stok Kodu <b>*</b>
                    <input
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="Örn. STK-0001"
                      required
                    />
                  </label>

                  <label>
                    Stok Adı <b>*</b>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ürün adını girin"
                      required
                    />
                  </label>

                  <label>
                    Barkod
                    <input
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      placeholder="Barkod numarası"
                    />
                  </label>

                  <label>
                    Birim
                    <select value={unit} onChange={e => setUnit(e.target.value)}>
                      <option>Adet</option>
                      <option>Takım</option>
                      <option>Koli</option>
                      <option>Palet</option>
                      <option>Kg</option>
                      <option>Metre</option>
                      <option>Litre</option>
                    </select>
                  </label>

                  <label>
                    Açıklama
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ürün hakkında notlar..."
                      rows={3}
                    />
                  </label>

                  {message && <div className="message">{message}</div>}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setCode('')
                        setName('')
                        setBarcode('')
                        setUnit('Adet')
                        setDescription('')
                        setMessage('')
                      }}
                    >
                      Temizle
                    </button>

                    <button type="submit" className="primary">
                      ＋ Kaydet
                    </button>
                  </div>
                </form>
              </section>

              <section className="panel">
                <div className="list-heading">
                  <div>
                    <h3>Stok Kartı Arama</h3>
                    <p>Kod veya ada göre arayıp detayları görün</p>
                  </div>
                  <button type="button" className="secondary" onClick={backupStocks}>
                    ↓ Yedekle ({stocks.length})
                  </button>
                </div>

                <div className="stock-search" style={{ position: 'relative', marginBottom: '15px' }}>
                  <label htmlFor="card-search-input">Stok Kodu veya Adı ile Ara</label>
                  <input
                    id="card-search-input"
                    type="text"
                    value={cardSearch}
                    onChange={e => {
                      setCardSearch(e.target.value)
                      setSelectedStockCard(null)
                    }}
                    placeholder="Örn. STK-0001 ya da Vida..."
                  />

                  {cardSearch.trim() && filteredCardStocks.length > 0 && !selectedStockCard && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {filteredCardStocks.map(stock => (
                        <div
                          key={stock.code}
                          onClick={() => {
                            setSelectedStockCard(stock)
                            setCardSearch('')
                          }}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            fontSize: '14px',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <strong>{stock.code}</strong> — {stock.name} ({stock.quantity} {stock.unit})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedStockCard ? (
                  <div
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      padding: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {selectedStockCard.code}
                        </span>
                        <h4 style={{ margin: '10px 0 5px 0', fontSize: '18px' }}>{selectedStockCard.name}</h4>
                      </div>
                      <button
                        type="button"
                        className="secondary"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                        onClick={() => setSelectedStockCard(null)}
                      >
                        Kapat
                      </button>
                    </div>

                    <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                      <div>
                        <strong>Toplam Stok Miktarı:</strong> <br />
                        <span style={{ fontSize: '22px', color: '#2563eb', fontWeight: 'bold' }}>
                          {Number(selectedStockCard.quantity ?? 0).toLocaleString('tr-TR')} {selectedStockCard.unit}
                        </span>
                      </div>
                      <div>
                        <strong>Barkod:</strong> <br />
                        {selectedStockCard.barcode || 'Yok'}
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '14px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                        📍 Bulunduğu Raflar ve Adetler:
                      </strong>
                      {(() => {
                        const productShelves = shelves.filter(sh => sh.stock_code === selectedStockCard.code)
                        if (productShelves.length === 0) {
                          return (
                            <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              ⚠️ Bu ürün henüz herhangi bir rafa atanmamış.
                            </div>
                          )
                        }
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {productShelves.map(sh => (
                              <div
                                key={sh.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: '#ffffff',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '13px',
                                }}
                              >
                                <span><strong>📍 Raf: {sh.shelf_code}</strong></span>
                                <span style={{ fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
                                  {sh.quantity} {selectedStockCard.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>

                    {selectedStockCard.description && (
                      <div style={{ marginTop: '14px', fontSize: '13px', color: '#475569' }}>
                        <strong>Açıklama:</strong> {selectedStockCard.description}
                      </div>
                    )}

                    {isAdmin && (
                      <div style={{ marginTop: '20px', borderTop: '1px solid #dee2e6', paddingTop: '15px' }}>
                        <button
                          type="button"
                          onClick={() => deleteStock(selectedStockCard)}
                          style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                        >
                          🗑 Bu Stok Kartını Sil
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                    Yukarıdaki arama çubuğundan bir ürün seçerek detaylarını ve raflarını görüntüleyin.
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'shelves' && (
          <div className="layout">
            <section className="panel">
              <div className="panel-heading">
                <div className="panel-icon">📍</div>
                <div>
                  <h3>Raf Yerleşimi Yap</h3>
                  <p>Stokları raflara bölüştürün</p>
                </div>
              </div>

              <form onSubmit={handleShelfAssignment}>
                <div className="stock-search" style={{ position: 'relative', marginBottom: '15px' }}>
                  <label>Stok Seçin (Kod veya Ad ile Ara) <b>*</b></label>
                  <input
                    type="text"
                    value={shelfSearch}
                    onChange={e => {
                      setShelfSearch(e.target.value)
                      setShelfStockCode('')
                    }}
                    placeholder="Ürün adı veya kodu yazın..."
                  />

                  {shelfSearch.trim() && filteredShelfStocks.length > 0 && !shelfStockCode && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {filteredShelfStocks.map(stock => {
                        const assignedSum = shelves
                          .filter(sh => sh.stock_code === stock.code)
                          .reduce((sum, item) => sum + item.quantity, 0)
                        const freeQty = stock.quantity - assignedSum

                        return (
                          <div
                            key={stock.code}
                            onClick={() => {
                              setShelfStockCode(stock.code)
                              setShelfSearch(`${stock.code} - ${stock.name}`)
                            }}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '13px' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                          >
                            <strong>{stock.code}</strong> — {stock.name} <span style={{ color: '#2563eb' }}>(Boşta: {freeQty} {stock.unit})</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <label>
                  Raf Kodu <b>*</b>
                  <input
                    value={shelfCodeInput}
                    onChange={e => setShelfCodeInput(e.target.value)}
                    placeholder="Örn. A-01-02"
                    required
                  />
                </label>

                <label>
                  Miktar <b>*</b>
                  <input
                    type="number"
                    min="1"
                    value={shelfQuantityInput}
                    onChange={e => setShelfQuantityInput(e.target.value)}
                    placeholder="Raf miktarı"
                    required
                  />
                </label>

                {shelfMessage && <div className="message">{shelfMessage}</div>}

                <div className="form-actions" style={{ marginTop: '15px' }}>
                  <button type="submit" className="primary" style={{ width: '100%' }}>
                    📍 Rafa Yerleştir
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Aktif Raf Yerleşimleri ({shelves.length})</h3>
                <p>Depodaki raf dağılım listesi</p>
              </div>

              {shelves.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b' }}>Henüz raflara yerleştirilmiş ürün bulunmuyor.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
                  {shelves.map(sh => {
                    const st = stocks.find(s => s.code === sh.stock_code)
                    return (
                      <div
                        key={sh.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#0f172a' }}>📍 Raf: {sh.shelf_code}</span>
                          <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                            {sh.stock_code} {st ? `— ${st.name}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 'bold', color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>
                            {sh.quantity} {st?.unit || 'Adet'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShelves(prev => prev.filter(item => item.id !== sh.id))}
                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Kaldır
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="panel">
            <div className="list-heading" style={{ marginBottom: '16px' }}>
              <div>
                <h3>Stok Kontrol & Depo Durumu</h3>
                <p>Tüm stokların toplam miktarları ve raf dağılımları</p>
              </div>
              <input
                type="text"
                value={controlSearch}
                onChange={e => setControlSearch(e.target.value)}
                placeholder="Listede ara..."
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '240px' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                    <th style={{ padding: '10px' }}>Stok Kodu</th>
                    <th style={{ padding: '10px' }}>Stok Adı</th>
                    <th style={{ padding: '10px' }}>Toplam Miktar</th>
                    <th style={{ padding: '10px' }}>Raflardaki Dağılım</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredControlStocks.map(stock => {
                    const prodShelves = shelves.filter(s => s.stock_code === stock.code)
                    return (
                      <tr key={stock.code} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>{stock.code}</td>
                        <td style={{ padding: '10px', color: '#0f172a' }}>{stock.name}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb' }}>
                          {Number(stock.quantity ?? 0).toLocaleString('tr-TR')} {stock.unit}
                        </td>
                        <td style={{ padding: '10px', color: '#475569' }}>
                          {prodShelves.length === 0 ? (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Rafta yok</span>
                          ) : (
                            prodShelves.map(ps => `${ps.shelf_code} (${ps.quantity})`).join(', ')
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="layout">
            <section className="panel">
              <div className="panel-heading">
                <div className="panel-icon">⇄</div>
                <div>
                  <h3>Stok Giriş / Çıkış Hareketi</h3>
                  <p>Depoya ürün girişi veya çıkışı yapın</p>
                </div>
              </div>

              <form onSubmit={addMovement}>
                <div className="stock-search" style={{ position: 'relative', marginBottom: '15px' }}>
                  <label>Stok Seçin (Kod veya Ad ile Ara) <b>*</b></label>
                  <input
                    type="text"
                    value={movementSearch}
                    onChange={e => {
                      setMovementSearch(e.target.value)
                      setMovementStockCode('')
                    }}
                    placeholder="Ürün adı veya kodu yazın..."
                  />

                  {movementSearch.trim() && filteredMovementStocks.length > 0 && !movementStockCode && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {filteredMovementStocks.map(stock => (
                        <div
                          key={stock.code}
                          onClick={() => {
                            setMovementStockCode(stock.code)
                            setMovementSearch(`${stock.code} - ${stock.name}`)
                          }}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '13px' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <strong>{stock.code}</strong> — {stock.name} ({stock.quantity} {stock.unit})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <label>
                  Hareket Türü <b>*</b>
                  <select value={movementType} onChange={e => setMovementType(e.target.value as 'GIRIS' | 'CIKIS')}>
                    <option value="GIRIS">📥 Stok Girişi (+)</option>
                    <option value="CIKIS">📤 Stok Çıkışı (-)</option>
                  </select>
                </label>

                <label>
                  Miktar <b>*</b>
                  <input
                    type="number"
                    min="1"
                    value={movementQuantity}
                    onChange={e => setMovementQuantity(e.target.value)}
                    placeholder="Miktar"
                    required
                  />
                </label>

                <label>
                  Açıklama / Notlar
                  <input
                    value={movementNotes}
                    onChange={e => setMovementNotes(e.target.value)}
                    placeholder="Örn. İrsaliye no / Sipariş sebebi..."
                  />
                </label>

                {movementMessage && <div className="message">{movementMessage}</div>}

                <div className="form-actions" style={{ marginTop: '15px' }}>
                  <button type="submit" className="primary" style={{ width: '100%' }}>
                    ⇄ Hareketi Kaydet
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Son Stok Hareketleri</h3>
                <p>Gerçekleşen son 50 işlem</p>
              </div>

              {movementsLoading ? (
                <p style={{ fontSize: '13px', color: '#64748b' }}>Yükleniyor...</p>
              ) : movements.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b' }}>Henüz stok hareketi bulunmuyor.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto' }}>
                  {movements.map(m => (
                    <div
                      key={m.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold', color: m.movement_type === 'GIRIS' ? '#16a34a' : '#dc2626' }}>
                          {m.movement_type === 'GIRIS' ? '📥 GİRİŞ' : '📤 ÇIKIŞ'} ({m.quantity})
                        </span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                          {new Date(m.created_at).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <div style={{ marginTop: '4px', color: '#0f172a', fontWeight: '500' }}>
                        Stok Kodu: {m.stock_code}
                      </div>
                      {m.notes && <div style={{ color: '#475569', marginTop: '2px' }}>Not: {m.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'excel-import' && <ExcelImportPage />}

        {activeTab === 'settings' && isAdmin && (
          <div className="panel" style={{ maxWidth: '600px' }}>
            <div className="panel-heading">
              <div className="panel-icon">⚙</div>
              <div>
                <h3>Sistem Ayarları & Sıfırlama</h3>
                <p>Yönetici yetkisi gerektiren kritik işlemler</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '10px' }}>
              <h4 style={{ color: '#b91c1c', marginBottom: '8px' }}>⚠️ Hareketleri ve Rafları Sıfırla</h4>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Tüm stok hareket geçmişini ve raf yerleşimlerini siler, stok miktarlarını 0'a eşitler. Stok kartlarınız silinmez.
              </p>
              <button
                type="button"
                onClick={handleResetMovementsAndShelves}
                disabled={resetLoading}
                style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {resetLoading ? 'Sıfırlanıyor...' : '🗑 Raf ve Hareketleri Sıfırla'}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}