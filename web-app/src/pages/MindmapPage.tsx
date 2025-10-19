import { FormEvent, useMemo, useState } from "react";
import { MindmapDisplay, callGeminiProxy } from "@myorg/shared";

const MODEL_OVERRIDE = import.meta.env.VITE_GEMINI_MODEL_OVERRIDE;

const buildPrompt = (transcript: string): string => `あなたは、論理的思考と深い共感力を備えたグラフィック・ファシリテーターです。
以下の【会話記録】を読み、指定した形式の JSON を厳格に出力してください。

【思考プロンプト】
1. 中核テーマの抽出:
   - 会話全体から、最も根幹となる「中核テーマ」を 1 件だけ見つけ、"rootTopic" に設定する。
2. 事実とトピックの整理:
   - 会話に登場する具体的な出来事や話題の塊を 2 件以上抽出し、各要素を "categories" 配列に格納する。
   - 必要に応じて階層を掘り下げ、最大 4 階層程度で子要素を追加する。
3. 感情・価値観キーワード:
   - 会話から感じ取れる主要な感情や価値観をキーワードとして 2 件以上抽出し、"emotions" 配列に格納する。
4. 得意な行動（動詞）:
   - 会話に表れる得意な行動やモチベーションを動詞で 2 件以上抽出し、"actions" 配列に格納する。
5. 厳守事項:
   - JSON 以外のテキスト（説明文やコードブロック）は一切含めない。
   - 値が存在しない場合でも配列などのキーは省略せず、空配列として出力する。

【出力フォーマット】
{
  "rootTopic": "中核テーマ",
  "categories": [
    {
      "name": "話題カテゴリ",
      "children": [{ "name": "詳細トピック" }]
    }
  ],
  "emotions": ["感情キーワード"],
  "actions": ["行動キーワード"]
}

---
【会話記録】
${transcript}`.trim();

interface MindmapSchemaCategory {
  name: string;
  children?: MindmapSchemaCategory[];
}

interface MindmapSchema {
  rootTopic: string;
  categories: MindmapSchemaCategory[];
  emotions: string[];
  actions: string[];
}

const extractJson = (responseText: string): MindmapSchema => {
  const jsonMatch = responseText.match(/{[\s\S]*}/);
  if (!jsonMatch) {
    throw new Error("AI が有効な JSON を返しませんでした。会話内容を見直して再度お試しください。");
  }

  const schema = JSON.parse(jsonMatch[0]) as Partial<MindmapSchema>;

  return {
    rootTopic: schema.rootTopic ?? "",
    categories: Array.isArray(schema.categories) ? schema.categories : [],
    emotions: Array.isArray(schema.emotions) ? schema.emotions : [],
    actions: Array.isArray(schema.actions) ? schema.actions : [],
  };
};

const sanitize = (value: string): string =>
  typeof value === "string"
    ? value.replace(/"/g, '\\"').replace(/(\r\n|\n|\r)/g, " ").trim()
    : "";

const buildMermaid = (schema: MindmapSchema): string => {
  const lines: string[] = ["graph LR"];
  let nodeCounter = 0;

  const nextId = () => `N${nodeCounter++}`;

  const topContainerId = `Top${nodeCounter++}`;
  lines.push(`    subgraph ${topContainerId}`);

  const attachKeywordCluster = (keywords: string[], title: string, rootLabel: string, className: string) => {
    if (!keywords.length) return;
    const rootId = nextId();
    lines.push(`        subgraph ${title}`);
    lines.push("            direction LR");
    lines.push(`            ${rootId}(["${sanitize(rootLabel)}"])`);
    keywords.forEach((keyword, index) => {
      if (!keyword?.trim()) return;
      const keywordId = nextId();
      lines.push(`            ${keywordId}(["${sanitize(keyword)}"])`);
      lines.push(`            ${rootId} --- ${keywordId}`);
      lines.push(`            class ${keywordId} category${(index % 4) + 1}Style`);
    });
    lines.push(`            class ${rootId} ${className}`);
    lines.push("        end");
  };

  attachKeywordCluster(schema.emotions, "感情・価値観の発見", "特に響いた感情", "emotionRootStyle");
  attachKeywordCluster(schema.actions, "得意な行動と原動力", "行動キーワード", "actionRootStyle");

  lines.push("    end");

  if (schema.rootTopic.trim() && schema.categories.length) {
    const factRootId = nextId();
    lines.push("    subgraph 事実とトピックの整理");
    lines.push("        direction LR");
    lines.push(`        ${factRootId}(["${sanitize(schema.rootTopic)}"])`);

    const traverse = (categories: MindmapSchemaCategory[], parentId: string) => {
      categories.forEach((category, index) => {
        if (!category.name?.trim()) return;
        const nodeId = nextId();
        lines.push(`        ${nodeId}(["${sanitize(category.name)}"])`);
        lines.push(`        ${parentId} --- ${nodeId}`);
        if (category.children?.length) {
          traverse(category.children, nodeId);
        }
        lines.push(`        class ${nodeId} category${(index % 4) + 1}Style`);
      });
    };

    traverse(schema.categories, factRootId);
    lines.push(`        class ${factRootId} rootStyle`);
    lines.push("    end");
  }

  lines.push(
    [
      "    %% Styling",
      "    linkStyle default stroke:#d1d5db,stroke-width:1.5px",
      "    classDef rootStyle fill:#60a5fa,color:#1e3a8a,stroke:#3b82f6,stroke-width:1.5px,font-weight:bold,font-family:system-ui",
      "    classDef emotionRootStyle fill:#f472b6,color:#831843,stroke:#ec4899,stroke-width:1.5px,font-weight:bold,font-family:system-ui",
      "    classDef actionRootStyle fill:#4ade80,color:#14532d,stroke:#22c55e,stroke-width:1.5px,font-weight:bold,font-family:system-ui",
      "    classDef category1Style fill:#e9d5ff,color:#581c87,stroke:#c084fc,stroke-width:1.5px,font-weight:bold,font-family:system-ui",
      "    classDef category2Style fill:#dbeafe,color:#1e40af,stroke:#93c5fd,stroke-width:1.5px,font-weight:bold,font-family:system-ui",
      "    classDef category3Style fill:#dcfce7,color:#166534,stroke:#86efac,stroke-width:1.5px,font-weight:bold,font-family:system-ui",
      "    classDef category4Style fill:#fef3c7,color:#92400e,stroke:#fcd34d,stroke-width:1.5px,font-weight:bold,font-family:system-ui",
      "    classDef invisibleStyle stroke-width:0px,fill:transparent,stroke:transparent",
    ].join("\n"),
  );

  return lines.join("\n");
};

export default function MindmapPage() {
  const [inputText, setInputText] = useState("");
  const [chart, setChart] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<{ modelName: string; apiVersion: string } | null>(null);

  const isSubmitDisabled = useMemo(() => isLoading || inputText.trim().length === 0, [isLoading, inputText]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const prompt = buildPrompt(inputText.trim());
      const { text, modelName, apiVersion } = await callGeminiProxy(prompt, {
        modelOverride: MODEL_OVERRIDE ?? null,
      });

      if (console && typeof console.info === "function") {
        console.info(`[Gemini] Mindmap generated via proxy using model=${modelName} (apiVersion=${apiVersion})`);
      }

      const schema = extractJson(text);
      const mermaid = buildMermaid(schema);
      setChart(mermaid);
      setModelInfo({ modelName, apiVersion });
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "マインドマップの生成に失敗しました。時間を置いて再度お試しください。";
      setError(message);
      setChart("");
      setModelInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <header className="mx-auto mb-10 max-w-3xl px-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Scope Mindmap</h1>
        <p className="mt-3 text-base text-slate-600 md:text-lg">
          テキストを貼り付けて「マインドマップを生成」を押すと、Gemini が内容を構造化し Mermaid 形式のマインドマップを描画します。
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-12">
        <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-400/20">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <label htmlFor="mindmap-input" className="flex flex-col gap-3">
              <span className="text-base font-semibold text-slate-900 md:text-lg">会話やメモを貼り付ける</span>
              <textarea
                id="mindmap-input"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="例: 直近の 1on1 で話した内容や、整理したいアイデアメモを書き出してください。"
                rows={10}
                className="min-h-[220px] resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 md:text-base"
              />
            </label>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500 md:text-base">
                送信されたテキストは Gemini に渡され、構造化されたマインドマップが生成されます。
              </p>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none md:text-base"
              >
                {isLoading ? "生成中..." : "マインドマップを生成"}
              </button>
            </div>
          </form>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-500 md:text-base">
              {error}
            </p>
          )}

          {modelInfo && (
            <p className="mt-4 text-xs text-slate-500 md:text-sm">
              使用モデル: {modelInfo.modelName}（API {modelInfo.apiVersion}）
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-400/20">
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">マインドマップ</h2>
          {isLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 md:text-base">
              <span>Gemini がマインドマップを生成しています...</span>
            </div>
          )}
          <div className="mt-4">
            <MindmapDisplay chart={chart} rerenderKey={chart.length} />
          </div>
        </section>
      </main>
    </div>
  );
}
