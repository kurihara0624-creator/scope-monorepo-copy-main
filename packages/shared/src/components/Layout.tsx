// === この下のコードを Layout.tsx にまるごと貼り付け ===
import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@myorg/shared';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ★★★ここが修正点★★★
  // handleLogoutを非同期関数(async)に変更
  const handleLogout = async () => {
    // logout処理が完全に終わるのを待つ(await)
    await logout();
    // ログアウトが完了してから、ページを移動させる
    navigate('/login');
  };

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{
        background: 'white', padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Scope</h1>
        </Link>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user.photoURL && <img src={user.photoURL} alt="user icon" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
            <span style={{ fontSize: '0.875rem' }}>{user.displayName}</span>
            <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: 'transparent', cursor: 'pointer' }}>
              ログアウト
            </button>
          </div>
        )}
      </header>
      <main style={{ padding: '2rem', maxWidth: '1024px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}