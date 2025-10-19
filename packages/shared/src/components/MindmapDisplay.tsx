import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
});

export interface MindmapDisplayProps {
  chart: string;
  rerenderKey?: number;
}

const FALLBACK_MESSAGE =
  '<p style="color: #dc2626; font-size: 0.875rem;">マインドマップの描画に失敗しました。Mermaid構文を確認してください。</p>';

export default function MindmapDisplay({ chart, rerenderKey }: MindmapDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      if (!chart.trim()) {
        return;
      }

      try {
        const { svg } = await mermaid.render(`mindmap-${Date.now()}`, chart);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Failed to render Mermaid chart:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = FALLBACK_MESSAGE;
        }
      }
    };

    void renderChart();
  }, [chart, rerenderKey]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '320px',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        background: '#ffffff',
      }}
    />
  );
}
