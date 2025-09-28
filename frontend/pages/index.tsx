import { useState, useEffect } from "react";
import DiffMatchPatch from "diff-match-patch";

interface ProviderInfo {
  id: string;
  name: string;
  description?: string;
  speed?: string;
  cost?: string;
}

type ThemeMode = "light" | "dark" | "auto";
interface ResultHistory {
  id: string;
  timestamp: string;
  result: any;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [displayedResult, setDisplayedResult] = useState<any>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState("mock");
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");
  const [fadeKey, setFadeKey] = useState(0);
  const [history, setHistory] = useState<ResultHistory[]>([]);
  const [compareModal, setCompareModal] = useState(false);
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [compareMode, setCompareMode] = useState<"side" | "diff">("side");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch(`${API_URL}/models`);
        const data = await res.json();
        setProviders(data.available_models || []);
        if (data.current) setProvider(data.current);
      } catch (e) {
        console.error("โหลดรายชื่อโมเดลล้มเหลว", e);
      }
    };
    loadModels();
  }, [API_URL]);

  const isDarkMode = () => {
    if (themeMode === "dark") return true;
    if (themeMode === "light") return false;
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
  };
  const darkMode = isDarkMode();

  useEffect(() => { setFadeKey((k) => k + 1); }, [themeMode]);

  const typeOut = (text: string, setter: (val: string) => void, speed = 15) => {
    setter("");
    let i = 0;
    const interval = setInterval(() => {
      setter((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
  };

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    setDisplayedResult(null);
    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, provider }),
      });
      const data = await res.json();
      setResult(data);
      const id = Date.now().toString();
      setHistory((prev) => [...prev, { id, timestamp: new Date().toLocaleString(), result: data }]);

      const fields = ["plan","research","analysis","critique","final"];
      const temp: any = {};
      fields.forEach((field) => (temp[field] = ""));
      setDisplayedResult(temp);
      fields.forEach((field, index) => {
        setTimeout(() => typeOut(data[field], (val) => setDisplayedResult((prev: any) => ({ ...prev, [field]: val }))), 200 * index);
      });
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเรียก API");
    } finally {
      setLoading(false);
    }
  };

  const getThemeColor = (id: string) => {
    switch (id) {
      case "openai": return darkMode ? "border-blue-400 bg-blue-900 text-blue-100" : "border-blue-500 bg-blue-50 text-blue-800";
      case "gemini": return darkMode ? "border-green-400 bg-green-900 text-green-100" : "border-green-500 bg-green-50 text-green-800";
      case "claude": return darkMode ? "border-purple-400 bg-purple-900 text-purple-100" : "border-purple-500 bg-purple-50 text-purple-800";
      default: return darkMode ? "border-gray-500 bg-gray-800 text-gray-100" : "border-gray-400 bg-gray-50 text-gray-800";
    }
  };

  const diffText = (text1: string, text2: string) => {
    const dmp = new DiffMatchPatch();
    const diff = dmp.diff_main(text1, text2);
    dmp.diff_cleanupSemantic(diff);
    return diff.map(([op, text], i) => {
      if (op === 1) return <span key={i} className="bg-green-300 dark:bg-green-700">{text}</span>;
      if (op === -1) return <span key={i} className="bg-red-300 dark:bg-red-700 line-through">{text}</span>;
      return <span key={i}>{text}</span>;
    });
  };

  return (
    <div key={fadeKey} className={`${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"} min-h-screen flex flex-col items-center py-10 px-4 transition-all duration-700 ease-in-out`}>
      <div className="flex justify-between items-center w-full max-w-4xl mb-6">
        <h1 className="text-3xl font-bold">🧠 Multi-Agent AI Brainstorming</h1>
        <select value={themeMode} onChange={(e) => setThemeMode(e.target.value as ThemeMode)} className="px-4 py-2 rounded-lg border shadow-sm bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-500">
          <option value="light">☀️ Light Mode</option>
          <option value="dark">🌙 Dark Mode</option>
          <option value="auto">🌓 Auto (ตามเวลา)</option>
        </select>
      </div>

      <div className="w-full max-w-2xl space-y-3 transition-all duration-700 ease-in-out">
        <textarea className="w-full p-4 border rounded-lg shadow-sm focus:ring focus:ring-blue-300 dark:bg-gray-800 dark:text-gray-100 transition-all duration-700" rows={4} placeholder="พิมพ์คำถามของคุณที่นี่..." value={question} onChange={(e) => setQuestion(e.target.value)} />
        <select className="w-full p-3 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:text-gray-100 transition-all duration-700" value={provider} onChange={(e) => setProvider(e.target.value)}>
          {providers.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
        <div className="flex gap-3">
          <button onClick={askAI} disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all duration-500">
            {loading ? "กำลังคิด..." : "🚀 ส่งให้ AI ระดมสมอง"}
          </button>
          {displayedResult && (
            <button onClick={askAI} className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition">🔄 Generate อีกครั้ง</button>
          )}
          {history.length >= 2 && (
            <button onClick={() => setCompareModal(true)} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">📊 เปรียบเทียบผลลัพธ์</button>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-10 w-full max-w-3xl animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded-lg" />))}
        </div>
      )}

      {displayedResult && (
        <div className="mt-10 w-full max-w-3xl space-y-6">
          <Section title="📑 แผนงาน (Planner)" content={displayedResult.plan} darkMode={darkMode} />
          <Section title="🔎 ข้อมูลค้นคว้า (Researcher)" content={displayedResult.research} darkMode={darkMode} />
          <Section title="📊 วิเคราะห์ (Analyst)" content={displayedResult.analysis} darkMode={darkMode} />
          <Section title="🧪 ตรวจสอบ (Critic)" content={displayedResult.critique} darkMode={darkMode} />
          <Section title="🧠 สรุปขั้นสุดท้าย (Synthesizer)" content={displayedResult.final} highlight darkMode={darkMode} />
        </div>
      )}

      {compareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-11/12 max-w-6xl p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
            <h2 className="text-2xl font-semibold mb-4">📊 เปรียบเทียบผลลัพธ์</h2>
            <div className="flex gap-4 mb-4">
              <select className="flex-1 p-2 border rounded" value={compareA} onChange={(e) => setCompareA(e.target.value)}>
                <option value="">เลือกรอบ A</option>
                {history.map((h) => <option key={h.id} value={h.id}>{h.timestamp}</option>)}
              </select>
              <select className="flex-1 p-2 border rounded" value={compareB} onChange={(e) => setCompareB(e.target.value)}>
                <option value="">เลือกรอบ B</option>
                {history.map((h) => <option key={h.id} value={h.id}>{h.timestamp}</option>)}
              </select>
            </div>
            <div className="flex justify-between mb-4">
              <button onClick={() => setCompareMode("side")} className={`px-4 py-2 rounded ${compareMode === "side" ? "bg-blue-600 text-white" : "bg-gray-300"}`}>📊 สองคอลัมน์</button>
              <button onClick={() => setCompareMode("diff")} className={`px-4 py-2 rounded ${compareMode === "diff" ? "bg-green-600 text-white" : "bg-gray-300"}`}>🪄 Diff Highlight</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {compareMode === "side" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <h3 className="font-bold mb-2">A</h3>
                    <pre className="whitespace-pre-wrap">{history.find(h => h.id === compareA)?.result.final || ""}</pre>
                  </div>
                  <div className="p-4 border rounded">
                    <h3 className="font-bold mb-2">B</h3>
                    <pre className="whitespace-pre-wrap">{history.find(h => h.id === compareB)?.result.final || ""}</pre>
                  </div>
                </div>
              )}
              {compareMode === "diff" && (
                <div className="p-4 border rounded">
                  <h3 className="font-bold mb-2">Diff Highlight</h3>
                  <div className="whitespace-pre-wrap">{
                    diffText(
                      history.find(h => h.id === compareA)?.result.final || "",
                      history.find(h => h.id === compareB)?.result.final || ""
                    )
                  }</div>
                </div>
              )}
            </div>
            <div className="text-right mt-4">
              <button onClick={() => setCompareModal(false)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded">ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, content, highlight = false, darkMode = false }: { title: string; content: string; highlight?: boolean; darkMode?: boolean }) {
  return (
    <div className={`p-5 rounded-lg shadow-md transition-all duration-700 ease-in-out ${highlight ? (darkMode ? "bg-blue-900 border-l-4 border-blue-400" : "bg-blue-50 border-l-4 border-blue-500") : (darkMode ? "bg-gray-800" : "bg-white")}`}>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <pre className={`whitespace-pre-wrap ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{content}</pre>
    </div>
  );
}
