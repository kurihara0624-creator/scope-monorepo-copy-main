import { useState, useEffect, useRef } from 'react';
import { GitBranch, Expand, Loader2 } from 'lucide-react';
import MindmapDisplay from './MindmapDisplay';
import MindmapModal from './MindmapModal';
import { Section } from './Section';
import { callGeminiProxy } from '../utils/geminiProxy';

const MODEL_OVERRIDE = import.meta.env.VITE_GEMINI_MODEL_OVERRIDE;

// このコンポーネントが親から受け取る情報
interface MindmapSectionProps {
  editableTranscript: string;
  isListening: boolean;
  onMindmapUpdate: (mindmapText: string) => void;
  initialMindmapText: string;
}

export function MindmapSection({ editableTranscript, isListening, onMindmapUpdate, initialMindmapText }: MindmapSectionProps) {
  const [mindmapText, setMindmapText] = useState(initialMindmapText);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [isMindmapModalOpen, setMindmapModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const lastProcessedTranscriptRef = useRef<string>('');

  useEffect(() => {
    setMindmapText(initialMindmapText);
    // lastProcessedTranscriptRef.current = editableTranscript;
  }, [initialMindmapText, editableTranscript]);

  const handleGenerateMindmap = async (source: 'manual' | 'auto' = 'manual') => {
    if (editableTranscript.trim() === lastProcessedTranscriptRef.current.trim()) {
      console.log("文字起こし内容に変更がないため、API呼び出しをスキップしました。");
      if (isAutoUpdating) setIsAutoUpdating(false);
      if (isGeneratingMap) setIsGeneratingMap(false);
      setErrorMessage(null);
      return;
    }
    if (editableTranscript.trim() === '' && source === 'manual') {
      setErrorMessage('マインドマップの元になる会話の記録がありません。');
      return;
    }
    if (isGeneratingMap || isAutoUpdating) return;

    if (source === 'manual') setIsGeneratingMap(true);
    else setIsAutoUpdating(true);
    setErrorMessage(null);

    try {
      const prompt = `あなたは、論理的な思考と、話者の感情への深い共感能力を兼ね備えた、最高のグラフィックファシリテーターです。
      以下の【会話記録】を分析し、その内容を厳密なJSON形式で出力してください。

      【思考ステップ】
      1.  **中心テーマの特定:** 会話全体から、最も根幹となる「中心テーマ」を1つだけ見つけ出し、"rootTopic"の値とします。

      2.  **事実・トピックの抽出と詳細化:**
          - 会話の中から、具体的な出来事、プロジェクト、趣味、タスクに関する話題の塊を2〜4つ抽出し、"categories"配列の要素とします。
          - 各カテゴリについて、会話の内容を具体的に掘り下げ、**必要であれば4〜5階層の深さ**になるように詳細な子要素を再帰的に追加してください。

      3.  **感情・価値観のキーワード抽出:**
          - 会話の中から、話者の内面的な感情や価値観を最も象徴する**重要なキーワードを2〜4個だけ**抽出します。
          - 抽出したキーワードを、**文字列の配列**として "emotions" の値にしてください。

      4.  **得意な行動（動詞）の抽出:**
          - 会話の中から、その人の強みやモチベーションの源泉となっている「行動」を**動詞の形で2〜4個**抽出します。（例：「話す」「解決する」「作る」「聞く」など）
          - 抽出した動詞を、**文字列の配列**として "actions" の値にしてください。

      5.  **厳守事項:** 会話記録の内容と無関係な単語を絶対に出力しないこと。説明文や\`\`\`jsonマーカーは絶対に含めず、JSONオブジェクトのみを出力すること。

      【出力JSONフォーマット】
      {
        "rootTopic": "中心テーマの要約",
        "categories": [
          {
            "name": "事実・トピックのカテゴリ1",
            "children": [{ "name": "詳細A" }]
          }
        ],
        "emotions": ["やりがい", "楽しさ"],
        "actions": ["解決する", "作る"]
      }

      ---
      【会話記録】
      ${editableTranscript}`;

      const { text: responseText, modelName, apiVersion } = await callGeminiProxy(prompt, {
        modelOverride: MODEL_OVERRIDE ?? null,
      });
      if (console && typeof console.info === 'function') {
        console.info(`[Gemini] Mindmap generated via proxy using model=${modelName} (apiVersion=${apiVersion})`);
      }
      
      let chartData;
      try {
        const jsonMatch = responseText.match(/{[\s\S]*}/);
        if (!jsonMatch) throw new Error("AIの応答に有効なJSONが含まれていません。");
        chartData = JSON.parse(jsonMatch[0]);
      } catch (e) { console.error("AIが生成したJSONの解析に失敗しました:", responseText, e); throw new Error("AIが不正な形式のデータを返しました。"); }

      const sanitize = (text: string): string => {
        if (typeof text !== 'string') return '';
        return text.replace(/"/g, '#quot;').replace(/(\r\n|\n|\r)/gm, ' ').replace(/・/g, '/');
      };

      const mermaidLines: string[] = ['graph LR'];
      let nodeCounter = 0;
      let factRootId: string | null = null;
      const topContainerId = `topContainer${nodeCounter++}`;
      
      mermaidLines.push(`    subgraph ${topContainerId}`);

      if (chartData.emotions && Array.isArray(chartData.emotions) && chartData.emotions.length > 0) {
        const emotionRootId = `N${nodeCounter++}`;
        mermaidLines.push(`        subgraph 感情や価値観の発見`);
        mermaidLines.push(`            direction LR`);
        mermaidLines.push(`            ${emotionRootId}(["${sanitize("大切にしていること")}"])`);
        chartData.emotions.forEach((emotionKeyword: string, emoIndex: number) => {
          const emoId = `N${nodeCounter++}`;
          mermaidLines.push(`            ${emoId}(["${sanitize(emotionKeyword)}"])`);
          mermaidLines.push(`            ${emotionRootId} --- ${emoId}`);
          mermaidLines.push(`            class ${emoId} category${(emoIndex % 4) + 1}Style`);
        });
        mermaidLines.push(`            class ${emotionRootId} emotionRootStyle`);
        mermaidLines.push('        end');
      }

      if (chartData.actions && Array.isArray(chartData.actions) && chartData.actions.length > 0) {
        const actionRootId = `N${nodeCounter++}`;
        mermaidLines.push(`        subgraph 得意な行動や元気の源`);
        mermaidLines.push(`            direction LR`);
        mermaidLines.push(`            ${actionRootId}(["${sanitize("行動のキーワード")}"])`);
        chartData.actions.forEach((actionKeyword: string, actIndex: number) => {
          const actId = `N${nodeCounter++}`;
          mermaidLines.push(`            ${actId}(["${sanitize(actionKeyword)}"])`);
          mermaidLines.push(`            ${actionRootId} --- ${actId}`);
          mermaidLines.push(`            class ${actId} category${(actIndex % 4) + 1}Style`);
        });
        mermaidLines.push(`            class ${actionRootId} actionRootStyle`);
        mermaidLines.push('        end');
      }
      
      mermaidLines.push(`    end`);

      if (chartData.rootTopic && chartData.categories && Array.isArray(chartData.categories) && chartData.categories.length > 0) {
        factRootId = `N${nodeCounter++}`;
        mermaidLines.push(`    subgraph 事実の整理`);
        mermaidLines.push(`        direction LR`);
        mermaidLines.push(`        ${factRootId}(["${sanitize(chartData.rootTopic)}"])`);
        chartData.categories.forEach((category: any, catIndex: number) => {
          const catId = `N${nodeCounter++}`;
          mermaidLines.push(`        ${catId}(["${sanitize(category.name)}"])`);
          mermaidLines.push(`        ${factRootId} --- ${catId}`);
          const buildChildren = (children: any[], parentId: string) => {
            if (children && Array.isArray(children)) {
              children.forEach((child: any) => {
                if (!child.name || child.name.trim() === '') {
                  return; 
                }
                const childId = `N${nodeCounter++}`;
                mermaidLines.push(`        ${childId}(["${sanitize(child.name)}"])`);
                mermaidLines.push(`        ${parentId} --- ${childId}`);
                if (child.children && child.children.length > 0) buildChildren(child.children, childId);
              });
            }
          };
          buildChildren(category.children, catId);
          mermaidLines.push(`        class ${catId} category${(catIndex % 4) + 1}Style`);
        });
        mermaidLines.push(`        class ${factRootId} rootStyle`);
        mermaidLines.push('    end');
      }
      
      const styleDefinition = `
        linkStyle default stroke:#d1d5db,stroke-width:1.5px
        classDef rootStyle fill:#60a5fa,color:#1e3a8a,stroke:#3b82f6,stroke-width:1.5px,font-weight:bold,font-family:system-ui
        classDef emotionRootStyle fill:#f472b6,color:#831843,stroke:#ec4899,stroke-width:1.5px,font-weight:bold,font-family:system-ui
        classDef actionRootStyle fill:#4ade80,color:#14532d,stroke:#22c55e,stroke-width:1.5px,font-weight:bold,font-family:system-ui
        classDef category1Style fill:#e9d5ff,color:#581c87,stroke:#c084fc,stroke-width:1.5px,font-weight:bold,font-family:system-ui
        classDef category2Style fill:#dbeafe,color:#1e40af,stroke:#93c5fd,stroke-width:1.5px,font-weight:bold,font-family:system-ui
        classDef category3Style fill:#dcfce7,color:#166534,stroke:#86efac,stroke-width:1.5px,font-weight:bold,font-family:system-ui
        classDef category4Style fill:#fef3c7,color:#92400e,stroke:#fcd34d,stroke-width:1.5px,font-weight:bold,font-family:system-ui
        classDef invisibleStyle stroke-width:0px,fill:transparent,stroke:transparent
      `;
      mermaidLines.push(styleDefinition);

      const newMindmapText = mermaidLines.join('\n');
      setMindmapText(newMindmapText);
      onMindmapUpdate(newMindmapText);
      lastProcessedTranscriptRef.current = editableTranscript.trim();
      setErrorMessage(null);

    } catch (error) {
      console.error('マインドマップの生成中にエラーが発生しました:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'AI request failed. Please try again later.';
      setErrorMessage(message);
    } 
    finally {
      if (source === 'manual') setIsGeneratingMap(false);
      else setIsAutoUpdating(false);
    }
  };

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (editableTranscript.trim().length > 10) {
      debounceTimeoutRef.current = window.setTimeout(() => { handleGenerateMindmap('auto'); }, 3000);
    }
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [editableTranscript]);

  return (
    <>
      <Section
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>自動マインドマップ</span>
            {isAutoUpdating && <Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} />}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        }
        icon={<GitBranch color="#8b5cf6" />}
      >
        <div style={{ position: 'relative' }}>
          <MindmapDisplay chart={mindmapText} />
          {mindmapText && (
            <button
              onClick={() => setMindmapModalOpen(true)}
              style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #e5e7eb', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="拡大表示"
            >
              <Expand size={16} />
            </button>
          )}
        </div>
      </Section>
      <MindmapModal isOpen={isMindmapModalOpen} onClose={() => setMindmapModalOpen(false)} chart={mindmapText} />
      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <button 
          onClick={() => handleGenerateMindmap('manual')} 
          disabled={isListening || isGeneratingMap || isAutoUpdating || editableTranscript.trim() === ''}
          style={{ padding: '0.5rem 1rem', background: (isListening || isGeneratingMap || isAutoUpdating || editableTranscript.trim() === '') ? '#d1d5db' : '#8b5cf6', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <GitBranch size={18} />
          {isGeneratingMap ? '手動で生成中...' : 'マインドマップ更新'}
        </button>
      </div>
      {errorMessage && (
        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.75rem' }}>{errorMessage}</p>
      )}
    </>
  );
}
