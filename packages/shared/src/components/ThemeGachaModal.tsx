import { useState } from 'react';
import { X } from 'lucide-react';

const themes = { 'Lv1': ['最近、一番楽しかった仕事は？', '週末はどう過ごした？'], 'Lv2': ['今の業務で、一番やりがいを感じる点は？', '今後チャレンジしたい業務は？'], 'Lv3': ['仕事を通じて、どんな自分になりたい？', '5年後、どんな働き方をしていたい？'] };

interface Props { isOpen: boolean; onClose: () => void; onSelect: (theme: string) => void; }

export default function ThemeGachaModal({ isOpen, onClose, onSelect }: Props) {
  if (!isOpen) return null;
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const drawGacha = () => {
    const allThemes = Object.values(themes).flat();
    const randomIndex = Math.floor(Math.random() * allThemes.length);
    setSelectedTheme(allThemes[randomIndex]);
  };
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>🎲 テーマガチャ</h2>
        {selectedTheme ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '0.25rem', margin: '1rem 0' }}>{selectedTheme}</p>
            <button onClick={() => { onSelect(selectedTheme); setSelectedTheme(null); }} style={{ padding: '0.5rem 1.5rem', background: '#2563eb', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>このテーマで話す</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}><button onClick={drawGacha} style={{ padding: '0.75rem 2rem', background: '#facc15', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>ガチャを引く！</button></div>
        )}
      </div>
    </div>
  );
}