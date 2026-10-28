import { useState } from 'react';
import './App.css';

// Örnek başlangıç stokları (Supabase bağlayana kadar veya test için)
interface StockItem {
  id: string;
  part_code: string;
  part_name: string;
  shelf: string;
  quantity: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'racks' | 'stock-in' | 'control' | 'settings'>('home');
  
  // Stok arama ve liste state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [stocks] = useState<StockItem[]>([
    { id: '1', part_code: 'FLT-001', part_name: 'Yağ Filtresi', shelf: 'A-1', quantity: 12 },
    { id: '2', part_code: 'BRK-202', part_name: 'Fren Balatası', shelf: 'B-2', quantity: 5 },
    { id: '3', part_code: 'MSK-303', part_name: 'Mazot Filtresi', shelf: 'A-2', quantity: 8 }
  ]);

  // Arama filtresi
  const filteredStocks = stocks.filter(item =>
    item.part_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.shelf.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      {/* ÜST BAR */}
      <header className="main-header">
        <div className="header-brand">
          <div className="brand-logo">F</div>
          <div>
            <h2>FNDEPO</h2>
            <span>Ağır Vasıta Stok Yönetimi</span>
          </div>
        </div>

        {activeTab !== 'home' && (
          <button className="back-home-btn" onClick={() => setActiveTab('home')}>
            🏠 Ana Sayfa'ya Dön
          </button>
        )}
      </header>

      {/* İÇERİK ALANI */}
      <main className="main-content">
        
        {/* 1. ANA SAYFA / KARTLAR */}
        {activeTab === 'home' && (
          <div className="home-container">
            <div className="welcome-banner">
              <h1>Hoş Geldiniz 👋</h1>
              <p>Lütfen yapmak istediğiniz işlemi seçin:</p>
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
                  <p>Veritabanı ve genel ayarlar</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2. STOK KONTROL VE ARAMA EKRANI (ARAMA MOTORU GERİ GELDİ) */}
        {activeTab === 'control' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>🔍 Stok Kontrol & Arama</h2>
              <p>Parçaları hızlıca filtreleyin ve arayın.</p>
            </div>
            <div className="page-body">
              {/* Arama Kutusu */}
              <input 
                type="text" 
                placeholder="Parça Kodu, Ürün Adı veya Raf No ile ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  marginBottom: '16px',
                  outline: 'none'
                }}
              />

              {/* Arama Sonuç Tablosu */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', fontSize: '12px', color: '#475569' }}>
                      <th style={{ padding: '10px' }}>PARÇA KODU</th>
                      <th style={{ padding: '10px' }}>ÜRÜN ADI</th>
                      <th style={{ padding: '10px' }}>RAF</th>
                      <th style={{ padding: '10px' }}>ADET</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.length > 0 ? (
                      filteredStocks.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb' }}>{item.part_code}</td>
                          <td style={{ padding: '10px' }}>{item.part_name}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                              {item.shelf}
                            </span>
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.quantity} Adet</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          Aradığınız kritere uygun parça bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. STOK GİRİŞ EKRANI */}
        {activeTab === 'stock-in' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>📥 Stok Giriş & Çıkış İşlemleri</h2>
              <p>Yeni parça ekleme ve miktar düşme.</p>
            </div>
            <div className="page-body">
              <p className="placeholder-text">Stok giriş formu burada yer alacak.</p>
            </div>
          </div>
        )}

        {/* 4. DEPO RAFLARI EKRANI */}
        {activeTab === 'racks' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>📦 Depo Rafları Yönetimi</h2>
              <p>Raf tanımlama ve düzenleme işlemleri.</p>
            </div>
            <div className="page-body">
              <p className="placeholder-text">Raf yönetim ekranı burada yer alacak.</p>
            </div>
          </div>
        )}

        {/* 5. AYARLAR EKRANI */}
        {activeTab === 'settings' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>⚙️ Sistem Ayarları</h2>
              <p>Veritabanı bağlantısı ve ayarlar.</p>
            </div>
            <div className="page-body">
              <p className="placeholder-text">Ayarlar paneli burada yer alacak.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}