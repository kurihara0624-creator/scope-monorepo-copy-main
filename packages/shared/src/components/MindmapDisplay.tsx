// === この下の【タイミング改善版】コードを MindmapDisplay.tsx にまるごと貼り付け ===
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// mermaidの初期設定（変更なし）
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
});

interface Props {
  chart: string;
  // ★★★★★ 親から「再描画して！」という合図を受け取るための新しい受け口 ★★★★★
  rerenderKey?: number; 
}

export default function MindmapDisplay({ chart, rerenderKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ★★★★★ chart "または" rerenderKey が変更されるたびに、再描画処理を実行 ★★★★★
  useEffect(() => {
    const renderChart = async () => {
      if (containerRef.current && chart) {
        containerRef.current.innerHTML = ''; // まずは空にする
        try {
          const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), chart); // IDが重複しないようにする
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaidの描画に失敗しました:', error);
          console.log('▼エラー時のMermaidテキスト', chart); // ←この1行を追加
          if (containerRef.current) {
            containerRef.current.innerHTML = '<p style="color: red;">マインドマップの描画に失敗しました。テキストの構文を確認してください。</p>';
          }
        }
      }
    };
    renderChart();
  }, [chart, rerenderKey]); // rerenderKeyの変更も監視する

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        minHeight: '300px', 
        border: '1px solid #e5e7eb', 
        borderRadius: '0.25rem', 
        padding: '1rem',
        background: '#fff'
      }}
    />
  );
}