
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

type Stock = {
  code: string
  name: string
  barcode: string
  unit: string
  description: string
}

function App() {
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
        .select('code, name, barcode, unit, description')

      if (error) throw error

      const cloudStocks: Stock[] = (data ?? []).map(row => ({
        code: row.code,
        name: row.name,
        barcode: row.barcode ?? '',
        unit: row.unit ?? 'Adet',
        description: row.description ?? '',
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
    async function addStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const cleanCode = code.trim()
    const cleanName = name.trim()

    if (!cleanCode || !cleanName) {
      setMessage('Stok kodu ve stok adı zorunludur.')
      return
    }

    if (stocks.some(
      stock => stock.code.toLowerCase() === cleanCode.toLowerCase()
    )) {
      setMessage('Bu stok kodu zaten kayıtlı.')
      return
    }

    const newStock: Stock = {
      code: cleanCode,
      name: cleanName,
      barcode: barcode.trim(),
      unit,
      description: description.trim(),
    }

    setMessage('Stok buluta kaydediliyor...')

    try {
      const { error } = await supabase
        .from('stocks')
        .insert(newStock)

      if (error) {
        setMessage('Buluta kaydedilemedi: ' + error.message)
        return
      }

      setStocks(previous => [...previous, newStock])
      setCode('')
      setName('')
      setBarcode('')
      setUnit('Adet')
      setDescription('')
      setMessage('Stok başarıyla buluta kaydedildi.')
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMessage('Kayıt sırasında hata oluştu: ' + detail)
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
  KONTROL TESTİ
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
                      {stock.barcode && <small>Barkod: {stock.barcode}</small>}
                      {stock.description && <small>{stock.description}</small>}
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
