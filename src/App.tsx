
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
  created_at: string
}
function App() {
  const [movementStockCode, setMovementStockCode] = useState('')
const [movementType, setMovementType] = useState<'GIRIS' | 'CIKIS'>('GIRIS')
const [movementQuantity, setMovementQuantity] = useState('')
const [movementNotes, setMovementNotes] = useState('')
const [movementMessage, setMovementMessage] = useState('')
const [movements, setMovements] = useState<StockMovement[]>([])
const [movementsLoading, setMovementsLoading] = useState(false)
  const [stocks, setStocks] = useState<Stock[]>(() => {
    try {
      const savedStocks = localStorage.getItem('depotakip_stocks')
      return savedStocks ? JSON.parse(savedStocks) as Stock[] : []
    } catch {
      return []
    }
  })

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [unit, setUnit] = useState('Adet')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
const [syncMessage, setSyncMessage] = useState('')
const [syncing, setSyncing] = useState(true)
  useEffect(() => {
    localStorage.setItem('depotakip_stocks', JSON.stringify(stocks))
  }, [stocks])
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

      cloudStocks.forEach(stock => {
        merged.set(stock.code.toLowerCase(), stock)
      })

      localOnly.forEach(stock => {
        merged.set(stock.code.toLowerCase(), stock)
      })

      if (!cancelled) {
        setStocks(Array.from(merged.values()))
        setSyncMessage(
          `Bulut eşitlemesi tamamlandı. ${localOnly.length} stok aktarıldı.`
        )
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
        .select('id, stock_code, movement_type, quantity, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setMovements((data ?? []) as StockMovement[])
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMovementMessage('Movement history could not load: ' + detail)
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
      setMovementMessage('Please select a stock item.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMovementMessage('Quantity must be greater than zero.')
      return
    }

    setMovementMessage('Saving movement...')

    try {
      const { data, error } = await supabase.rpc(
        'register_stock_movement',
        {
          p_stock_code: movementStockCode,
          p_movement_type: movementType,
          p_quantity: quantity,
          p_notes: movementNotes.trim(),
        }
      )

      if (error) throw error

      const result = (
        data as Array<{ current_quantity: number | string }> | null
      )?.[0]

      if (!result) throw new Error('No result returned from database.')

      setStocks(previous =>
        previous.map(stock =>
          stock.code === movementStockCode
            ? { ...stock, quantity: Number(result.current_quantity) }
            : stock
        )
      )

      setMovementMessage('Stock movement saved successfully.')
      setMovementQuantity('')
      setMovementNotes('')
      await loadMovementHistory()
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMovementMessage('Could not save movement: ' + detail)
    }
  }

  async function addStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const cleanCode = code.trim()
    const cleanName = name.trim()

    if (!cleanCode || !cleanName) {
      setMessage('Stock code and name are required.')
      return
    }

    if (stocks.some(stock =>
      stock.code.toLowerCase() === cleanCode.toLowerCase()
    )) {
      setMessage('This stock code already exists.')
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

    setMessage('Saving stock to cloud...')

    try {
      const { error } = await supabase
        .from('stocks')
        .insert(newStock)

      if (error) {
        setMessage('Could not save stock: ' + error.message)
        return
      }

      setStocks(previous => [...previous, newStock])
      setCode('')
      setName('')
      setBarcode('')
      setUnit('Adet')
      setDescription('')
      setMessage('Stock saved successfully.')
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMessage('Save failed: ' + detail)
    }
  }
  function backupStocks() {
    if (stocks.length === 0) {
      window.alert('Yedeklenecek stok kaydı bulunamadı.')
      return
    }

    const json = JSON.stringify(stocks, null, 2)
    const blob = new Blob([json], {
      type: 'application/json;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `depotakip-stok-yedegi-${date}.json`

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => URL.revokeObjectURL(url), 1000)

    window.alert(
      `${stocks.length} stok kaydı yedeklenmek üzere indirildi. İndirilenler klasörünü kontrol et.`
    )

  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">D</div>
          <div>
            <h2>DepoTakip</h2>
            <span>Stok Yönetim Sistemi</span>
          </div>
        </div>

        <div className="menu-label">ANA MENÜ</div>
        <div className="menu-item active">▦　Stok Kartları</div>
        <div className="menu-item">▤　Depo ve Raflar</div>
        <div className="menu-item">⇄　Stok Hareketleri</div>
        <div className="menu-item">▥　Sayım İşlemleri</div>
        <div className="menu-item">⚙　Ayarlar</div>
        <div className="sidebar-bottom">Depo yönetimi artık daha kolay.</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">DEPO YÖNETİMİ</span>
            <h1>Stok Kartları</h1>
          </div>
          <div className="user-badge">Yönetici</div>
        </header>
        <p role="status">
  {syncing
    ? 'Stoklar eşitleniyor...'
    : syncMessage || 'Eşitleme mesajı oluşmadı.'}
</p>
<p style={{ color: 'red', fontSize: '20px' }}>
</p>
        <div className="welcome">
          <div>
            <h2>Stok kartı oluştur</h2>
            <p>Ürün bilgilerini girerek yeni bir stok kaydı ekleyin.</p>
          </div>
          <span className="welcome-icon">📦</span>
        </div>

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
              <label>Stok Kodu <b>*</b>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="Örn. STK-0001" />
              </label>

              <label>Stok Adı <b>*</b>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ürün adını girin" />
              </label>

              <label>Barkod
                <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Barkod numarası" />
              </label>

              <label>Birim
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

              <label>Açıklama
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ürün hakkında notlar..." rows={3} />
              </label>

              {message && <div className="message">{message}</div>}

              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => {
                  setCode('')
                  setName('')
                  setBarcode('')
                  setUnit('Adet')
                  setDescription('')
                  setMessage('')
                }}>
                  Temizle
                </button>

                <button type="submit" className="primary">＋　Stok Kartını Kaydet</button>
              </div>
            </form>
          </section>

          <section className="panel stock-panel">
            <div className="list-heading">
              <div>
                <h3>Kayıtlı Stoklar</h3>
                <p>Kaydedilen ürünler</p>
              </div>
              <span className="count">{stocks.length} kayıt</span>
                            <button
                type="button"
                className="secondary"
                onClick={backupStocks}
              >
                ↓ Stokları Yedekle
              </button>
            </div>

            {stocks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Henüz stok kaydı yok</h3>
                <p>İlk stok kartınızı soldaki formdan oluşturabilirsiniz.</p>
              </div>
            ) : (
              <div className="stock-list">
                {stocks.map(stock => (
                  <div className="stock-row" key={stock.code}>
                    <div className="stock-symbol">📦</div>
                    <div className="stock-info">
                      <strong>{stock.name}</strong>
                      <span>{stock.code} · {stock.unit}</span>
                      <span>
  Mevcut miktar: {Number(stock.quantity ?? 0).toLocaleString('tr-TR')} {stock.unit}
</span>
                      {stock.barcode && <small>Barkod: {stock.barcode}</small>}
                      {stock.description && <small>{stock.description}</small>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
<div className="layout">
  <section className="panel">
    <div className="panel-heading">
      <div className="panel-icon">⇄</div>
      <div>
        <h3>Stok Giriş / Çıkış</h3>
        <p>Depoya giren ve depodan çıkan miktarları kaydet.</p>
      </div>
    </div>

    <form onSubmit={addMovement}>
      <label>Stok seçimi
        <select
          value={movementStockCode}
          onChange={e => setMovementStockCode(e.target.value)}
          required
        >
          <option value="">Stok seç</option>
          {stocks.map(stock => (
            <option key={stock.code} value={stock.code}>
              {stock.code} — {stock.name}
            </option>
          ))}
        </select>
      </label>

      <label>Hareket türü
        <select
          value={movementType}
          onChange={e =>
            setMovementType(e.target.value as 'GIRIS' | 'CIKIS')
          }
        >
          <option value="GIRIS">Stok Girişi</option>
          <option value="CIKIS">Stok Çıkışı</option>
        </select>
      </label>

      <label>Miktar
        <input
          type="number"
          min="0.001"
          step="0.001"
          value={movementQuantity}
          onChange={e => setMovementQuantity(e.target.value)}
          placeholder="Miktar gir"
          required
        />
      </label>

      <label>Açıklama
        <textarea
          value={movementNotes}
          onChange={e => setMovementNotes(e.target.value)}
          placeholder="Örn. Satın alma, sevkiyat veya sayım"
          rows={3}
        />
      </label>

      {movementMessage && (
        <div className="message" role="status">
          {movementMessage}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setMovementQuantity('')
            setMovementNotes('')
            setMovementMessage('')
          }}
        >
          Temizle
        </button>
        <button type="submit" className="primary">
          Hareketi Kaydet
        </button>
      </div>
    </form>
  </section>

  <section className="panel">
    <div className="panel-heading">
      <div className="panel-icon">≡</div>
      <div>
        <h3>Son Stok Hareketleri</h3>
        <p>En son 50 giriş ve çıkış işlemi</p>
      </div>
    </div>

    {movementsLoading ? (
      <p>Hareketler yükleniyor...</p>
    ) : movements.length === 0 ? (
      <p>Henüz stok hareketi yok.</p>
    ) : (
      <div className="stock-list">
        {movements.map(movement => (
          <div className="stock-row" key={movement.id}>
            <div className="stock-symbol">
              {movement.movement_type === 'GIRIS' ? '↓' : '↑'}
            </div>
            <div className="stock-info">
              <strong>
                {movement.stock_code} ·{' '}
                {movement.movement_type === 'GIRIS'
                  ? 'Stok Girişi'
                  : 'Stok Çıkışı'}
              </strong>
              <span>
                {Number(movement.quantity).toLocaleString('tr-TR')}
              </span>
              <small>
                {new Date(movement.created_at).toLocaleString('tr-TR')}
              </small>
              {movement.notes && <small>{movement.notes}</small>}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
</div>
        <footer>DepoTakip <span>•</span> Stok Yönetim Sistemi</footer>
      </section>
    </main>
  )
}

export default App
