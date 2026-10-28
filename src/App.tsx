import React, { useState } from 'react';
import './App.css';

interface StockItem {
  id: string;
  part_code: string;
  part_name: string;
  shelf: string;
  quantity: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'racks' | 'stock-in' | 'control' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [stocks] = useState<StockItem[]>([
    { id: '1', part_code: 'FLT-001', part_name: 'Yağ Filtresi', shelf: 'A-1', quantity: 12 },
    { id: '2', part_code: 'BRK-202', part_name: 'Fren Balatası', shelf: 'B-2', quantity: 5 },
    { id: '3', part_code: 'MSK-303', part_name: 'Mazot Filtresi', shelf: 'A-2', quantity: 8 }
  ]);

  const filteredStocks = stocks.filter(item =>
    item.part_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.shelf.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      {/* SOL MENÜ (KLASİK MASAÜSTÜ YAPI) */}
      <aside className="sidebar">
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
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Ana Sayfa
          </button>
          <button 
            className={`menu-button ${activeTab === 'racks' ? 'active' : ''}`}
            onClick={() => setActiveTab('racks')}
          >
            📦 Depo Rafları
          </button>
          <button 
            className={`menu-button ${activeTab === 'stock-in' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock-in')}
          >
            📥 Stok Giriş / Çıkış
          </button>
          <button 
            className={`menu-button ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => setActiveTab('control')}
          >
            🔍 Stok Kontrol
          </button>
          <button 
            className={`menu-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Ayarlar
          </button>
        </div>
      </aside>

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

              <input 
                type="text" 
                placeholder="Parça Kodu, Ürün Adı veya Raf No ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px', marginTop: '14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />

              <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', fontSize: '12px' }}>
                      <th style={{ padding: '8px' }}>PARÇA KODU</th>
                      <th style={{ padding: '8px' }}>ÜRÜN ADI</th>
                      <th style={{ padding: '8px' }}>RAF</th>
                      <th style={{ padding: '8px' }}>ADET</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.part_code}</td>
                        <td style={{ padding: '8px' }}>{item.part_name}</td>
                        <td style={{ padding: '8px' }}>{item.shelf}</td>
                        <td style={{ padding: '8px' }}>{item.quantity} Adet</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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