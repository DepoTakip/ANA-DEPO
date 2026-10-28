import { useState } from 'react';
import './App.css';

// Varsayılan sekmeler ve durum yönetimi
export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'racks' | 'stock-in' | 'control' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sekme değiştiğinde mobil menüyü otomatik kapat
  const handleTabChange = (tab: 'dashboard' | 'racks' | 'stock-in' | 'control' | 'settings') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app">
      {/* MOBİL ÜST BAR & MENÜ BUTONU */}
      <div className="mobile-header">
        <div className="brand-mobile">
          <div className="brand-icon">F</div>
          <h2>FNDEPO</h2>
        </div>
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕ KAPAT' : '☰ MENÜ'}
        </button>
      </div>

      {/* AÇILIR SOL / MOBİL MENÜ */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">F</div>
          <div>
            <h2>FNDEPO</h2>
            <span>Stok Yönetim Sistemi</span>
          </div>
        </div>

        <div className="menu-container">
          <button 
            className={`menu-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            📊 Ana Sayfa
          </button>
          <button 
            className={`menu-button ${activeTab === 'racks' ? 'active' : ''}`}
            onClick={() => handleTabChange('racks')}
          >
            📦 Depo Rafları
          </button>
          <button 
            className={`menu-button ${activeTab === 'stock-in' ? 'active' : ''}`}
            onClick={() => handleTabChange('stock-in')}
          >
            📥 Stok Giriş / Çıkış
          </button>
          <button 
            className={`menu-button ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => handleTabChange('control')}
          >
            🔍 Stok Kontrol
          </button>
          <button 
            className={`menu-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            ⚙️ Ayarlar
          </button>
        </div>
      </aside>

      {/* MOBİL MENÜ AÇIKKEN ARKA PLANI KARARTMA */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* İÇERİK ALANI */}
      <main className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">FNDEPO YÖNETİMİ</span>
            <h1>
              {activeTab === 'dashboard' && 'Ana Sayfa & Özet'}
              {activeTab === 'racks' && 'Depo Rafları Yönetimi'}
              {activeTab === 'stock-in' && 'Stok Giriş & Çıkış İşlemleri'}
              {activeTab === 'control' && 'Stok Kontrol & Arama'}
              {activeTab === 'settings' && 'Sistem Ayarları'}
            </h1>
          </div>
          <div className="user-badge">Yönetici</div>
        </header>

        <div className="layout">
          {/* İÇERİK SEKMELERİ - MEVCUT BİLEŞENLERİNİZİ VEYA FORMLARINIZI BURAYA KOYABİLİRSİNİZ */}
          <div className="panel">
            <div className="panel-heading">
              <div className="panel-icon">📌</div>
              <div>
                <h3>Aktif Sekme İçeriği</h3>
                <p>Şu an görüntülenen sekme: <strong>{activeTab.toUpperCase()}</strong></p>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Depo ve stok takip sisteminizin bu ekranında seçilen sekmenin verileri listelenir.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}