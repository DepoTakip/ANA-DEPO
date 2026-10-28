import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// SUPABASE BAGLANTISI
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface StockItem {
  id: string;
  part_code: string;
  part_name: string;
  shelf: string;
  quantity: number;
  min_quantity: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'racks' | 'stock-in' | 'control' | 'settings'>('home');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stok Giriş / Çıkış Form Durumları
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [shelf, setShelf] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  
  // Depo Raf Tanımlama Durumları
  const [racks, setRacks] = useState<string[]>(['A-1', 'A-2', 'B-1', 'B-2', 'C-1']);
  const [newRackName, setNewRackName] = useState('');

  // Veritabanından Stokları Çek
  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    if (!supabaseUrl) return;
    const { data, error } = await supabase.from('stocks').select('*');
    if (!error && data) {
      setStocks(data);
    }
  };

  // Stok Ekleme / Güncelleme
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partCode || !partName || !shelf || quantity === '') {
      alert('Lütfen tüm alanları doldurun kanka!');
      return;
    }

    const newStock = {
      part_code: partCode.trim().toUpperCase(),
      part_name: partName.trim(),
      shelf: shelf.trim().toUpperCase(),
      quantity: Number(quantity)
    };

    if (supabaseUrl) {
      const { error } = await supabase.from('stocks').insert([newStock]);
      if (error) {
        alert('Hata oluştu: ' + error.message);
      } else {
        alert('Stok başarıyla eklendi! 🎉');
        fetchStocks();
      }
    } else {
      // Supabase bağlı değilse yerel test
      setStocks([...stocks, { id: Date.now().toString(), min_quantity: 5, ...newStock }]);
      alert('Stok başarıyla eklendi (Test Modu)! 🎉');
    }

    setPartCode('');
    setPartName('');
    setQuantity('');
  };

  // Yeni Raf Ekleme
  const handleAddRack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRackName.trim()) return;
    const formatted = newRackName.trim().toUpperCase();
    if (racks.includes(formatted)) {
      alert('Bu raf zaten var kanka!');
      return;
    }
    setRacks([...racks, formatted]);
    setNewRackName('');
    alert('Yeni raf eklendi! 📦');
  };

  // Stok Arama Filtresi (Substring Search)
  const filteredStocks = stocks.filter(item =>
    item.part_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.shelf.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      {/* ÜST BAR / MASAÜSTÜ & MOBİL ORTAK */}
      <header className="main-header">
        <div className="header-brand">
          <div className="brand-logo">F</div>
          <div>
            <h2>FNDEPO</h2>
            <span>Ağır Vasıta Stok Yönetimi</span>
          </div>
        </div>

        {/* Ana sayfada değilsek çıkan 'Ana Sayfa'ya Dön' butonu */}
        {activeTab !== 'home' && (
          <button className="back-home-btn" onClick={() => setActiveTab('home')}>
            🏠 Ana Sayfa
          </button>
        )}
      </header>

      {/* İÇERİK ALANI */}
      <main className="main-content">
        
        {/* 1. ANA SAYFA / MOBİL MENÜ KARTLARI */}
        {activeTab === 'home' && (
          <div className="home-container">
            <div className="welcome-banner">
              <h1>Hoş Geldiniz 👋</h1>
              <p>Yapmak istediğiniz işlemi seçin:</p>
            </div>

            <div className="menu-grid">
              <button className="menu-card" onClick={() => setActiveTab('control')}>
                <div className="card-icon">🔍</div>
                <div className="card-info">
                  <h3>Stok Kontrol & Arama</h3>
                  <p>Parça kodu, ad veya rafa göre arama yapın</p>
                </div>
              </button>

              <button className="menu-card" onClick={() => setActiveTab('stock-in')}>
                <div className="card-icon">📥</div>
                <div className="card-info">
                  <h3>Stok Giriş / Çıkış</h3>
                  <p>Yeni ürün ekleyin veya adet güncelleyin</p>
                </div>
              </button>

              <button className="menu-card" onClick={() => setActiveTab('racks')}>
                <div className="card-icon">📦</div>
                <div className="card-info">
                  <h3>Depo Rafları</h3>
                  <p>Raf tanımlama ve konum düzenleme</p>
                </div>
              </button>

              <button className="menu-card" onClick={() => setActiveTab('settings')}>
                <div className="card-icon">⚙️</div>
                <div className="card-info">
                  <h3>Sistem Ayarları</h3>
                  <p>Veritabanı bağlantısı ve ayarlar</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2. STOK KONTROL & PARÇA ARAMA EKRANI */}
        {activeTab === 'control' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>🔍 Stok Kontrol & Arama</h2>
              <p>Ağır vasıta parçalarını anlık arayın.</p>
            </div>
            <div className="page-body">
              <input 
                type="text" 
                placeholder="Parça Kodu, Ürün Adı veya Raf No Ara..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />

              <div className="table-responsive" style={{ marginTop: '16px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Parça Kodu</th>
                      <th>Parça Adı</th>
                      <th>Raf</th>
                      <th>Adet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.length > 0 ? (
                      filteredStocks.map((item) => (
                        <tr key={item.id || item.part_code}>
                          <td><strong>{item.part_code}</strong></td>
                          <td>{item.part_name}</td>
                          <td><span className="badge-shelf">{item.shelf}</span></td>
                          <td>{item.quantity} Adet</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>
                          Aranan kritere uygun parça bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. STOK GİRİŞ / ÇIKIŞ EKRANI */}
        {activeTab === 'stock-in' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>📥 Stok Giriş & Çıkış Formu</h2>
              <p>Depoya yeni ürün ekleyin veya stok güncelleyin.</p>
            </div>
            <div className="page-body">
              <form onSubmit={handleAddStock} className="stock-form">
                <label>
                  Parça Kodu:
                  <input 
                    type="text" 
                    placeholder="Örn: 1294821" 
                    value={partCode} 
                    onChange={(e) => setPartCode(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Parça Adı / Tanımı:
                  <input 
                    type="text" 
                    placeholder="Örn: Fren Disk Aynası" 
                    value={partName} 
                    onChange={(e) => setPartName(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Depo Rafı Seçin:
                  <select value={shelf} onChange={(e) => setShelf(e.target.value)} required>
                    <option value="">Raf Seçiniz...</option>
                    {racks.map(r => (
                      <option key={r} value={r}>{r} Rafı</option>
                    ))}
                  </select>
                </label>

                <label>
                  Adet / Miktar:
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  />
                </label>

                <button type="submit" className="primary-btn">
                  ➕ Stok Kaydet / Güncelle
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. DEPO RAFLARI EKRANI */}
        {activeTab === 'racks' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>📦 Depo Rafları Yönetimi</h2>
              <p>Mevcut rafları görün veya yeni raf ekleyin.</p>
            </div>
            <div className="page-body">
              <form onSubmit={handleAddRack} className="rack-form">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Yeni Raf Kodu (Örn: D-1)" 
                    value={newRackName}
                    onChange={(e) => setNewRackName(e.target.value)}
                  />
                  <button type="submit" className="primary-btn" style={{ width: 'auto' }}>
                    Ekle
                  </button>
                </div>
              </form>

              <h3 style={{ marginTop: '20px', fontSize: '15px' }}>Tanımlı Raflar:</h3>
              <div className="rack-list">
                {racks.map(r => (
                  <div key={r} className="rack-badge">
                    📦 {r} Rafı
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. AYARLAR EKRANI */}
        {activeTab === 'settings' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>⚙️ Sistem Ayarları</h2>
              <p>Sistem durumu ve veritabanı bilgileri.</p>
            </div>
            <div className="page-body">
              <p><strong>Veritabanı Durumu:</strong> {supabaseUrl ? '✅ Supabase Bağlı' : '⚠️ Test Modu (Supabase Bağlı Değil)'}</p>
              <p><strong>Toplam Stok Çeşidi:</strong> {stocks.length} Kalem Ürün</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}