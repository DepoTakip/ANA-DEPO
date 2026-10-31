import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

// 1. Giriş Ekranı Bileşeni
function LoginPage({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            alert('Giriş başarısız: ' + error.message);
        } else {
            onLogin();
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0f172a',
            fontFamily: 'Inter, sans-serif',
            color: '#fff',
            padding: '20px'
        }}>
            <div style={{
                background: '#1e293b',
                padding: '40px',
                borderRadius: '16px',
                border: '1px solid #334155',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '1px', color: '#38bdf8' }}>FNDEPO</h1>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Depo Yönetim Sistemine Giriş Yapın</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>E-posta Adresi</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="ornek@fndepo.com"
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '10px',
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// 2. Cari (Müşteri) Yönetimi Bileşeni
function CustomerPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
        if (error) console.error('Cari çekme hatası:', error);
        else setCustomers(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !name) {
            alert('Cari Kodu ve Cari Adı zorunludur!');
            return;
        }

        const newCustomer = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            code: code.trim().toUpperCase(),
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
        };

        const { error } = await supabase.from('customers').insert([newCustomer]);
        if (error) {
            alert('Cari eklenemedi: ' + error.message);
        } else {
            setCode('');
            setName('');
            setPhone('');
            setAddress('');
            fetchCustomers();
            alert('Cari başarıyla eklendi! 🎉');
        }
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a' }}>
            <h2 style={{ marginTop: 0 }}>👥 Cari (Müşteri) Yönetimi</h2>

            <form onSubmit={handleAddCustomer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Cari Kodu</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Örn: CARI-001" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Cari / Firma Adı</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Firma ünvanı..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Telefon</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0532..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Adres</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Şehir / İlçe / Açık adres..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        + Yeni Cari Kaydet
                    </button>
                </div>
            </form>

            {loading ? <p>Yükleniyor...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                                <th style={{ padding: '10px' }}>Cari Kodu</th>
                                <th style={{ padding: '10px' }}>Firma Adı</th>
                                <th style={{ padding: '10px' }}>Telefon</th>
                                <th style={{ padding: '10px' }}>Adres</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c => (
                                <tr key={c.id || c.code} style={{ borderTop: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb' }}>{c.code}</td>
                                    <td style={{ padding: '10px', fontWeight: '600' }}>{c.name}</td>
                                    <td style={{ padding: '10px' }}>{c.phone || '-'}</td>
                                    <td style={{ padding: '10px', color: '#64748b' }}>{c.address || '-'}</td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Henüz kayıtlı cari yok.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// 3. Ana Uygulama Bileşeni
export function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState<'customers'>('customers');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setIsAuthenticated(true);
        });
    }, []);

    if (!isAuthenticated) {
        return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh', padding: '20px', color: '#0f172a' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>📦 FNDEPO WMS Yönetim Paneli</h1>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Cari ve Depo Operasyon Yönetimi</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setActiveTab('customers')}
                            style={{ padding: '10px 16px', background: activeTab === 'customers' ? '#2563eb' : '#fff', color: activeTab === 'customers' ? '#fff' : '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            👥 Cariler
                        </button>
                        <button
                            onClick={() => {
                                supabase.auth.signOut();
                                setIsAuthenticated(false);
                            }}
                            style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </header>

                {activeTab === 'customers' && (
                    <CustomerPage />
                )}
            </div>
        </div>
    );
}

export default App;