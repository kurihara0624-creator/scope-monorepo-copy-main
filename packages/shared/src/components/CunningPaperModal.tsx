// === この下のコードを CunningPaperModal.tsx に貼り付け ===
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CunningPaperModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white', padding: '1.5rem 2rem', borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        width: '90%', maxWidth: '600px', position: 'relative',
        maxHeight: '80vh', overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X color="#6b7280" />
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5rem' }}>💡 カンニングペーパー</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '0.25rem' }}>傾聴のヒント (TIPS)</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#374151' }}>
                <li style={{marginTop: '0.5rem'}}>**相槌のバリエーション:** 「なるほど」「それで？」「面白いですね！」など、単調にならないように。</li>
                <li style={{marginTop: '0.5rem'}}>**オープンクエスチョン:** 「はい/いいえ」で終わらない質問を。「どうしてそう思う？」「具体的には？」</li>
                <li style={{marginTop: '0.5rem'}}>**沈黙を恐れない:** 相手が考えるための「間」も大切。焦って言葉を継がない。</li>
                <li style={{marginTop: '0.5rem'}}>**事実と感情を分けて聴く:** 「〜という出来事があったんですね。その時どう感じましたか？」</li>
            </ul>
        </div>
        <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#ef4444', borderBottom: '2px solid #ef4444', paddingBottom: '0.25rem' }}>避けたい会話 (NG例)</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#374151' }}>
                <li style={{marginTop: '0.5rem'}}>**すぐにアドバイス:** まずは相手の話を最後まで聴くことに集中する。</li>
                <li style={{marginTop: '0.5rem'}}>**自分の話にすり替える:** 「わかる、俺の時も〜」と自分の経験を語りすぎない。</li>
                <li style={{marginTop: '0.5rem'}}>**詰問・尋問:** 「なんでできなかったの？」と問い詰めるのではなく、「何が障壁になったかな？」と尋ねる。</li>
                <li style={{marginTop: '0.5rem'}}>**評価・ジャッジ:** 「それは君が悪い」など、相手の考えや行動を一方的に評価しない。</li>
            </ul>
        </div>
      </div>
    </div>
  );
}
