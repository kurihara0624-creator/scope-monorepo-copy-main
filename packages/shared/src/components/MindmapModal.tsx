// === この下の【タイミング改善版】コードを MindmapModal.tsx にまるごと貼り付け ===
import { X } from 'lucide-react';
import MindmapDisplay from './MindmapDisplay';
// ★★★★★ useState と useEffect をインポート ★★★★★
import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chart: string;
}

export default function MindmapModal({ isOpen, onClose, chart }: Props) {
  // ★★★★★ 再描画の合図を送るための「カウンター」を用意 ★★★★★
  const [rerenderKey, setRerenderKey] = useState(0);

  // ★★★★★ モーダルが開かれた "後" で、再描画の合図を送る ★★★★★
  useEffect(() => {
    if (isOpen) {
      // setTimeoutを使って、DOMの描画が完了するのを待ってからカウンターを更新する
      const timer = setTimeout(() => {
        setRerenderKey(prevKey => prevKey + 1);
      }, 10); // 10ミリ秒後に実行
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // isOpen（モーダルが開いたか閉じたか）を監視する

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, 
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          width: '90vw',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '0.5rem', right: '0.5rem',
            background: 'none', border: 'none', cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <X size={24} color="#6b7280" />
        </button>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>マインドマップ詳細</h3>
        <div style={{ flexGrow: 1, overflow: 'auto' }}>
          {/* ★★★★★ 再描画の合図（カウンター）を部品に渡す ★★★★★ */}
          <MindmapDisplay chart={chart} rerenderKey={rerenderKey} />
        </div>
      </div>
    </div>
  );
}