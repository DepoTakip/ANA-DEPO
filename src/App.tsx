import { useState } from 'react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'racks' | 'stock-in' | 'control' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: 'dashboard' | 'racks' | 'stock-in' | 'control' | 'settings') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Menüye tıklayınca mobilde menüyü kapat
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

      {/* SOL MENÜ / MOBİL AÇILIR MENÜ */}
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

      {/* ANA İÇERİK ALANI */}
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
          {activeTab === 'dashboard' && (
            <div className="panel">
              <div className="panel-heading">
                <div className="panel-icon">📊</div>
                <div>
                  <h3>Genel Durum</h3>
                  <p>Depodaki toplam ürün ve raf durumu özet ekranı.</p>
                </div>
              </div>
              <p>Ana sayfa içerikleri burada yer alır.</p>
            </div>
          )}

          {activeTab === 'racks' && (
            <div className="panel">
              <div className="panel-heading">
                <div className="panel-icon">📦</div>
                <div>
                  <h3>Depo Rafları</h3>
                  <p>Raf tanımlama ve düzenleme işlemleri.</p>
                </div>
              </div>
              <p>Raf yönetim ekranı burada açılır.</p>
            </div>
          )}

          {activeTab === 'stock-in' && (
            <div className="panel">
              <div className="panel-heading">
                <div className="panel-icon">📥</div>
                <div>
                  <h3>Stok Giriş / Çıkış</h3>
                  <p>Ürün ekleme ve düşme işlemleri.</p>
                </div>
              </div>
              <p>Stok hareketleri formu burada yer alır.</p>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="panel">
              <div className="panel-heading">
                <div className="panel-icon">🔍</div>
                <div>
                  <h3>Stok Kontrol & Arama</h3>
                  <p>Anlık arama ve filtreleme yapın.</p>
                </div>
              </div>
              <p>Stok kontrol tablosu burada yer alır.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="panel">
              <div className="panel-heading">
                <div className="panel-icon">⚙️</div>
                <div>
                  <h3>Sistem Ayarları</h3>
                  <p>Veritabanı sıfırlama ve sistem tercihleri.</p>
                </div>
              </div>
              <p>Ayarlar paneli burada yer alır.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}