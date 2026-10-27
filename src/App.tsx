import { useEffect, useState } from 'react'
import { supabase } from './supabase'
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

function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'stocks' | 'shelves' | 'control' | 'movements' | 'settings'>('home')

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
    const checkAdmin = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setIsAdmin(false)
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      setIsAdmin(!error && data?.role === 'admin')
    }

    void checkAdmin()
  }, [])

  useEffect(() => {
    localStorage.setItem('depotakip_stocks', JSON.stringify(stocks))
  }, [stocks])

  useEffect(() => {
    localStorage.setItem('depotakip_shelves', JSON.stringify(shelves))
  }, [shelves])

  useEffect(() => {
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
  }, [])

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
    void loadMovementHistory()
  }, [])

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

    const confirm1 = window.confirm('Tüm raf atamaları ve stok hareket geçmişi silinecektir. Stok kartlarınız (ürünler) silinmeyecektir. Emin misiniz?')
    if (!confirm1) return

    setResetLoading(true)

    try {
      await supabase.from('stock_movements').delete().neq('id', 0)
      await supabase.from('stocks').update({ quantity: 0 }).neq('code', '')

      localStorage.removeItem('depotakip_shelves')
      const resetStocks = stocks.map(s => ({ ...s, quantity: 0 }))
      setStocks(resetStocks)
      localStorage.setItem('depotakip_stocks', JSON.stringify(resetStocks))

      setShelves([])
      setMovements([])
      setSelectedStockCard(null)

      alert('Raf atamaları ve stok hareketleri başarıyla temizlendi! Stok kartlarınız yerinde duruyor.')
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
          stock.code.toLowerCase().includes(controlSearch.toLowerCase()) ||
          stock.name.toLowerCase().includes(controlSearch.toLowerCase())
      )
    : stocks

  return (
    <main className="app">
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
          onClick={() => setActiveTab('home')}
        >
          Ana Sayfa
        </button>

        <button
          type="button"
          className={activeTab === 'stocks' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => setActiveTab('stocks')}
        >
          ▦ Stok Kartları
        </button>

        <button
          type="button"
          className={activeTab === 'shelves' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => setActiveTab('shelves')}
        >
          ▤ Depo ve Raflar
        </button>

        <button
          type="button"
          className={activeTab === 'control' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => setActiveTab('control')}
        >
          📊 Stok Kontrol
        </button>

        <button
          type="button"
          className={activeTab === 'movements' ? 'menu-item menu-button active' : 'menu-item menu-button'}
          onClick={() => setActiveTab('movements')}
        >
          ⇄ Stok Hareketleri
        </button>

        {/* AYARLAR SEKMESİ SADECE YÖNETİCİYE ÖZEL GÖRÜNÜR */}
        {isAdmin && (
          <button
            type="button"
            className={activeTab === 'settings' ? 'menu-item menu-button active' : 'menu-item menu-button'}
            onClick={() => setActiveTab('settings')}
          >
            ⚙ Ayarlar
          </button>
        )}

        <div className="sidebar-bottom">Depo yönetimi artık daha kolay.</div>
      </aside>

      <section className="content">
        <header className="topbar">
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
                      : activeTab === 'settings'
                        ? 'Sistem Ayarları'
                        : 'Stok Hareketleri'}
            </h1>
          </div>
          <div className="user-badge">{isAdmin ? 'Yönetici' : 'Kullanıcı'}</div>
        </header>

        {activeTab === 'home' && (
          <div className="welcome">
            <div>
              <h2>FNDEPO Ağır Vasıta Yedek Parça Deposu</h2>
              <p>Sol menüyü kullanarak stok kartlarını yönetebilir ve hareketleri takip edebilirsiniz.</p>
            </div>
          </div>
        )}

        {/* STOK KARTLARI EKRANI */}
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
                      <div style={{ marginTop: '20px', borderTop: '1px solid #dee2e6', paddingTop: '10px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="delete-stock-btn"
                          onClick={() => deleteStock(selectedStockCard)}
                        >
                          Bu Stok Kartını Sil
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-icon">🔍</div>
                    <h3>Stok Seçilmedi</h3>
                    <p>Yukarıdaki arama kutusuna kod veya ad yazarak ürün ve raf durumunu görün.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* DEPO VE RAFLAR BÖLÜMÜ */}
        {activeTab === 'shelves' && (
          <div className="layout">
            <section className="panel">
              <div className="panel-heading">
                <div className="panel-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>▤</div>
                <div>
                  <h3>Ürünü Rafta Konumlandır</h3>
                  <p>Stok miktarını aşmayacak şekilde raflara ürün atayın.</p>
                </div>
              </div>

              <form onSubmit={handleShelfAssignment}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <label htmlFor="shelf-search-input">
                    Stok Seçimi <b>*</b>
                  </label>
                  <input
                    id="shelf-search-input"
                    type="text"
                    value={shelfStockCode ? `${shelfStockCode} — ${stocks.find(s => s.code === shelfStockCode)?.name || ''}` : shelfSearch}
                    onChange={e => {
                      setShelfSearch(e.target.value)
                      setShelfStockCode('')
                    }}
                    placeholder="Stok kodu veya adı yazarak arayın..."
                    required={!shelfStockCode}
                  />

                  {shelfSearch.trim() && !shelfStockCode && filteredShelfStocks.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {filteredShelfStocks.map(stock => (
                        <div
                          key={stock.code}
                          onClick={() => {
                            setShelfStockCode(stock.code)
                            setShelfSearch('')
                          }}
                          style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            fontSize: '13px',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <strong>{stock.code}</strong> — {stock.name} (Toplam Stok: {stock.quantity} {stock.unit})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {shelfStockCode && (
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                    📦 Seçilen Ürün Toplam Stoğu: <strong>{stocks.find(s => s.code === shelfStockCode)?.quantity ?? 0} {stocks.find(s => s.code === shelfStockCode)?.unit}</strong>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Raf Kodu <b>*</b>
                    <input
                      type="text"
                      value={shelfCodeInput}
                      onChange={e => setShelfCodeInput(e.target.value)}
                      placeholder="Örn. A-01, RAF-3"
                      required
                    />
                  </label>

                  <label>
                    Raf Miktarı <b>*</b>
                    <input
                      type="number"
                      min="1"
                      value={shelfQuantityInput}
                      onChange={e => setShelfQuantityInput(e.target.value)}
                      placeholder="Adet gir"
                      required
                    />
                  </label>
                </div>

                {shelfMessage && (
                  <div className="message" role="status" style={{ marginTop: '12px' }}>
                    {shelfMessage}
                  </div>
                )}

                <div className="form-actions" style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setShelfStockCode('')
                      setShelfSearch('')
                      setShelfCodeInput('')
                      setShelfQuantityInput('')
                      setShelfMessage('')
                    }}
                  >
                    Temizle
                  </button>

                  <button type="submit" className="primary">
                    ＋ Rafa Yerleştir
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div className="panel-icon" style={{ background: '#f8fafc', color: '#475569' }}>📋</div>
                <div>
                  <h3>Raf Yerleşim Listesi</h3>
                  <p>Depodaki raflarda hangi üründen ne kadar var.</p>
                </div>
              </div>

              {shelves.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <div className="empty-icon">📍</div>
                  <h3>Henüz Raf Ataması Yapılmadı</h3>
                  <p>Soldaki formu kullanarak ürünleri raflara yerleştirebilirsiniz.</p>
                </div>
              ) : (
                <div className="stock-list" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  {shelves.map(item => {
                    const st = stocks.find(s => s.code === item.stock_code)
                    return (
                      <div className="stock-row" key={item.id} style={{ padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', marginBottom: '8px', borderLeft: '4px solid #2563eb' }}>
                        <div className="stock-info" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>📍 Raf: {item.shelf_code}</strong>
                            <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', background: '#dbeafe', color: '#1e40af' }}>
                              {item.quantity} {st?.unit || 'Adet'}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#334155' }}>
                            🏷️ {item.stock_code} — {st ? st.name : 'Bilinmeyen Ürün'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* STOK KONTROL EKRANI */}
        {activeTab === 'control' && (
          <div className="layout" style={{ gridTemplateColumns: '1fr' }}>
            <section className="panel">
              <div className="panel-heading">
                <div className="panel-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>📊</div>
                <div>
                  <h3>Depo Genel Stok ve Raf Kontrolü</h3>
                  <p>Tüm ürünlerin toplam stok miktarlarını ve raflardaki dağılım durumlarını tek ekrandan inceleyin.</p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={controlSearch}
                  onChange={e => setControlSearch(e.target.value)}
                  placeholder="Stok kodu veya adı ile filtrele..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              {filteredControlStocks.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <div className="empty-icon">📦</div>
                  <h3>Kayıtlı Stok Bulunamadı</h3>
                  <p>Sistemde henüz eklenmiş bir stok kartı yok.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                        <th style={{ padding: '12px' }}>Stok Kodu</th>
                        <th style={{ padding: '12px' }}>Ürün Adı</th>
                        <th style={{ padding: '12px' }}>Toplam Miktar</th>
                        <th style={{ padding: '12px' }}>Raflardaki Dağılım</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredControlStocks.map(stock => {
                        const productShelves = shelves.filter(sh => sh.stock_code === stock.code)
                        const totalAssigned = productShelves.reduce((sum, s) => sum + s.quantity, 0)
                        const unassigned = stock.quantity - totalAssigned

                        return (
                          <tr key={stock.code} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{stock.code}</td>
                            <td style={{ padding: '12px', color: '#0f172a' }}>{stock.name}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>
                              {stock.quantity} {stock.unit}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {productShelves.length === 0 ? (
                                <span style={{ color: '#d97706', fontSize: '12px', background: '#fef3c7', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                                  ⚠️ Hiçbir rafta yok
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {productShelves.map(sh => (
                                    <span key={sh.id} style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                      {sh.shelf_code}: {sh.quantity} {stock.unit}
                                    </span>
                                  ))}
                                  {unassigned > 0 && (
                                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                      Boşta: {unassigned} {stock.unit}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* YÖNETİCİYE ÖZEL AYARLAR EKRANI */}
        {activeTab === 'settings' && isAdmin && (
          <div className="layout" style={{ gridTemplateColumns: '1fr' }}>
            <section className="panel" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="panel-heading">
                <div className="panel-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>⚙</div>
                <div>
                  <h3>Hareket ve Raf Temizliği</h3>
                  <p>Stok kartlarınız silinmeden sadece raf atamalarını ve hareket geçmişini sıfırlayın.</p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '16px' }}>ℹ️ Hareketleri ve Rafları Sıfırla</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                  Bu işlem <strong>stok kartlarınızı (ürün tanımlarınızı) silmez</strong>. Yalnızca geçmiş hareketleri ve raf yerleşimlerini temizleyerek stok miktarlarını 0'a getirir.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetMovementsAndShelves}
                disabled={resetLoading}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                }}
              >
                {resetLoading ? 'Temizleniyor...' : '🔄 Sadece Hareketleri ve Rafları Sıfırla'}
              </button>
            </section>
          </div>
        )}

        {/* STOK HAREKETLERİ */}
        {activeTab === 'movements' && (
          <div className="layout">
            <section className="panel">
              <div className="panel-heading">
                <div className="panel-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>⇄</div>
                <div>
                  <h3>Stok Giriş / Çıkış İşlemi</h3>
                  <p>Aşağıdan ürünü seçip miktar ve hareket türünü belirtin.</p>
                </div>
              </div>

              <form onSubmit={addMovement}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <label htmlFor="movement-search-input">
                    Stok Seçimi <b>*</b>
                  </label>
                  <input
                    id="movement-search-input"
                    type="text"
                    value={
                      movementStockCode
                        ? `${movementStockCode} — ${stocks.find(s => s.code === movementStockCode)?.name || ''}`
                        : movementSearch
                    }
                    onChange={e => {
                      setMovementSearch(e.target.value)
                      setMovementStockCode('')
                    }}
                    placeholder="Stok kodu veya adı yazarak arayın..."
                    required={!movementStockCode}
                    style={{
                      borderColor: movementStockCode ? '#22c55e' : undefined,
                      backgroundColor: movementStockCode ? '#f0fdf4' : '#ffffff',
                      fontWeight: movementStockCode ? '600' : 'normal',
                      color: movementStockCode ? '#15803d' : '#0f172a',
                    }}
                  />

                  {movementStockCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setMovementStockCode('')
                        setMovementSearch('')
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '32px',
                        background: '#e2e8f0',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#475569',
                      }}
                    >
                      ✕ Değiştir
                    </button>
                  )}

                  {movementSearch.trim() && !movementStockCode && filteredMovementStocks.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 50,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                        marginTop: '4px',
                      }}
                    >
                      {filteredMovementStocks.map(stock => (
                        <div
                          key={stock.code}
                          onClick={() => {
                            setMovementStockCode(stock.code)
                            setMovementSearch('')
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '13px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                        >
                          <div>
                            <strong style={{ color: '#2563eb' }}>{stock.code}</strong> — {stock.name}
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            Mevcut: {stock.quantity} {stock.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Hareket Türü
                    <select
                      value={movementType}
                      onChange={e => setMovementType(e.target.value as 'GIRIS' | 'CIKIS')}
                      style={{
                        fontWeight: '600',
                        color: movementType === 'GIRIS' ? '#15803d' : '#b91c1c',
                      }}
                    >
                      <option value="GIRIS">🟢 Stok Girişi (+)</option>
                      <option value="CIKIS">🔴 Stok Çıkışı (-)</option>
                    </select>
                  </label>

                  <label>
                    Miktar
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={movementQuantity}
                      onChange={e => setMovementQuantity(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </label>
                </div>

                <label style={{ marginTop: '12px' }}>
                  Açıklama / Not
                  <textarea
                    value={movementNotes}
                    onChange={e => setMovementNotes(e.target.value)}
                    placeholder="Örn. İrsaliye No: 12345, Fatura Vb."
                    rows={2}
                  />
                </label>

                {movementMessage && (
                  <div className="message" role="status" style={{ marginTop: '12px' }}>
                    {movementMessage}
                  </div>
                )}

                <div className="form-actions" style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setMovementQuantity('')
                      setMovementNotes('')
                      setMovementMessage('')
                      setMovementStockCode('')
                      setMovementSearch('')
                    }}
                  >
                    Temizle
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    style={{ background: movementType === 'GIRIS' ? '#16a34a' : '#dc2626' }}
                  >
                    {movementType === 'GIRIS' ? '＋ Stok Girişini Kaydet' : '－ Stok Çıkışını Kaydet'}
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div className="panel-icon" style={{ background: '#f8fafc', color: '#475569' }}>📋</div>
                <div>
                  <h3>Son Stok Hareket Geçmişi</h3>
                  <p>Sistemdeki en son 50 hareket listelenir.</p>
                </div>
              </div>

              {movementsLoading ? (
                <p style={{ color: '#64748b', fontSize: '14px' }}>Hareketler yükleniyor...</p>
              ) : movements.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="empty-icon">📂</div>
                  <h3>Henüz Stok Hareketi Yok</h3>
                  <p>Soldaki formu kullanarak ilk giriş veya çıkış işlemini kaydedebilirsiniz.</p>
                </div>
              ) : (
                <div className="stock-list" style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                  {movements.map(movement => {
                    const isGiris = movement.movement_type === 'GIRIS'
                    return (
                      <div
                        className="stock-row"
                        key={movement.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: isGiris ? 'rgba(240, 253, 244, 0.6)' : 'rgba(254, 242, 242, 0.6)',
                          borderLeft: `4px solid ${isGiris ? '#16a34a' : '#dc2626'}`,
                          marginBottom: '8px',
                        }}
                      >
                        <div className="stock-info" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{movement.stock_code}</strong>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: isGiris ? '#dcfce7' : '#fee2e2',
                                color: isGiris ? '#15803d' : '#991b1b',
                              }}
                            >
                              {isGiris ? '🟢 GİRİŞ (+)' : '🔴 ÇIKIŞ (-)'} {Number(movement.quantity).toLocaleString('tr-TR')}
                            </span>
                          </div>

                          {movement.notes && (
                            <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                              📝 {movement.notes}
                            </div>
                          )}

                          <small style={{ color: '#64748b', fontSize: '11px', display: 'block', textAlign: 'right' }}>
                            👤 {movement.created_by_name || 'Sistem'} · 🕒 {new Date(movement.created_at).toLocaleString('tr-TR')}
                          </small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        <footer>
          FNDEPO <span>•</span> Stok Yönetim Sistemi
        </footer>
      </section>
    </main>
  )
}

export default App