import { useState } from 'react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'racks' | 'stock-in' | 'control' | 'settings'>('home');

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
            🏠 Ana Sayfa'ya Dön
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
              <p>Lütfen yapmak istediğiniz işlemi aşağıdaki menüden seçin:</p>
            </div>

            <div className="menu-grid">
              <button className="menu-card" onClick={() => setActiveTab('racks')}>
                <div className="card-icon">📦</div>
                <div className="card-info">
                  <h3>Depo Rafları</h3>
                  <p>Raf tanımlama ve konum düzenleme</p>
                </div>
              </button>

              <button className="menu-card" onClick={() => setActiveTab('stock-in')}>
                <div className="card-icon">📥</div>
                <div className="card-info">
                  <h3>Stok Giriş / Çıkış</h3>
                  <p>Yeni parça ekleme ve stok düşme</p>
                </div>
              </button>

              <button className="menu-card" onClick={() => setActiveTab('control')}>
                <div className="card-icon">🔍</div>
                <div className="card-info">
                  <h3>Stok Kontrol & Arama</h3>
                  <p>Ağır vasıta parçaları anlık arama</p>
                </div>
              </button>

              <button className="menu-card" onClick={() => setActiveTab('settings')}>
                <div className="card-icon">⚙️</div>
                <div className="card-info">
                  <h3>Sistem Ayarları</h3>
                  <p>Veritabanı sıfırlama ve yapılandırma</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2. DEPO RAFLARI EKRANI */}
        {activeTab === 'racks' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>📦 Depo Rafları Yönetimi</h2>
              <p>Depodaki raflarınızın listesi ve düzenleme paneli.</p>
            </div>
            <div className="page-body">
              {/* Buraya Depo Rafları formunuz/bileşeniniz gelecek */}
              <p className="placeholder-text">Depo rafları içeriği burada görüntülenecek.</p>
            </div>
          </div>
        )}

        {/* 3. STOK GİRİŞ / ÇIKIŞ EKRANI */}
        {activeTab === 'stock-in' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>📥 Stok Giriş & Çıkış İşlemleri</h2>
              <p>Parça ekleme ve stok miktar güncellemeleri.</p>
            </div>
            <div className="page-body">
              {/* Buraya Stok Giriş formunuz/bileşeniniz gelecek */}
              <p className="placeholder-text">Stok giriş/çıkış formu burada görüntülenecek.</p>
            </div>
          </div>
        )}

        {/* 4. STOK KONTROL EKRANI */}
        {activeTab === 'control' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>🔍 Stok Kontrol & Parça Arama</h2>
              <p>Depodaki parçaları hızlıca filtreleyin ve arayın.</p>
            </div>
            <div className="page-body">
              {/* Buraya Stok Kontrol tablonuz/bileşeniniz gelecek */}
              <p className="placeholder-text">Stok arama ve kontrol tablosu burada görüntülenecek.</p>
            </div>
          </div>
        )}

        {/* 5. AYARLAR EKRANI */}
        {activeTab === 'settings' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>⚙️ Sistem Ayarları</h2>
              <p>Veritabanı ve genel sistem ayarları.</p>
            </div>
            <div className="page-body">
              {/* Buraya Ayarlar bileşeniniz gelecek */}
              <p className="placeholder-text">Sistem ayarları burada görüntülenecek.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}