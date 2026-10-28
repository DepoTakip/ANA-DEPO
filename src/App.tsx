import { useState } from 'react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'racks' | 'stock-in' | 'control' | 'settings'>('home');

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

        {/* 2. STOK KONTROL EKRANI */}
        {activeTab === 'control' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>🔍 Stok Kontrol & Arama</h2>
              <p>Parçaları hızlıca filtreleyin ve arayın.</p>
            </div>
            <div className="page-body">
              <p className="placeholder-text">Stok arama ve liste ekranı burada yer alacak.</p>
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