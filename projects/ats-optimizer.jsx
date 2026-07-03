import { useState, useRef, useCallback, useEffect } from "react";

// ─── Design tokens ─────────────────────────────────────────────────────────
// Deep navy #0B1628 | Electric teal #00C9A7 | Warm white #F8FAFC
// Slate #64748B | Gold #F59E0B | Card #1E2D42

const LANG = {
  en: {
    dir: "ltr",
    nav: { brand: "ResumeAI", upload: "Start Free", lang: "عربي" },
    hero: {
      badge: "AI-Powered ATS Optimization",
      h1a: "Land Interviews,",
      h1b: "Not the Trash Folder",
      sub: "Upload your resume and job description. Our AI analyzes, optimizes, and tailors everything — resume, cover letter, and interview prep — in seconds.",
      cta: "Upload Your Resume",
      sub2: "No signup. No credit card. Fully free.",
      stats: [
        { n: "94%", l: "ATS Pass Rate" },
        { n: "3x",  l: "More Interviews" },
        { n: "60s", l: "Average Time" },
      ],
    },
    how: {
      title: "How It Works",
      sub: "Four steps from upload to interview-ready",
      steps: [
        { icon: "📄", t: "Upload Resume",          d: "PDF or DOCX — drag and drop or click to browse" },
        { icon: "📋", t: "Add Job Description",    d: "Paste text or upload the JD file" },
        { icon: "🤖", t: "AI Analyzes & Optimizes",d: "Deep analysis: ATS score, keywords, gaps, rewrites" },
        { icon: "🚀", t: "Download & Apply",       d: "Get optimized resume, cover letter & interview prep" },
      ],
    },
    features: {
      title: "Everything You Need to Get Hired",
      items: [
        { icon: "🎯", t: "ATS Score Analysis",       d: "Real-time match scoring against job requirements with detailed breakdowns" },
        { icon: "✏️", t: "Resume Optimization",      d: "AI rewrites bullets and summaries using your real experience — never fabricated" },
        { icon: "📝", t: "Cover Letter Generator",   d: "Tailored professional cover letters matched to every job you apply for" },
        { icon: "🎤", t: "Interview Preparation",    d: "HR, behavioral, and technical Q&A based on the actual job description" },
        { icon: "🔍", t: "Keyword Gap Analysis",     d: "Identify missing keywords that ATS systems filter for" },
        { icon: "📥", t: "PDF & DOCX Export",        d: "Download in both formats, ready to submit immediately" },
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "Is my resume data private?",        a: "Your files are processed temporarily and deleted immediately after analysis. We never store your personal data." },
        { q: "Does the AI invent experience?",    a: "Never. Our AI only optimizes existing information. It improves wording, structure, and keyword alignment — it never fabricates jobs, degrees, or skills." },
        { q: "What file formats are supported?",  a: "We support PDF and DOCX for both resumes and job descriptions." },
        { q: "How long does the analysis take?",  a: "Typically 15–60 seconds depending on document length and server load." },
        { q: "Is it really free?",                a: "Yes. No signup, no credit card, no hidden fees. You only need a free Gemini API key from Google AI Studio." },
      ],
    },
    app: {
      title: "Optimize Your Resume",
      step1: "Upload Resume", step2: "Job Description", step3: "Analysis", step4: "Results",
      dragDrop: "Drag & drop your resume here", or: "or", browse: "Browse Files",
      supported: "Supports PDF and DOCX", next: "Continue", back: "Back",
      analyze: "Analyze Resume", analyzing: "Analyzing...",
      pasteJD: "Paste text", uploadJD: "Upload File",
      jdPlaceholder: "Paste the full job description here...",
      generating: "Generating...", genResume: "Generate Optimized Resume",
      genCover: "Generate Cover Letter", genInterview: "Generate Interview Prep",
      download: "Download", score: "ATS Match Score", missing: "Missing Keywords",
      skills: "Skills Match", exp: "Experience Match", edu: "Education Match", keywords: "Keywords Match",
      tabs: ["Optimized Resume", "Cover Letter", "Interview Prep"],
      copyBtn: "Copy", copied: "Copied!", restart: "Start Over",
      errorFile: "Please upload a PDF or DOCX file.",
      errorJD: "Please enter or upload a job description.",
      apiKeyLabel: "Gemini API Key",
      apiKeyPlaceholder: "Paste your Gemini API key (AIzaSy...)",
      apiKeySave: "Save Key",
      apiKeyEdit: "Change Key",
      apiKeyHint: "Get a free key at aistudio.google.com",
      apiKeyError: "Please enter your Gemini API key first.",
    },
  },
  ar: {
    dir: "rtl",
    nav: { brand: "ريزيوم AI", upload: "ابدأ مجاناً", lang: "English" },
    hero: {
      badge: "تحسين السيرة الذاتية بالذكاء الاصطناعي",
      h1a: "احصل على المقابلات،",
      h1b: "لا على سلة المهملات",
      sub: "ارفع سيرتك الذاتية وصف الوظيفة. يقوم الذكاء الاصطناعي بالتحليل والتحسين وإعداد كل شيء — سيرة ذاتية وخطاب تغطية وتحضير للمقابلة — في ثوانٍ.",
      cta: "ارفع سيرتك الذاتية",
      sub2: "بدون تسجيل. بدون بطاقة ائتمان. مجاني تماماً.",
      stats: [
        { n: "94%", l: "معدل اجتياز ATS" },
        { n: "3x",  l: "مزيد من المقابلات" },
        { n: "60ث", l: "متوسط الوقت" },
      ],
    },
    how: {
      title: "كيف يعمل",
      sub: "أربع خطوات من الرفع إلى الجاهزية للمقابلة",
      steps: [
        { icon: "📄", t: "ارفع السيرة الذاتية",          d: "PDF أو DOCX — اسحب وأفلت أو انقر للاستعراض" },
        { icon: "📋", t: "أضف وصف الوظيفة",              d: "الصق النص أو ارفع ملف JD" },
        { icon: "🤖", t: "الذكاء الاصطناعي يحلل ويحسّن", d: "تحليل عميق: درجة ATS، الكلمات المفتاحية، الثغرات" },
        { icon: "🚀", t: "حمّل وقدّم",                    d: "احصل على السيرة المحسّنة وخطاب التغطية وتحضير المقابلة" },
      ],
    },
    features: {
      title: "كل ما تحتاجه للحصول على وظيفة",
      items: [
        { icon: "🎯", t: "تحليل درجة ATS",               d: "تقييم فوري للمطابقة مع متطلبات الوظيفة مع تفاصيل شاملة" },
        { icon: "✏️", t: "تحسين السيرة الذاتية",          d: "الذكاء الاصطناعي يعيد كتابة النقاط والملخصات بناءً على خبرتك الحقيقية" },
        { icon: "📝", t: "مولّد خطاب التغطية",            d: "خطابات تغطية احترافية مخصصة لكل وظيفة تتقدم إليها" },
        { icon: "🎤", t: "تحضير المقابلة",                d: "أسئلة وأجوبة HR وسلوكية وتقنية بناءً على الوصف الوظيفي الفعلي" },
        { icon: "🔍", t: "تحليل الثغرات في الكلمات المفتاحية", d: "تحديد الكلمات المفتاحية المفقودة التي تفلترها أنظمة ATS" },
        { icon: "📥", t: "تصدير PDF و DOCX",              d: "حمّل بكلا الصيغتين، جاهز للتقديم فوراً" },
      ],
    },
    faq: {
      title: "الأسئلة الشائعة",
      items: [
        { q: "هل بياناتي في السيرة الذاتية خاصة؟",  a: "تتم معالجة ملفاتك مؤقتاً وحذفها فوراً بعد التحليل. لا نخزن بياناتك الشخصية أبداً." },
        { q: "هل يخترع الذكاء الاصطناعي خبرات؟",    a: "أبداً. يقوم الذكاء الاصطناعي فقط بتحسين المعلومات الموجودة ولا يختلق وظائف أو شهادات أو مهارات." },
        { q: "ما صيغ الملفات المدعومة؟",            a: "ندعم PDF وDOCX لكل من السير الذاتية وأوصاف الوظائف." },
        { q: "كم يستغرق التحليل؟",                  a: "عادةً 15–60 ثانية حسب طول المستند وحمل الخادم." },
        { q: "هل هو مجاني حقاً؟",                   a: "نعم. تحتاج فقط إلى مفتاح Gemini API مجاني من Google AI Studio." },
      ],
    },
    app: {
      title: "حسّن سيرتك الذاتية",
      step1: "ارفع السيرة", step2: "الوصف الوظيفي", step3: "التحليل", step4: "النتائج",
      dragDrop: "اسحب وأفلت سيرتك الذاتية هنا", or: "أو", browse: "استعراض الملفات",
      supported: "يدعم PDF وDOCX", next: "متابعة", back: "رجوع",
      analyze: "تحليل السيرة الذاتية", analyzing: "جاري التحليل...",
      pasteJD: "الصق النص", uploadJD: "ارفع ملف",
      jdPlaceholder: "الصق الوصف الوظيفي الكامل هنا...",
      generating: "جاري الإنشاء...", genResume: "إنشاء سيرة ذاتية محسّنة",
      genCover: "إنشاء خطاب التغطية", genInterview: "إنشاء تحضير المقابلة",
      download: "تحميل", score: "درجة مطابقة ATS", missing: "الكلمات المفتاحية المفقودة",
      skills: "مطابقة المهارات", exp: "مطابقة الخبرة", edu: "مطابقة التعليم", keywords: "مطابقة الكلمات المفتاحية",
      tabs: ["السيرة الذاتية المحسّنة", "خطاب التغطية", "تحضير المقابلة"],
      copyBtn: "نسخ", copied: "تم النسخ!", restart: "البدء من جديد",
      errorFile: "يرجى رفع ملف PDF أو DOCX.",
      errorJD: "يرجى إدخال أو رفع وصف الوظيفة.",
      apiKeyLabel: "مفتاح Gemini API",
      apiKeyPlaceholder: "الصق مفتاح Gemini API هنا (AIzaSy...)",
      apiKeySave: "حفظ المفتاح",
      apiKeyEdit: "تغيير المفتاح",
      apiKeyHint: "احصل على مفتاح مجاني من aistudio.google.com",
      apiKeyError: "يرجى إدخال مفتاح Gemini API أولاً.",
    },
  },
};

// ─── Gemini API call ────────────────────────────────────────────────────────
async function callGemini(apiKey, systemPrompt, userContent, maxTokens = 2000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
}

// ─── File reader ────────────────────────────────────────────────────────────
const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsText(file);
  });

// ─── Score Ring SVG ─────────────────────────────────────────────────────────
function ScoreRing({ score, size = 140 }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#00C9A7" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-label={`ATS score ${score}%`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2D42" strokeWidth={12} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={12}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.3s ease" }}
      />
      <text
        x={size/2} y={size/2 - 6}
        textAnchor="middle" dominantBaseline="middle"
        style={{
          transform: `rotate(90deg) translate(0, -${size}px)`,
          fill: color, fontSize: size * 0.21,
          fontWeight: 900, fontFamily: "Inter, system-ui",
        }}
      >{score}%</text>
      <text
        x={size/2} y={size/2 + 14}
        textAnchor="middle" dominantBaseline="middle"
        style={{
          transform: `rotate(90deg) translate(0, -${size}px)`,
          fill: "#64748B", fontSize: 10,
          fontFamily: "Inter, system-ui",
        }}
      >ATS Score</text>
    </svg>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ value, label }) {
  const color = value >= 75 ? "#00C9A7" : value >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13, color: "#94A3B8" }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ background: "#1E2D42", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1.3s ease" }} />
      </div>
    </div>
  );
}

// ─── API Key Banner ──────────────────────────────────────────────────────────
function ApiKeyBanner({ t, apiKey, onSave }) {
  const [editing, setEditing] = useState(!apiKey);
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");

  const save = () => {
    if (!val.trim().startsWith("AIza")) { setErr("Key must start with AIza..."); return; }
    setErr("");
    onSave(val.trim());
    setEditing(false);
    setVal("");
  };

  if (!editing && apiKey) {
    return (
      <div style={{ background: "rgba(0,201,167,0.07)", border: "1px solid rgba(0,201,167,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#94A3B8" }}>
          ✓ Gemini API key saved &nbsp;
          <span style={{ fontFamily: "monospace", color: "#00C9A7" }}>
            {apiKey.slice(0, 8)}••••••••
          </span>
        </span>
        <button
          onClick={() => setEditing(true)}
          style={{ background: "none", border: "1px solid #243347", color: "#64748B", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}
        >{t.app.apiKeyEdit}</button>
      </div>
    );
  }

  return (
    <div style={{ background: "#1E2D42", border: "1px solid #243347", borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 10 }}>
        🔑 <strong style={{ color: "#F8FAFC" }}>{t.app.apiKeyLabel}</strong>
        &nbsp;—&nbsp;
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
          style={{ color: "#00C9A7", fontSize: 12 }}>{t.app.apiKeyHint} →</a>
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder={t.app.apiKeyPlaceholder}
          style={{
            flex: 1, minWidth: 220,
            background: "#0B1628", border: "1.5px solid #243347",
            borderRadius: 8, color: "#F8FAFC", padding: "10px 14px",
            fontSize: 13, outline: "none", fontFamily: "monospace",
          }}
        />
        <button
          onClick={save}
          style={{ background: "linear-gradient(135deg,#00C9A7,#00A88B)", color: "#0B1628", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >{t.app.apiKeySave}</button>
      </div>
      {err && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{err}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [lang, setLang]   = useState("en");
  const t   = LANG[lang];
  const dir = t.dir;

  // API Key – persisted in localStorage
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("gemini_api_key") || ""; } catch { return ""; }
  });
  const saveApiKey = (key) => {
    setApiKey(key);
    try { localStorage.setItem("gemini_api_key", key); } catch {}
  };

  // View & wizard
  const [view,     setView]     = useState("landing");
  const [step,     setStep]     = useState(1);

  // Resume
  const [resumeFile,  setResumeFile]  = useState(null);
  const [resumeText,  setResumeText]  = useState("");
  const [resumeError, setResumeError] = useState("");
  const [dragging,    setDragging]    = useState(false);

  // JD
  const [jdMode,  setJdMode]  = useState("paste");
  const [jdText,  setJdText]  = useState("");
  const [jdFile,  setJdFile]  = useState(null);
  const [jdError, setJdError] = useState("");

  // Analysis
  const [analysis,   setAnalysis]   = useState(null);
  const [apiError,   setApiError]   = useState("");

  // Results
  const [activeTab,  setActiveTab]  = useState(0);
  const [generating, setGenerating] = useState({ resume: false, cover: false, interview: false });
  const [results,    setResults]    = useState({ resume: "", cover: "", interview: "" });
  const [copied,     setCopied]     = useState(false);
  const [openFaq,    setOpenFaq]    = useState(null);

  const resumeInputRef = useRef();
  const jdInputRef     = useRef();

  // ── File handling ────────────────────────────────────────────────────────
  const handleResumeFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext)) { setResumeError(t.app.errorFile); return; }
    setResumeError("");
    setResumeFile(file);
    try {
      const text = await readFileAsText(file);
      // Keep first 8000 chars; strip null bytes from binary bleed
      setResumeText(text.replace(/\0/g, " ").slice(0, 8000));
    } catch {
      setResumeText(`[File: ${file.name}]`);
    }
  }, [t]);

  const handleJdFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "doc", "txt"].includes(ext)) { setJdError(t.app.errorFile); return; }
    setJdError("");
    setJdFile(file);
    try {
      const text = await readFileAsText(file);
      setJdText(text.replace(/\0/g, " ").slice(0, 6000));
    } catch {
      setJdText(`[File: ${file.name}]`);
    }
  }, [t]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleResumeFile(e.dataTransfer.files[0]);
  }, [handleResumeFile]);

  // ── Step navigation ──────────────────────────────────────────────────────
  const goStep2 = () => {
    if (!resumeFile) { setResumeError(t.app.errorFile); return; }
    setStep(2);
  };

  const goStep3 = async () => {
    const jd = jdText.trim();
    if (!jd) { setJdError(t.app.errorJD); return; }
    if (!apiKey) { setApiError(t.app.apiKeyError); return; }
    setJdError(""); setApiError("");
    setStep(3); setAnalysis(null);

    try {
      const raw = await callGemini(
        apiKey,
        `You are an expert ATS analyst and resume consultant.
CRITICAL RULES:
- Never invent experience, education, certifications, projects, or achievements.
- Only analyze what is actually present in the resume.
- Return ONLY valid JSON, no markdown fences, no explanation.`,
        `Analyze this resume against the job description and return a JSON object with EXACTLY this structure (no extra keys, no markdown):
{
  "overallScore": <integer 0-100>,
  "skillsScore": <integer 0-100>,
  "experienceScore": <integer 0-100>,
  "educationScore": <integer 0-100>,
  "keywordsScore": <integer 0-100>,
  "missingKeywords": [<up to 12 strings>],
  "missingSkills": [<up to 8 strings>],
  "strengths": [<up to 4 strings>],
  "suggestions": [<up to 4 strings>],
  "summary": "<2-sentence analysis summary>"
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jd}`,
        1000
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed  = JSON.parse(cleaned);
      setAnalysis(parsed);
      setStep(4);
    } catch (err) {
      setApiError(`Analysis failed: ${err.message}`);
      setStep(2);
    }
  };

  // ── Generators ───────────────────────────────────────────────────────────
  const generateOptimizedResume = async () => {
    if (!apiKey) { setApiError(t.app.apiKeyError); return; }
    setGenerating((g) => ({ ...g, resume: true })); setActiveTab(0);
    try {
      const text = await callGemini(
        apiKey,
        `You are an expert resume writer and ATS optimization specialist.
CRITICAL RULES — NEVER BREAK:
- Never invent, add, or fabricate any experience, job, employer, date, education, certification, project, skill, or achievement.
- Only optimize what is genuinely present in the resume.
- Improve wording, action verbs, keyword alignment, and structure only.`,
        `Optimize the following resume for ATS systems targeting this job description.

Return an ATS-optimized resume in clean plain text.
Use ALL CAPS for section headings:
CONTACT INFORMATION
PROFESSIONAL SUMMARY
WORK EXPERIENCE
EDUCATION
SKILLS
CERTIFICATIONS (only if present in original)

Rules:
- No tables, no icons, no graphics, no text boxes
- Single column, ATS-safe formatting
- Strong action verbs for bullet points
- Naturally weave in keywords from the job description
- Improve impact and readability

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

After the resume, add this section:
SUGGESTIONS FOR STRENGTHENING THIS APPLICATION:
(List 2–3 skills or qualifications genuinely missing from the resume that this role requires, as honest advice only)`,
        2500
      );
      setResults((r) => ({ ...r, resume: text }));
    } catch (err) {
      setResults((r) => ({ ...r, resume: `Error: ${err.message}` }));
    }
    setGenerating((g) => ({ ...g, resume: false }));
  };

  const generateCoverLetter = async () => {
    if (!apiKey) { setApiError(t.app.apiKeyError); return; }
    setGenerating((g) => ({ ...g, cover: true })); setActiveTab(1);
    try {
      const text = await callGemini(
        apiKey,
        `You are an expert professional cover letter writer.
CRITICAL RULES:
- Only reference experience, skills, and achievements that are actually in the resume.
- Never invent any detail.
- Write in a confident, professional tone.`,
        `Write a tailored, professional cover letter based on the resume and job description below.

Structure:
- Opening paragraph: Genuine interest, specific role mention
- Body (2 paragraphs): Connect real resume experience to specific job requirements
- Closing: Clear call to action and professional sign-off

Keep under 400 words. Use [Hiring Manager Name] as the salutation placeholder.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`,
        1200
      );
      setResults((r) => ({ ...r, cover: text }));
    } catch (err) {
      setResults((r) => ({ ...r, cover: `Error: ${err.message}` }));
    }
    setGenerating((g) => ({ ...g, cover: false }));
  };

  const generateInterviewPrep = async () => {
    if (!apiKey) { setApiError(t.app.apiKeyError); return; }
    setGenerating((g) => ({ ...g, interview: true })); setActiveTab(2);
    try {
      const text = await callGemini(
        apiKey,
        `You are an expert interview coach with deep knowledge of HR, behavioral, and technical interviewing.
Base all suggested answers only on the real experience shown in the resume.`,
        `Generate comprehensive interview preparation based on this resume and job description.

Format exactly like this:

## HR / General Questions
Q: [question]
Suggested Answer: [concise answer using real resume experience]

## Behavioral Questions (STAR Method)
Q: [question]
Suggested Answer: [Situation / Task / Action / Result — using real resume experience]

## Technical / Role-Specific Questions
Q: [question]
Suggested Answer: [answer aligned with demonstrated skills in resume]

Generate 4 questions per section (12 total).

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`,
        2500
      );
      setResults((r) => ({ ...r, interview: text }));
    } catch (err) {
      setResults((r) => ({ ...r, interview: `Error: ${err.message}` }));
    }
    setGenerating((g) => ({ ...g, interview: false }));
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadTxt = (content, filename) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename; a.click();
  };

  const reset = () => {
    setStep(1); setResumeFile(null); setResumeText(""); setJdText(""); setJdFile(null);
    setAnalysis(null); setResults({ resume: "", cover: "", interview: "" });
    setApiError(""); setView("landing");
  };

  // Tab arrays
  const tabContents   = [results.resume, results.cover, results.interview];
  const tabGenerators = [generateOptimizedResume, generateCoverLetter, generateInterviewPrep];
  const tabLabels     = [t.app.genResume, t.app.genCover, t.app.genInterview];
  const tabFilenames  = ["optimized-resume.txt", "cover-letter.txt", "interview-prep.txt"];
  const isTabGenerating = [generating.resume, generating.cover, generating.interview];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div dir={dir} style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#0B1628", minHeight: "100vh", color: "#F8FAFC" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:#00C9A7;color:#0B1628;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-track{background:#0B1628;}
        ::-webkit-scrollbar-thumb{background:#1E2D42;border-radius:3px;}
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .btn-primary{background:linear-gradient(135deg,#00C9A7,#00A88B);color:#0B1628;border:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.3px;font-family:inherit;}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,201,167,.35);}
        .btn-secondary{background:transparent;color:#00C9A7;border:1.5px solid #00C9A7;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;}
        .btn-secondary:hover{background:rgba(0,201,167,.08);}
        .card{background:#1E2D42;border:1px solid #243347;border-radius:16px;}
        .tag{display:inline-block;background:rgba(0,201,167,.12);color:#00C9A7;border:1px solid rgba(0,201,167,.25);border-radius:99px;padding:4px 14px;font-size:12px;font-weight:600;letter-spacing:.5px;}
        .step-badge{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:rgba(0,201,167,.12);border:1.5px solid rgba(0,201,167,.3);color:#00C9A7;font-weight:700;font-size:14px;flex-shrink:0;}
        .step-badge.active{background:#00C9A7;color:#0B1628;border-color:#00C9A7;}
        .textarea{width:100%;background:#0B1628;border:1.5px solid #243347;border-radius:10px;color:#F8FAFC;padding:14px;font-size:14px;resize:vertical;outline:none;font-family:inherit;transition:border-color .2s;}
        .textarea:focus{border-color:#00C9A7;}
        .result-box{background:#0B1628;border:1px solid #243347;border-radius:12px;padding:20px;font-size:13.5px;line-height:1.8;color:#CBD5E1;white-space:pre-wrap;max-height:500px;overflow-y:auto;}
        .tab-btn{padding:10px 18px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;background:transparent;color:#64748B;font-family:inherit;}
        .tab-btn.active{background:#00C9A7;color:#0B1628;}
        .keyword-tag{display:inline-block;background:rgba(239,68,68,.1);color:#FCA5A5;border:1px solid rgba(239,68,68,.2);border-radius:6px;padding:3px 10px;font-size:12px;margin:3px;}
        .strength-tag{display:inline-block;background:rgba(0,201,167,.1);color:#00C9A7;border:1px solid rgba(0,201,167,.2);border-radius:6px;padding:3px 10px;font-size:12px;margin:3px;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        .fade-in{animation:fadeIn .4s ease;}
        .drop-zone{border:2px dashed #243347;border-radius:16px;padding:48px 24px;text-align:center;cursor:pointer;transition:all .2s;background:rgba(30,45,66,.4);}
        .drop-zone:hover,.drop-zone.dragging{border-color:#00C9A7;background:rgba(0,201,167,.05);}
        .feature-card{background:#1E2D42;border:1px solid #243347;border-radius:16px;padding:24px;transition:all .25s;}
        .feature-card:hover{border-color:rgba(0,201,167,.3);transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.25);}
        .faq-item{border-bottom:1px solid #243347;}
        .faq-item:last-child{border-bottom:none;}
        .nav-ghost{color:#94A3B8;font-size:14px;cursor:pointer;transition:color .2s;background:none;border:none;font-family:inherit;}
        .nav-ghost:hover{color:#F8FAFC;}
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{ position:"sticky",top:0,zIndex:100,background:"rgba(11,22,40,.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid #1E2D42" }}>
        <div style={{ maxWidth:1160,margin:"0 auto",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }} onClick={reset}>
            <div style={{ width:32,height:32,background:"linear-gradient(135deg,#00C9A7,#00A88B)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>✦</div>
            <span style={{ fontWeight:800,fontSize:18,letterSpacing:"-0.3px" }}>{t.nav.brand}</span>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:20 }}>
            <button className="nav-ghost" onClick={() => setLang(lang==="en"?"ar":"en")}>{t.nav.lang}</button>
            <button className="btn-primary" style={{ padding:"10px 20px",fontSize:13 }} onClick={() => { setView("app"); setStep(1); }}>
              {t.nav.upload}
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════ LANDING PAGE ════════════════════════════════════════ */}
      {view === "landing" && (
        <>
          {/* HERO */}
          <section style={{ padding:"96px 24px 80px",textAlign:"center",maxWidth:800,margin:"0 auto" }}>
            <div className="tag" style={{ marginBottom:24 }}>{t.hero.badge}</div>
            <h1 style={{ fontSize:"clamp(36px,6vw,68px)",fontWeight:900,lineHeight:1.08,letterSpacing:"-1.5px",marginBottom:24 }}>
              <span>{t.hero.h1a}</span><br />
              <span style={{ background:"linear-gradient(90deg,#00C9A7,#00E5C5)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>{t.hero.h1b}</span>
            </h1>
            <p style={{ fontSize:18,color:"#94A3B8",lineHeight:1.65,marginBottom:36,maxWidth:600,margin:"0 auto 36px" }}>{t.hero.sub}</p>
            <button className="btn-primary" style={{ fontSize:17,padding:"16px 36px",marginBottom:14 }} onClick={() => { setView("app"); setStep(1); }}>
              {t.hero.cta} →
            </button>
            <p style={{ fontSize:13,color:"#475569",marginTop:10 }}>{t.hero.sub2}</p>
            <div style={{ display:"flex",justifyContent:"center",gap:48,marginTop:56,flexWrap:"wrap" }}>
              {t.hero.stats.map((s) => (
                <div key={s.l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:36,fontWeight:900,color:"#00C9A7",letterSpacing:"-1px" }}>{s.n}</div>
                  <div style={{ fontSize:13,color:"#64748B",marginTop:4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section style={{ padding:"80px 24px",maxWidth:1000,margin:"0 auto" }}>
            <div style={{ textAlign:"center",marginBottom:48 }}>
              <div className="tag" style={{ marginBottom:12 }}>{t.how.title}</div>
              <p style={{ fontSize:13,color:"#64748B" }}>{t.how.sub}</p>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:20 }}>
              {t.how.steps.map((s, i) => (
                <div key={i} className="card" style={{ padding:28,position:"relative" }}>
                  <div style={{ fontSize:32,marginBottom:14 }}>{s.icon}</div>
                  <div style={{ position:"absolute",top:20,insetInlineEnd:20,fontSize:11,fontWeight:700,color:"#00C9A7",opacity:.4 }}>0{i+1}</div>
                  <div style={{ fontWeight:700,fontSize:15,marginBottom:6 }}>{s.t}</div>
                  <div style={{ fontSize:13,color:"#64748B",lineHeight:1.55 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </section>

          {/* FEATURES */}
          <section style={{ padding:"80px 24px",maxWidth:1100,margin:"0 auto" }}>
            <div style={{ textAlign:"center",marginBottom:48 }}>
              <h2 style={{ fontSize:"clamp(24px,4vw,40px)",fontWeight:800,letterSpacing:"-0.5px" }}>{t.features.title}</h2>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20 }}>
              {t.features.items.map((f, i) => (
                <div key={i} className="feature-card">
                  <div style={{ fontSize:28,marginBottom:14 }}>{f.icon}</div>
                  <div style={{ fontWeight:700,fontSize:16,marginBottom:8 }}>{f.t}</div>
                  <div style={{ fontSize:13,color:"#64748B",lineHeight:1.6 }}>{f.d}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA BAND */}
          <section style={{ padding:"80px 24px",textAlign:"center" }}>
            <div style={{ maxWidth:640,margin:"0 auto",background:"linear-gradient(135deg,rgba(0,201,167,.08),rgba(0,201,167,.02))",border:"1px solid rgba(0,201,167,.2)",borderRadius:24,padding:"56px 40px" }}>
              <h2 style={{ fontSize:"clamp(22px,4vw,36px)",fontWeight:800,letterSpacing:"-0.5px",marginBottom:16 }}>
                {lang==="en" ? "Ready to Beat the ATS?" : "مستعد للتغلب على نظام ATS؟"}
              </h2>
              <p style={{ color:"#64748B",fontSize:15,marginBottom:32 }}>
                {lang==="en" ? "Upload your resume now and get an optimized version in under a minute." : "ارفع سيرتك الذاتية الآن واحصل على نسخة محسّنة في أقل من دقيقة."}
              </p>
              <button className="btn-primary" style={{ fontSize:16,padding:"15px 32px" }} onClick={() => { setView("app"); setStep(1); }}>
                {t.hero.cta} →
              </button>
            </div>
          </section>

          {/* FAQ */}
          <section style={{ padding:"80px 24px",maxWidth:720,margin:"0 auto" }}>
            <div style={{ textAlign:"center",marginBottom:40 }}>
              <h2 style={{ fontSize:"clamp(22px,4vw,36px)",fontWeight:800,letterSpacing:"-0.5px" }}>{t.faq.title}</h2>
            </div>
            <div className="card" style={{ overflow:"hidden" }}>
              {t.faq.items.map((f, i) => (
                <div key={i} className="faq-item">
                  <button
                    onClick={() => setOpenFaq(openFaq===i ? null : i)}
                    style={{ width:"100%",background:"none",border:"none",padding:"20px 24px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",color:"#F8FAFC",textAlign:dir==="rtl"?"right":"left",fontFamily:"inherit" }}
                  >
                    <span style={{ fontWeight:600,fontSize:15 }}>{f.q}</span>
                    <span style={{ color:"#00C9A7",fontSize:18,flexShrink:0,marginInlineStart:16 }}>{openFaq===i?"−":"+"}</span>
                  </button>
                  {openFaq===i && (
                    <div style={{ padding:"0 24px 20px",fontSize:14,color:"#64748B",lineHeight:1.65 }}>{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <footer style={{ borderTop:"1px solid #1E2D42",padding:"32px 24px",textAlign:"center",color:"#475569",fontSize:13 }}>
            <div style={{ marginBottom:8,fontWeight:700,color:"#64748B" }}>
              <span style={{ color:"#00C9A7" }}>✦</span> {t.nav.brand}
            </div>
            {lang==="en"
              ? "© 2025 ResumeAI · Powered by Gemini AI · No data stored · No signup required"
              : "© 2025 ريزيوم AI · مدعوم بـ Gemini AI · لا يتم تخزين البيانات · لا يلزم التسجيل"}
          </footer>
        </>
      )}

      {/* ═══════════════ APP WIZARD ══════════════════════════════════════════ */}
      {view === "app" && (
        <div style={{ maxWidth:860,margin:"0 auto",padding:"40px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom:32,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16 }}>
            <div>
              <div className="tag" style={{ marginBottom:10 }}>{lang==="en"?"AI-Powered":"مدعوم بالذكاء الاصطناعي"}</div>
              <h1 style={{ fontSize:"clamp(24px,4vw,36px)",fontWeight:800,letterSpacing:"-0.5px" }}>{t.app.title}</h1>
            </div>
            <button className="btn-secondary" onClick={reset} style={{ fontSize:13,padding:"10px 18px" }}>← {t.app.restart}</button>
          </div>

          {/* API Key Banner (always visible in app) */}
          <ApiKeyBanner t={t} apiKey={apiKey} onSave={saveApiKey} />

          {/* Global API error */}
          {apiError && (
            <div style={{ background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#FCA5A5" }}>
              ⚠ {apiError}
            </div>
          )}

          {/* Step indicators */}
          <div style={{ display:"flex",gap:8,marginBottom:36,alignItems:"center",flexWrap:"wrap" }}>
            {[t.app.step1,t.app.step2,t.app.step3,t.app.step4].map((label, i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div
                  className={`step-badge${step>=i+1?" active":""}`}
                  style={step<i+1?{opacity:.3}:{}}
                >
                  {step>i+1?"✓":i+1}
                </div>
                <span style={{ fontSize:13,color:step===i+1?"#F8FAFC":"#475569",fontWeight:step===i+1?700:400 }}>{label}</span>
                {i<3 && <div style={{ width:24,height:1,background:"#243347",marginInline:4 }} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Upload Resume ──────────────────────────────────────── */}
          {step===1 && (
            <div className="fade-in card" style={{ padding:32 }}>
              <h2 style={{ fontWeight:700,fontSize:20,marginBottom:6 }}>{t.app.step1}</h2>
              <p style={{ color:"#64748B",fontSize:14,marginBottom:28 }}>{t.app.supported}</p>

              <div
                className={`drop-zone${dragging?" dragging":""}`}
                onDrop={onDrop}
                onDragOver={(e)=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onClick={()=>resumeInputRef.current.click()}
              >
                {resumeFile ? (
                  <div>
                    <div style={{ fontSize:40,marginBottom:10 }}>📄</div>
                    <div style={{ fontWeight:700,color:"#00C9A7",marginBottom:4 }}>{resumeFile.name}</div>
                    <div style={{ fontSize:13,color:"#64748B" }}>{(resumeFile.size/1024).toFixed(0)} KB · {resumeText.length} chars extracted</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:48,marginBottom:14 }}>📤</div>
                    <div style={{ fontWeight:600,marginBottom:8 }}>{t.app.dragDrop}</div>
                    <div style={{ color:"#64748B",fontSize:13,marginBottom:16 }}>{t.app.or}</div>
                    <span className="btn-secondary" style={{ fontSize:13,padding:"8px 20px",display:"inline-block" }}>{t.app.browse}</span>
                    <div style={{ marginTop:12,fontSize:12,color:"#475569" }}>{t.app.supported}</div>
                  </div>
                )}
              </div>
              <input ref={resumeInputRef} type="file" accept=".pdf,.docx,.doc" style={{ display:"none" }}
                onChange={(e)=>handleResumeFile(e.target.files[0])} />

              {resumeError && <p style={{ color:"#EF4444",fontSize:13,marginTop:10 }}>{resumeError}</p>}

              <div style={{ marginTop:28,display:"flex",justifyContent:"flex-end" }}>
                <button className="btn-primary" onClick={goStep2}>{t.app.next} →</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Job Description ────────────────────────────────────── */}
          {step===2 && (
            <div className="fade-in card" style={{ padding:32 }}>
              <h2 style={{ fontWeight:700,fontSize:20,marginBottom:6 }}>{t.app.step2}</h2>
              <p style={{ color:"#64748B",fontSize:14,marginBottom:24 }}>
                {lang==="en"?"Paste the job description or upload a JD file.":"الصق الوصف الوظيفي أو ارفع الملف."}
              </p>

              <div style={{ display:"flex",gap:8,marginBottom:20 }}>
                {["paste","upload"].map((mode)=>(
                  <button key={mode} onClick={()=>setJdMode(mode)}
                    style={{ padding:"8px 18px",borderRadius:8,border:"1.5px solid",
                      borderColor:jdMode===mode?"#00C9A7":"#243347",
                      background:jdMode===mode?"rgba(0,201,167,.1)":"transparent",
                      color:jdMode===mode?"#00C9A7":"#64748B",
                      fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}
                  >
                    {mode==="paste"?"📋 "+t.app.pasteJD:"📁 "+t.app.uploadJD}
                  </button>
                ))}
              </div>

              {jdMode==="paste" ? (
                <textarea className="textarea" rows={12} placeholder={t.app.jdPlaceholder}
                  value={jdText} onChange={(e)=>setJdText(e.target.value)} />
              ) : (
                <div>
                  <div className="drop-zone" style={{ padding:32,cursor:"pointer" }} onClick={()=>jdInputRef.current.click()}>
                    {jdFile ? (
                      <div>
                        <div style={{ fontSize:32,marginBottom:8 }}>📋</div>
                        <div style={{ fontWeight:700,color:"#00C9A7" }}>{jdFile.name}</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize:32,marginBottom:8 }}>📋</div>
                        <div style={{ fontWeight:600,marginBottom:4 }}>{t.app.uploadJD}</div>
                        <div style={{ fontSize:12,color:"#475569" }}>PDF · DOCX · TXT</div>
                      </div>
                    )}
                  </div>
                  <input ref={jdInputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display:"none" }}
                    onChange={(e)=>handleJdFile(e.target.files[0])} />
                  {jdText && (
                    <div style={{ marginTop:10,padding:12,background:"rgba(0,201,167,.06)",border:"1px solid rgba(0,201,167,.2)",borderRadius:8,fontSize:12,color:"#94A3B8" }}>
                      ✓ {lang==="en"?"Content extracted":"تم استخراج المحتوى"} — {jdText.length} {lang==="en"?"chars":"حرف"}
                    </div>
                  )}
                </div>
              )}

              {jdError && <p style={{ color:"#EF4444",fontSize:13,marginTop:10 }}>{jdError}</p>}

              <div style={{ marginTop:28,display:"flex",gap:12,justifyContent:"space-between" }}>
                <button className="btn-secondary" onClick={()=>setStep(1)}>← {t.app.back}</button>
                <button className="btn-primary" onClick={goStep3}>{t.app.analyze}</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Analyzing ──────────────────────────────────────────── */}
          {step===3 && (
            <div className="fade-in card" style={{ padding:56,textAlign:"center" }}>
              <div style={{ fontSize:56,marginBottom:20 }}>🤖</div>
              <h2 style={{ fontWeight:700,fontSize:22,marginBottom:10 }}>{t.app.analyzing}</h2>
              <p style={{ color:"#64748B",fontSize:14,marginBottom:36 }}>
                {lang==="en"
                  ?"Gemini AI is analyzing your resume against the job requirements…"
                  :"Gemini AI يحلل سيرتك الذاتية مقابل متطلبات الوظيفة…"}
              </p>
              <div style={{ display:"flex",justifyContent:"center" }}>
                <div style={{ width:48,height:48,border:"3px solid #1E2D42",borderTopColor:"#00C9A7",borderRadius:"50%",animation:"spin .8s linear infinite" }} />
              </div>
              <p style={{ color:"#475569",fontSize:12,marginTop:24 }}>
                {lang==="en"?"Powered by Google Gemini 1.5 Flash":"مدعوم بـ Google Gemini 1.5 Flash"}
              </p>
            </div>
          )}

          {/* ── STEP 4: Results ────────────────────────────────────────────── */}
          {step===4 && analysis && (
            <div className="fade-in">

              {/* Score overview */}
              <div className="card" style={{ padding:32,marginBottom:20 }}>
                <h2 style={{ fontWeight:700,fontSize:18,marginBottom:24 }}>{t.app.score}</h2>
                <div style={{ display:"flex",flexWrap:"wrap",gap:32,alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <ScoreRing score={analysis.overallScore||0} size={150} />
                    <div style={{ fontSize:13,color:"#64748B",marginTop:8 }}>
                      {lang==="en"?"Overall ATS Score":"درجة ATS الإجمالية"}
                    </div>
                  </div>
                  <div style={{ flex:1,minWidth:260 }}>
                    <ProgressBar value={analysis.skillsScore||0}     label={t.app.skills} />
                    <ProgressBar value={analysis.experienceScore||0}  label={t.app.exp} />
                    <ProgressBar value={analysis.educationScore||0}   label={t.app.edu} />
                    <ProgressBar value={analysis.keywordsScore||0}    label={t.app.keywords} />
                  </div>
                </div>
                {analysis.summary && (
                  <div style={{ marginTop:24,padding:16,background:"rgba(0,201,167,.06)",border:"1px solid rgba(0,201,167,.15)",borderRadius:10,fontSize:14,color:"#94A3B8",lineHeight:1.65 }}>
                    {analysis.summary}
                  </div>
                )}
              </div>

              {/* Gaps & Strengths */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:20 }}>
                <div className="card" style={{ padding:24 }}>
                  <h3 style={{ fontWeight:700,fontSize:15,marginBottom:14,color:"#FCA5A5" }}>⚠ {t.app.missing}</h3>
                  <div>{(analysis.missingKeywords||[]).map((k,i)=><span key={i} className="keyword-tag">{k}</span>)}</div>
                  {analysis.missingSkills?.length>0 && (
                    <div style={{ marginTop:12 }}>
                      <div style={{ fontSize:12,color:"#64748B",marginBottom:6 }}>
                        {lang==="en"?"Missing Skills:":"المهارات المفقودة:"}
                      </div>
                      {analysis.missingSkills.map((s,i)=><span key={i} className="keyword-tag">{s}</span>)}
                    </div>
                  )}
                </div>
                <div className="card" style={{ padding:24 }}>
                  <h3 style={{ fontWeight:700,fontSize:15,marginBottom:14,color:"#00C9A7" }}>
                    ✓ {lang==="en"?"Your Strengths":"نقاط قوتك"}
                  </h3>
                  <div>{(analysis.strengths||[]).map((s,i)=><span key={i} className="strength-tag">{s}</span>)}</div>
                  {analysis.suggestions?.length>0 && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ fontSize:12,color:"#64748B",marginBottom:6 }}>
                        {lang==="en"?"Suggestions:":"اقتراحات:"}
                      </div>
                      {analysis.suggestions.map((s,i)=>(
                        <div key={i} style={{ fontSize:13,color:"#94A3B8",marginBottom:8,paddingInlineStart:12,borderInlineStart:"2px solid #F59E0B",lineHeight:1.5 }}>{s}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Output Tabs */}
              <div className="card" style={{ padding:24 }}>
                {/* Tab bar */}
                <div style={{ display:"flex",gap:4,marginBottom:20,background:"#0B1628",borderRadius:10,padding:4,flexWrap:"wrap" }}>
                  {t.app.tabs.map((tab,i)=>(
                    <button key={i}
                      className={`tab-btn${activeTab===i?" active":""}`}
                      onClick={()=>setActiveTab(i)}
                      style={{ flex:1 }}
                    >{tab}</button>
                  ))}
                </div>

                {/* Generate prompt */}
                {!tabContents[activeTab] && !isTabGenerating[activeTab] && (
                  <div style={{ textAlign:"center",padding:"36px 0" }}>
                    <div style={{ fontSize:44,marginBottom:14 }}>{["✏️","📝","🎤"][activeTab]}</div>
                    <p style={{ color:"#64748B",fontSize:14,marginBottom:20 }}>
                      {lang==="en"?"Ready to generate — click below.":"جاهز للإنشاء — انقر أدناه."}
                    </p>
                    <button className="btn-primary" onClick={tabGenerators[activeTab]}>{tabLabels[activeTab]}</button>
                  </div>
                )}

                {/* Loading */}
                {isTabGenerating[activeTab] && (
                  <div style={{ textAlign:"center",padding:"44px 0" }}>
                    <div style={{ width:40,height:40,border:"3px solid #1E2D42",borderTopColor:"#00C9A7",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px" }} />
                    <p style={{ color:"#64748B",fontSize:14 }}>{t.app.generating}</p>
                  </div>
                )}

                {/* Content */}
                {tabContents[activeTab] && !isTabGenerating[activeTab] && (
                  <div>
                    <div className="result-box">{tabContents[activeTab]}</div>
                    <div style={{ display:"flex",gap:10,marginTop:16,flexWrap:"wrap" }}>
                      <button className="btn-secondary" style={{ fontSize:13,padding:"10px 18px" }}
                        onClick={()=>copyToClipboard(tabContents[activeTab])}>
                        {copied?t.app.copied:t.app.copyBtn}
                      </button>
                      <button className="btn-primary" style={{ fontSize:13,padding:"10px 18px" }}
                        onClick={()=>downloadTxt(tabContents[activeTab],tabFilenames[activeTab])}>
                        ↓ {t.app.download} (.txt)
                      </button>
                      <button className="btn-secondary" style={{ fontSize:13,padding:"10px 18px" }}
                        onClick={tabGenerators[activeTab]}>
                        ↺ {lang==="en"?"Regenerate":"إعادة الإنشاء"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate everything */}
              {(!results.resume||!results.cover||!results.interview) && (
                <div style={{ marginTop:20,textAlign:"center" }}>
                  <button className="btn-primary" style={{ padding:"15px 32px",fontSize:15 }}
                    onClick={async()=>{
                      await generateOptimizedResume();
                      await generateCoverLetter();
                      await generateInterviewPrep();
                    }}>
                    ⚡ {lang==="en"?"Generate Everything":"إنشاء كل شيء"}
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
