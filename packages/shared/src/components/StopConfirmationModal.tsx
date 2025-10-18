// === 以下のコードで StopConfirmationModal.tsx を新規作成 ===
import { MicOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function StopConfirmationModal({ isOpen, onConfirm, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, 
      }}
    >
      <div 
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          width: '90%',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>文字起こしを停止しますか？</h3>
        <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
          3分以上、新しい音声が文字に変換されていません。
          <br />
          マイクをオフにしますか？
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            キャンセル
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <MicOff size={20} />
            停止する
          </button>
        </div>
      </div>
    </div>
  );
}