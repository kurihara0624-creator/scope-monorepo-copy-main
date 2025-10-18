// === この下の【全機能統合・最終完成版】コードを OneOnOnePage.tsx にまるごと貼り付け ===
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '@myorg/shared/hooks/useAuth';
import { oneOnOnesCollection, addDoc, doc, setDoc, onSnapshot, Timestamp } from '@myorg/shared/api/firebase';
import type { Item, OneOnOneStatus } from '@myorg/shared/types';
import { Sparkles, ListChecks, MessageSquare, Check, Save, Mic, BrainCircuit } from 'lucide-react';
import { Section } from '@myorg/shared/components/Section';
import ThemeGachaModal from '@myorg/shared/components/ThemeGachaModal';
import CunningPaperModal from '@myorg/shared/components/CunningPaperModal';
import { MindmapSection } from '@myorg/shared/components/MindmapSection';
import StopConfirmationModal from '@myorg/shared/components/StopConfirmationModal';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { callGeminiProxy } from '@myorg/shared/utils/geminiProxy';


export default function OneOnOnePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: oneOnOneId } = useParams();
  const [searchParams] = useSearchParams();
  const isNewMode = !oneOnOneId;

  const [status, setStatus] = useState<OneOnOneStatus>('active');
  const [isSessionLoading, setIsSessionLoading] = useState(!isNewMode);
  const [memberName, setMemberName] = useState('');
  const [mood, setMood] = useState(75);
  const [focus, setFocus] = useState(80);
  const [agendaItems, setAgendaItems] = useState<Item[]>([]);
  const [newAgendaInput, setNewAgendaInput] = useState('');
  const [reflection, setReflection] = useState('');
  const [positiveMemo, setPositiveMemo] = useState('');
  const [isGachaOpen, setGachaOpen] = useState(false);
  const [isCunningPaperOpen, setCunningPaperOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [editablePoints, setEditablePoints] = useState('');
  const [editableNextActions, setEditableNextActions] = useState('');
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [isStopConfirmationModalOpen, setStopConfirmationModalOpen] = useState(false);
  const inactivityStopTimerRef = useRef<number | null>(null);
  
  const [mindmapText, setMindmapText] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const SUMMARY_MODEL_OVERRIDE = 'models/gemini-2.5-flash,models/gemini-1.5-flash';

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  
  useEffect(() => { setEditableTranscript(transcript); }, [transcript]);

  useEffect(() => {
    if (inactivityStopTimerRef.current) clearTimeout(inactivityStopTimerRef.current);
    if (listening) {
      inactivityStopTimerRef.current = window.setTimeout(() => {
        setStopConfirmationModalOpen(true);
      }, 180000);
    } else {
      setStopConfirmationModalOpen(false);
    }
    return () => { if (inactivityStopTimerRef.current) clearTimeout(inactivityStopTimerRef.current); };
  }, [transcript, listening]);

  useEffect(() => {
    if (!user) return;
    if (oneOnOneId) {
      // 既存セッションの読み込み
      const oneOnOneDocRef = doc(oneOnOnesCollection, oneOnOneId);
      const unsubscribe = onSnapshot(
        oneOnOneDocRef,
        (docSnapshot) => {
          if (!docSnapshot.exists()) {
            console.error("指定された1on1が見つかりません。");
            setIsSessionLoading(false);
            navigate("/");
            return;
          }

          const data = docSnapshot.data();
          setMemberName(typeof data.memberName === "string" ? data.memberName : "");
          const derivedStatus: OneOnOneStatus = data.status === "completed" ? "completed" : "active";
          setStatus(derivedStatus);
          setMindmapText(typeof data.mindmapText === "string" ? data.mindmapText : "");
          setEditableTranscript(typeof data.transcript === "string" ? data.transcript : "");
          setAgendaItems(Array.isArray(data.agenda) ? (data.agenda as Item[]) : []);
          setReflection(typeof data.reflection === "string" ? data.reflection : "");
          setPositiveMemo(typeof data.positiveMemo === "string" ? data.positiveMemo : "");
          setEditablePoints(typeof data.summaryPoints === "string" ? data.summaryPoints : "");
          setEditableNextActions(typeof data.summaryNextActions === "string" ? data.summaryNextActions : "");
          const hasSummaryContent =
            (typeof data.summaryPoints === "string" && data.summaryPoints.trim().length > 0) ||
            (typeof data.summaryNextActions === "string" && data.summaryNextActions.trim().length > 0);
          setIsSummaryVisible(hasSummaryContent);
          setIsSessionLoading(false);
        },
        (error) => {
          console.error("1on1セッションの取得に失敗しました。", error);
          setIsSessionLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      // 新規セッションの作成
      const memberId = searchParams.get('memberId');
      const memberDisplayName = searchParams.get('memberName');
      if (memberId && memberDisplayName) {
        setMemberName(memberDisplayName);
        const createActiveOneOnOne = async () => {
          const createdAt = Timestamp.now();
          const oneOnOneData = {
            managerId: user.uid,
            managerName: user.displayName || "Anonymous",
            managerPhotoURL: user.photoURL || "",
            memberId,
            memberName: memberDisplayName,
            createdAt,
            status: "active",
            checkin: { mood: 75, focus: 80 },
            agenda: [] as Item[],
            transcript: "",
            transcripts: [] as unknown[],
            summaryPoints: "",
            summaryNextActions: "",
            reflection: "",
            positiveMemo: "",
            mindmapText: "",
            mindmap: { nodes: [] as unknown[], links: [] as unknown[] },
            sessionId: "",
          };
          try {
            const newDocRef = await addDoc(oneOnOnesCollection, oneOnOneData);
            await setDoc(newDocRef, { sessionId: newDocRef.id }, { merge: true });
            navigate(`/1on1/${newDocRef.id}`, { replace: true });
          } catch (error) {
            console.error('Failed to create 1on1 session', error);
            navigate('/');
          }
        };
        createActiveOneOnOne();
      }
    }
  }, [user, oneOnOneId, navigate, searchParams]);

  const isSpeechSupported = browserSupportsSpeechRecognition;

  const addAgendaItem = (text: string) => { if (text.trim() === '') return; setAgendaItems([...agendaItems, { id: Date.now().toString(), text, completed: false }]); setNewAgendaInput(''); };
  const handleGachaSelect = (theme: string) => { addAgendaItem(theme); setGachaOpen(false); };
  const handleConfirmStop = () => { SpeechRecognition.stopListening(); setStopConfirmationModalOpen(false); };

  const handleAiSummary = async () => {
    if (status !== "active") return;
    if (editableTranscript.trim() === '') { alert('文字起こしされたテキストがありません。'); return; }
    if (isSummarizing) return;
    setIsSummarizing(true);
    setIsSummaryVisible(false);
    setEditablePoints('');
    setEditableNextActions('');
    try {
      const promptLines = [
        'Summarize the following 1-on-1 conversation for the manager.',
        'Respond using the exact section headings [Key Takeaways] and [Next Actions].',
        '[Key Takeaways]',
        '- Provide concise bullet points capturing the most important outcomes or insights.',
        '[Next Actions]',
        '- List clear, actionable next steps with owners when possible.',
        '',
        'Transcript:',
        editableTranscript.trim(),
      ];
      const { text } = await callGeminiProxy(promptLines.join('\n'), { modelOverride: SUMMARY_MODEL_OVERRIDE });
      const pointsMatch = text.match(/\[Key Takeaways\]\s*([\s\S]*?)(?:\n\[[^\]]+\]|\s*$)/);
      const nextActionsMatch = text.match(/\[Next Actions\]\s*([\s\S]*?)(?:\n\[[^\]]+\]|\s*$)/);
      setEditablePoints(pointsMatch ? pointsMatch[1].trim() : 'No [Key Takeaways] section found.');
      setEditableNextActions(nextActionsMatch ? nextActionsMatch[1].trim() : 'No [Next Actions] section found.');
      setIsSummaryVisible(true);
    } catch (error) {
      console.error('AI summary failed:', error);
      const message = error instanceof Error && error.message ? error.message : 'AI summary encountered an error.';
      alert(message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCompleteOneOnOne = async () => {
    if (status !== "active") {
      return;
    }
    if (!oneOnOneId) { alert('セッションIDがありません。'); return; }
    if (agendaItems.length === 0 && reflection.trim() === '' && editablePoints.trim() === '') { alert('アジェンダ、リフレクション、またはAI要約のいずれかを入力してください。'); return; }
    setIsSaving(true);
    const oneOnOneDataToUpdate = {
      status: 'completed',
      checkin: { mood, focus },
      agenda: agendaItems,
      transcript: editableTranscript,
      summaryPoints: editablePoints,
      summaryNextActions: editableNextActions,
      reflection: reflection,
      positiveMemo: positiveMemo,
      mindmapText: mindmapText,
    };
    try {
      const oneOnOneDocRef = doc(oneOnOnesCollection, oneOnOneId);
      await setDoc(oneOnOneDocRef, oneOnOneDataToUpdate, { merge: true });
      alert(`${memberName}さんとの1on1を保存しました！`);
      navigate('/');
    } catch (error) { console.error("データの更新に失敗しました:", error); alert('エラーが発生しました。'); }
    finally { setIsSaving(false); }
  };

  if (isSessionLoading) {
    return <div>1on1セッションを読み込んでいます...</div>;
  }

  const isEditable = status === "active";

  return (
    <div>
      <StopConfirmationModal isOpen={isStopConfirmationModalOpen} onConfirm={handleConfirmStop} onClose={() => setStopConfirmationModalOpen(false)} />
      <ThemeGachaModal isOpen={isGachaOpen} onClose={() => setGachaOpen(false)} onSelect={handleGachaSelect} />
      <CunningPaperModal isOpen={isCunningPaperOpen} onClose={() => setCunningPaperOpen(false)} />

      {!isEditable && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            color: '#1d4ed8',
          }}
        >
          この1on1は完了済みです。記録は閲覧のみ可能です。
        </div>
            )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
        <div><h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{memberName || '新しい1on1'} さんとの1on1</h1></div>
        {isEditable && <button onClick={() => setGachaOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#facc15', color: '#422006', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
          <Sparkles size={20} /> テーマガチャ
        </button>}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* 左カラム */}
        <div>
          <Section title="チェックイン & 文字起こし操作" icon={<Check color="#22c55e" />}>
            <div><label>今の気分 ({mood})</label><input type="range" min="0" max="100" value={mood} onChange={(e) => setMood(Number(e.target.value))} disabled={!isEditable} style={{width:'100%'}} /></div>
            <div><label>集中度 ({focus})</label><input type="range" min="0" max="100" value={focus} onChange={(e) => setFocus(Number(e.target.value))} disabled={!isEditable} style={{width:'100%'}}/></div>
            {isEditable && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>リアルタイム文字起こし</h4>
                {isSpeechSupported ? (
                  <>
                    <p>マイクの状態: {listening ? '聞き取り中...' : '停止中'}</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => SpeechRecognition.startListening({ continuous: true, language: 'ja-JP' })}>開始</button>
                      <button onClick={SpeechRecognition.stopListening}>停止</button>
                      <button onClick={() => resetTranscript()}>リセット</button>
                    </div>
                  </>
                ) : (
                  <p>このブラウザは音声認識に対応していません。</p>
                )}
              </div>
            )}
          </Section>

          <Section title="会話のライブ記録" icon={<Mic />}>
            <textarea
              value={editableTranscript}
              onChange={(e) => setEditableTranscript(e.target.value)}
              disabled={!isEditable}
              placeholder={isEditable ? "「開始」ボタンを押して会話を始めるか、ここに直接テキストを入力できます。" : "記録はありません。"}
              style={{ minHeight: '150px', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', background: '#f9fafb', color: '#374151', whiteSpace: 'pre-wrap', overflowY: 'auto', width: '100%', fontFamily: 'inherit', fontSize: 'inherit', resize: 'vertical' }}
            />
            {isEditable && <div style={{ marginTop: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={handleAiSummary} disabled={isSummarizing || editableTranscript.trim() === ''} style={{ padding: '0.5rem 1rem', background: (isSummarizing || editableTranscript.trim() === '') ? '#d1d5db' : '#4f46e5', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <BrainCircuit size={18} /> {isSummarizing ? 'AIが要約中...' : 'AIで要約'}
              </button>
            </div>}
          </Section>
          
          {isEditable && (
            <MindmapSection 
              editableTranscript={editableTranscript} 
              isListening={listening}
              initialMindmapText={mindmapText}
              onMindmapUpdate={setMindmapText}
            />
          )}
        </div>
        
        {/* 右カラム */}
        <div>
          {isSummaryVisible && (
            <>
              <Section title="AI要約：重要なポイント" icon={<BrainCircuit color="#8b5cf6" />}>
                <textarea value={editablePoints} onChange={(e) => setEditablePoints(e.target.value)} disabled={!isEditable} style={{ whiteSpace: 'pre-wrap', background: isEditable ? '#f5f3ff' : '#f9fafb', padding: '1rem', borderRadius: '0.25rem', minHeight: '120px', width: '100%', border: '1px solid #ddd' }} />
              </Section>
              <Section title="AI要約：ネクストアクション" icon={<BrainCircuit color="#16a34a" />}>
                <textarea value={editableNextActions} onChange={(e) => setEditableNextActions(e.target.value)} disabled={!isEditable} style={{ whiteSpace: 'pre-wrap', background: isEditable ? '#f5f3ff' : '#f9fafb', padding: '1rem', borderRadius: '0.25rem', minHeight: '80px', width: '100%', border: '1px solid #ddd' }} />
              </Section>
            </>
          )}

          <Section title="協働アジェンダ" icon={<ListChecks color="#3b82f6" />} onHelpClick={() => setCunningPaperOpen(true)}>
            {agendaItems.map((item, index) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={item.completed} onChange={() => { if (!isEditable) return; const newItems = [...agendaItems]; newItems[index].completed = !newItems[index].completed; setAgendaItems(newItems); }} disabled={!isEditable} />
                <span>{item.text}</span>
              </div>
            ))}
            {isEditable && <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input type="text" value={newAgendaInput} onChange={(e) => setNewAgendaInput(e.target.value)} placeholder="新しいアジェンダ..." style={{flexGrow:1, padding:'0.5rem', border:'1px solid #d1d5db', borderRadius:'0.25rem'}} />
              <button onClick={() => addAgendaItem(newAgendaInput)} style={{padding:'0.5rem 1rem', background:'#2563eb', color:'white', borderRadius:'0.25rem', border:'none', cursor:'pointer'}}>追加</button>
            </div>}
          </Section>

          <Section title="ひとことリフレクション（補足メモ）" icon={<MessageSquare color="#8b5cf6" />} onHelpClick={() => setCunningPaperOpen(true)}>
            <textarea placeholder={isEditable ? "AIの要約には残らない..." : ""} value={reflection} onChange={(e) => setReflection(e.target.value)} disabled={!isEditable} style={{width:'100%', minHeight:'80px', padding:'0.5rem', border:'1px solid #d1d5db', borderRadius:'0.25rem'}} />
            <textarea placeholder={isEditable ? "相手へのポジティブメモ" : ""} value={positiveMemo} onChange={(e) => setPositiveMemo(e.target.value)} disabled={!isEditable} style={{width:'100%', minHeight:'80px', padding:'0.5rem', border:'1px solid #d1d5db', borderRadius:'0.25rem' }} />
          </Section>
        </div>
      </div>

      {isEditable && <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <button onClick={handleCompleteOneOnOne} disabled={isSaving} style={{ padding: '0.75rem 1.5rem', background: isSaving ? '#9ca3af' : '#16a34a', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Save size={20} />
          {isSaving ? '保存中...' : 'この1on1を完了して保存'}
        </button>
      </div>}
    </div>
  );
}
