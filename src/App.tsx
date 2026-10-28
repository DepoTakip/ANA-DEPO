import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// SUPABASE BAGLANTISI (Güvenli Kontrol)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

interface StockItem {
  id: string;
  part_code: string;
  part_name: string;
  shelf: string;
  quantity: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'racks' | 'stock-in' | 'control' | 'settings'>('home');
  const [stocks, setStocks] = useState<StockItem[]>([
    { id: '1', part_code: 'FLT-001', part_name: 'Yağ Filtresi', shelf: 'A-1', quantity: 12 },
    { id: '2', part_code: 'BRK-202', part_name: 'Fren Balatası', shelf: 'B-2', quantity: 5 }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form Durumları
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [shelf, setShelf] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  
  // Depo Rafları
  const [racks, setRacks] = useState<string[]>(['A-1', 'A-2', 'B-1', 'B-2', 'C-1']);
  const [newRackName, setNewRackName] = useState('');

  // Veritabanından Stokları Çek
  useEffect(() => {
    if (supabase) {
      fetchStocks();
    }
  }, []);

  const fetchStocks = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('stocks').select('*');
      if (!error && data && data.length > 0) {
        setStocks(data);
      }
    } catch (err) {
      console.error('Supabase bağlantı hatası:', err);
    }
  };

  // Stok Ekleme
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partCode || !partName || !shelf || quantity === '') {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    const newStock = {
      id: Date.now().toString(),
      part_code: partCode.trim().toUpperCase(),
      part_name: partName.trim(),
      shelf: shelf.trim().toUpperCase(),
      quantity: Number(quantity)
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('stocks').insert([{
          part_code: newStock.part_code,
          part_name: newStock.part_name,
          shelf: newStock.shelf,
          quantity: newStock.quantity
        }]);

        if (error) {
          alert('Supabase Kayıt Hatası: ' + error.message);
        } else {
          alert('Stok Supabase veritabanına başarıyla eklendi! 🎉');
          fetchStocks();
        }
      } catch (err) {
        alert('Bağlantı hatası oluştu, yerel hafızaya ekleniyor.');
        setStocks(prev => [...prev, newStock]);
      }
    } else {
      setStocks(prev => [...prev, newStock]);
      alert('Stok başarıyla eklendi! 🎉');
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
      alert('Bu raf zaten mevcut!');
      return;
    }
    setRacks([...racks, formatted]);
    setNewRackName('');
    alert('Yeni raf eklendi! 📦');
  };

  // Filtreleme
  const filteredStocks = stocks.filter(item =>
    (item.part_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.part_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.shelf || '').toLowerCase().includes(searchQuery.toLowerCase())
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
            🏠 Ana Sayfa
          </button>
        )}
      </header>

      {/* İÇERİK ALANI */}
      <main className="main-content">
        
        {/* 1. ANA SAYFA */}
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
                  <p>Veritabanı durumu ve yapılandırma</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2. STOK ARAMA */}
        {activeTab === 'control' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>🔍 Stok Kontrol & Arama</h2>
              <p>Parçaları hızlıca filtreleyin.</p>
            </div>
            <div className="page-body">
              <input 
                type="text" 
                placeholder="Parça Kodu, Ürün Adı veya Raf Ara..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
              />

              <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontSize: '11px' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Parça Kodu</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Parça Adı</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Raf</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Adet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.length > 0 ? (
                      filteredStocks.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px' }}><strong>{item.part_code}</strong></td>
                          <td style={{ padding: '10px' }}>{item.part_name}</td>
                          <td style={{ padding: '10px' }}>{item.shelf}</td>
                          <td style={{ padding: '10px' }}>{item.quantity} Adet</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                          Aranan kritere uygun ürün bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. STOK GİRİŞ FORM */}
        {activeTab === 'stock-in' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>📥 Stok Giriş / Çıkış Formu</h2>
              <p>Yeni stok ekleyin veya güncelleyin.</p>
            </div>
            <div className="page-body">
              <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                  Parça Kodu:
                  <input 
                    type="text" 
                    placeholder="Örn: 1294821" 
                    value={partCode} 
                    onChange={(e) => setPartCode(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    required
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                  Parça Adı:
                  <input 
                    type="text" 
                    placeholder="Örn: Fren Disk Aynası" 
                    value={partName} 
                    onChange={(e) => setPartName(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    required
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                  Depo Rafı Seçin:
                  <select 
                    value={shelf} 
                    onChange={(e) => setShelf(e.target.value)} 
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    required
                  >
                    <option value="">Raf Seçiniz...</option>
                    {racks.map(r => (
                      <option key={r} value={r}>{r} Rafı</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                  Adet / Miktar:
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    required
                  />
                </label>

                <button type="submit" className="back-home-btn" style={{ padding: '12px', marginTop: '8px' }}>
                  ➕ Stok Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. DEPO RAFLARI */}
        {activeTab === 'racks' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>📦 Depo Rafları Yönetimi</h2>
              <p>Mevcut rafları görün veya yeni raf ekleyin.</p>
            </div>
            <div className="page-body">
              <form onSubmit={handleAddRack} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Yeni Raf Kodu (Örn: D-1)" 
                  value={newRackName}
                  onChange={(e) => setNewRackName(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <button type="submit" className="back-home-btn">Ekle</button>
              </form>

              <h3>Tanımlı Raflar:</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {racks.map(r => (
                  <div key={r} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                    📦 {r} Rafı
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. AYARLAR */}
        {activeTab === 'settings' && (
          <div className="page-panel">
            <div className="page-header">
              <h2>⚙️ Sistem Ayarları</h2>
            </div>
            <div className="page-body">
              <p><strong>Veritabanı Durumu:</strong> {supabase ? '✅ Supabase Bağlantısı Aktif' : '⚠️ Çevrimdışı / Yerel Mod'}</p>
              <p><strong>Mevcut Stok Kayıt Sayısı:</strong> {stocks.length} Kalem Ürün</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}