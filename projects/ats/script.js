const API_PROXY_URL = 'https://groq-proxy.mishary-fgh.workers.dev/';
const GROQ_API_KEY = '';

/* ════════════════════════════════════════════════════════════════
   LANGUAGE DATA
   ════════════════════════════════════════════════════════════════ */
const LANG = {
  en: {
    dir: 'ltr',
    nav: { brand: 'ATS Optimizer' },
    hero: {
      badge: 'Professional ATS Optimization',
      l1: 'Land Interviews,', l2: 'Not the Trash Folder',
      sub: 'Upload your resume and job description. Get an optimized resume, tailored cover letter, and interview prep — all in seconds.',
      cta: 'Upload Your Resume →', fine: 'No signup required. 100% free to use.',
      stats: ['ATS Pass Rate', 'More Interviews', 'Average Time'],
    },
    how: {
      badge: 'How It Works', sub: 'Four steps from upload to interview-ready',
      steps: [
        { icon: '📄', t: 'Upload Resume', d: 'PDF or DOCX — drag & drop or click to browse' },
        { icon: '📋', t: 'Add Job Description', d: 'Paste the job description text or upload the file' },
        { icon: '⚙️', t: 'Analysis & Optimization', d: 'ATS score, keyword gaps, professional resume rewrite' },
        { icon: '🚀', t: 'Download & Apply', d: 'Optimized resume, cover letter & interview prep' },
      ],
    },
    feat: {
      title: 'Everything You Need to Get Hired',
      items: [
        { icon: '🎯', t: 'ATS Score Analysis', d: 'Real-time match scoring against job requirements with detailed breakdowns' },
        { icon: '✏️', t: 'Resume Optimization', d: 'Professionally rewritten bullets and summaries using your real experience — never fabricated' },
        { icon: '📝', t: 'Cover Letter Generator', d: 'Tailored professional cover letters matched to every job you apply for' },
        { icon: '🎤', t: 'Interview Preparation', d: 'HR, behavioral, and technical Q&A based on the actual job description' },
        { icon: '🔍', t: 'Keyword Gap Analysis', d: 'Identify every missing keyword ATS systems filter for' },
        { icon: '📥', t: 'Download Results', d: 'Copy or download your optimized documents instantly' },
      ],
    },
    cta: { title: 'Ready to Beat the ATS?', sub: 'Upload your resume now and get an optimized version in under a minute.' },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        { q: 'Is my resume data private?', a: 'Your files are processed temporarily in your browser session and never stored on any server.' },
        { q: 'Does the optimizer invent experience?', a: 'Never. It only optimizes existing information — improving wording, structure, and keyword alignment. It never fabricates jobs, degrees, or skills.' },
        { q: 'What file formats are supported?', a: 'We support PDF and DOCX for resumes. Job descriptions can be pasted as text or uploaded as PDF, DOCX, or TXT.' },
        { q: 'How long does the analysis take?', a: 'Typically 15–30 seconds depending on document length.' },
        { q: 'Is it really free?', a: 'Yes. This tool is completely free to use. No signup, no payment, no credit card required.' },
        { q: 'Need help?', a: 'Contact our support team at support@mfag.sa — we usually reply within 24 hours.' },
      ],
    },
    footer: '© 2025 ATS Optimizer · No data stored · No signup required',
    app: {
      badge: 'ATS Optimizer', title: 'Optimize Your Resume', restart: '← Start Over',
      s1t: 'Upload Resume', s1s: 'Supports PDF and DOCX',
      s1drag: 'Drag & drop your resume here', s1or: 'or', s1browse: 'Browse Files', s1hint: 'PDF or DOCX accepted',
      s1remove: '✕ Remove', s1next: 'Continue →',
      s2t: 'Job Description', s2s: 'Paste the text or upload a file.',
      s2paste: '📋 Paste Text', s2upload: '📁 Upload File',
      s2ph: 'Paste the full job description here...',
      s2uploadtxt: 'Click or drag to upload JD file',
      s2back: '← Back', s2next: 'Analyze Resume',
      s3t: 'Analyzing your resume…', s3s: 'Comparing your resume against the job requirements.',
      s3tip: 'Usually takes 15–30 seconds',
      scoreTitle: 'ATS Match Score', ringLbl: 'ATS Score',
      pSkills: 'Skills Match', pExp: 'Experience Match', pEdu: 'Education Match', pKw: 'Keywords Match',
      misTitle: 'Missing Keywords', strTitle: 'Your Strengths',
      misSkillsLbl: 'Missing Skills:', sugLbl: 'Suggestions:',
      tl0: 'Optimized Resume', tl1: 'Cover Letter', tl2: 'Interview Prep',
      gen0: 'Generate Optimized Resume', gen1: 'Generate Cover Letter', gen2: 'Generate Interview Prep',
      generating: 'Generating…',
      readyTxt: 'Ready to generate — click below.',
      copy: 'Copy', copied: 'Copied!', dlPdf: '↓ PDF', dlDocx: '↓ Word (DOCX)', dlTxt: '↓ TXT', regen: '↺ Regenerate', tpl1: '↓ PDF · Classic', tpl2: '↓ PDF · Navy Pro', tpl3: '↓ PDF · Minimal',
      genAll: '⚡ Generate Everything',
      errFile: 'Please upload a PDF or DOCX file.',
      errJD: 'Please enter or upload a job description.',
      errKey: 'API key not configured. Please contact the site owner.',
      extracted: n => `✓ Content extracted — ${n} characters`,
    },
  },
};

/* ════════════════════════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════════════════════════ */
let lang = 'en';
let t = LANG.en;
let resumeFile = null;
let resumeText = '';
let jdText = '';
let jdMode = 'paste';
let analysis = null;
let results = { 0: '', 1: '', 2: '' };
let resumeJSON = null;   // structured resume data for styled PDF/DOCX
let busy = { 0: false, 1: false, 2: false };
let activeTab = 0;
let openFaq = -1;
let step = 1;

/* ════════════════════════════════════════════════════════════════
   DOM HELPERS
   ════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const tx = (id, v) => { const e = $(id); if (e) e.textContent = v; };
const sh = id => { const e = $(id); if (e) e.classList.remove('hidden'); };
const hi = id => { const e = $(id); if (e) e.classList.add('hidden'); };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ════════════════════════════════════════════════════════════════
   GROQ API — free & fast (console.groq.com)
   ════════════════════════════════════════════════════════════════ */
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
let groqModel = null;

async function ai(system, user, maxTok = 2000) {
  if (!API_PROXY_URL && !GROQ_API_KEY) {
    throw new Error(t.app.errKey);
  }
  const models = groqModel ? [groqModel, ...GROQ_MODELS.filter(m => m !== groqModel)] : GROQ_MODELS;
  let lastErr = null;

  for (const model of models) {
    // Up to 2 attempts per model (handles rate-limit spikes)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const endpoint = API_PROXY_URL || 'https://api.groq.com/openai/v1/chat/completions';
        const headers = { 'Content-Type': 'application/json' };
        if (!API_PROXY_URL) headers['Authorization'] = `Bearer ${GROQ_API_KEY}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            max_tokens: maxTok,
            temperature: 0.4,
          }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          const err = new Error(e?.error?.message || `Groq error ${res.status}`);
          err.status = res.status;
          throw err;
        }
        const d = await res.json();
        groqModel = model;
        console.log('✓ Using Groq model:', model);
        return d.choices?.[0]?.message?.content || '';
      } catch (err) {
        lastErr = err;
        // 429 = rate limited → wait & retry once, then try next model
        if (err.status === 429 && attempt === 0) {
          console.warn('⏳ Rate limited, retrying in 3s:', model);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        // Model unavailable → next model
        if (err.status === 404 || err.status === 400 || err.status === 429 || err.status === 503) {
          console.warn('✗ Skipping model:', model, '—', err.message);
          groqModel = null;
          break;
        }
        throw err; // auth or other fatal errors → stop
      }
    }
  }
  throw lastErr || new Error('No Groq model available — check your API key');
}

// Backwards-compatible alias (rest of the code calls gemini())
const gemini = ai;

/* ════════════════════════════════════════════════════════════════
   FILE READING — real PDF & DOCX text extraction
   Uses pdf.js and mammoth.js loaded from CDN in index.html
   ════════════════════════════════════════════════════════════════ */
const readRaw = (f, asBuffer) => new Promise((ok, err) => {
  const r = new FileReader();
  r.onload = e => ok(e.target.result);
  r.onerror = () => err(new Error('read error'));
  asBuffer ? r.readAsArrayBuffer(f) : r.readAsText(f, 'UTF-8');
});

async function extractText(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  // ── PDF: use pdf.js for real text extraction ──
  if (ext === 'pdf') {
    if (typeof pdfjsLib === 'undefined') return await readRaw(file, false); // CDN failed → fallback
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const buf = await readRaw(file, true);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let text = '';
      const maxPages = Math.min(pdf.numPages, 10);
      for (let p = 1; p <= maxPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(' ') + '\n';
      }
      if (text.trim().length > 50) return text;
      return '[PDF appears to be scanned/image-based — no extractable text found]';
    } catch (e) {
      console.warn('PDF extraction failed:', e.message);
      return await readRaw(file, false);
    }
  }

  // ── DOCX: use mammoth.js ──
  if (ext === 'docx') {
    if (typeof mammoth === 'undefined') return await readRaw(file, false);
    try {
      const buf = await readRaw(file, true);
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      if (result.value && result.value.trim().length > 20) return result.value;
    } catch (e) {
      console.warn('DOCX extraction failed:', e.message);
    }
    return await readRaw(file, false);
  }

  // ── TXT / DOC / others: plain text ──
  return await readRaw(file, false);
}

/* ════════════════════════════════════════════════════════════════
   LANGUAGE
   ════════════════════════════════════════════════════════════════ */
function applyLang() {
  t = LANG[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = t.dir;
  renderLanding();
  renderAppText();
}

/* ════════════════════════════════════════════════════════════════
   LANDING RENDER
   ════════════════════════════════════════════════════════════════ */
function renderLanding() {
  tx('brandName', t.nav.brand); tx('footerBrand', t.nav.brand);
  $('heroCtaBtn').textContent = t.hero.cta;
  $('ctaBandBtn').textContent = t.hero.cta;

  tx('heroBadge', t.hero.badge); tx('heroL1', t.hero.l1); tx('heroL2', t.hero.l2);
  tx('heroSub', t.hero.sub); tx('heroFine', t.hero.fine);
  tx('st0', t.hero.stats[0]); tx('st1', t.hero.stats[1]); tx('st2', t.hero.stats[2]);

  tx('howBadge', t.how.badge); tx('howSub', t.how.sub);
  $('howGrid').innerHTML = t.how.steps.map((s, i) => `
    <div class="how-card">
      <span class="how-num">0${i + 1}</span>
      <div class="how-icon">${s.icon}</div>
      <div class="how-title">${s.t}</div>
      <div class="how-desc">${s.d}</div>
    </div>`).join('');

  tx('featTitle', t.feat.title);
  $('featGrid').innerHTML = t.feat.items.map(f => `
    <div class="feat-card">
      <div class="feat-icon">${f.icon}</div>
      <div class="feat-title">${f.t}</div>
      <div class="feat-desc">${f.d}</div>
    </div>`).join('');

  tx('ctaTitle', t.cta.title); tx('ctaSub', t.cta.sub);

  tx('faqTitle', t.faq.title);
  $('faqList').innerHTML = t.faq.items.map((f, i) => `
    <div class="faq-item">
      <button class="faq-q" onclick="faqToggle(${i})">
        <span>${f.q}</span>
        <span class="faq-icon" id="fi${i}">+</span>
      </button>
      <div class="faq-a hidden" id="fa${i}">${f.a}</div>
    </div>`).join('');

  tx('footerText', t.footer);
}

function faqToggle(i) {
  if (openFaq === i) { hi(`fa${i}`); tx(`fi${i}`, '+'); openFaq = -1; }
  else {
    if (openFaq >= 0) { hi(`fa${openFaq}`); tx(`fi${openFaq}`, '+'); }
    sh(`fa${i}`); tx(`fi${i}`, '−'); openFaq = i;
  }
}

/* ════════════════════════════════════════════════════════════════
   APP TEXT
   ════════════════════════════════════════════════════════════════ */
function renderAppText() {
  const a = t.app;
  tx('appBadge', a.badge); tx('appTitle', a.title);
  $('restartBtn').textContent = a.restart;
  // step labels
  tx('sl1', a.s1t); tx('sl2', a.s2t);
  tx('sl3', 'Analysis'); tx('sl4', 'Results');
  // step 1
  tx('s1Title', a.s1t); tx('s1Sub', a.s1s);
  tx('s1DragTxt', a.s1drag); tx('s1OrTxt', a.s1or);
  $('s1BrowseBtn').textContent = a.s1browse; tx('s1Hint', a.s1hint);
  $('rClearBtn').textContent = a.s1remove; $('s1NextBtn').textContent = a.s1next;
  // step 2
  tx('s2Title', a.s2t); tx('s2Sub', a.s2s);
  $('modePaste').textContent = a.s2paste; $('modeUpload').textContent = a.s2upload;
  $('jdTA').placeholder = a.s2ph; tx('s2UploadTxt', a.s2uploadtxt);
  $('s2BackBtn').textContent = a.s2back; $('s2NextBtn').textContent = a.s2next;
  // step 3
  tx('s3Title', a.s3t); tx('s3Sub', a.s3s); tx('s3Tip', a.s3tip);
  // step 4
  tx('s4ScoreTitle', a.scoreTitle); tx('ringLbl', a.ringLbl);
  tx('pLblSkills', a.pSkills); tx('pLblExp', a.pExp); tx('pLblEdu', a.pEdu); tx('pLblKw', a.pKw);
  $('missingTitle').innerHTML = `<span class="warn">⚠</span> ${a.misTitle}`;
  $('strengthsTitle').innerHTML = `<span class="teal">✓</span> ${a.strTitle}`;
  tx('tl0', a.tl0); tx('tl1', a.tl1); tx('tl2', a.tl2);
  $('genAllBtn').textContent = a.genAll;
}

/* ════════════════════════════════════════════════════════════════
   VIEW SWITCHING
   ════════════════════════════════════════════════════════════════ */
function showLanding() { sh('landingPage'); hi('appWizard'); window.scrollTo(0, 0); }

function showApp() {
  hi('landingPage'); sh('appWizard');
  $('appWizard').classList.add('fade-in');
  goStep(1); window.scrollTo(0, 0);
}

function restart() {
  resumeFile = null; resumeText = ''; jdText = ''; jdMode = 'paste';
  analysis = null; results = { 0: '', 1: '', 2: '' }; resumeJSON = null; busy = { 0: false, 1: false, 2: false };
  activeTab = 0; openFaq = -1;
  // reset step 1 UI
  sh('dzEmpty'); hi('dzFilled'); $('resumeInput').value = '';
  hi('s1Err');
  // reset step 2 UI
  $('jdTA').value = ''; setJdMode('paste'); hi('s2Err');
  hi('jdDZFilled'); sh('jdDZEmpty'); hi('jdExtractOk');
  $('jdInput').value = '';
  showLanding();
}

/* ════════════════════════════════════════════════════════════════
   STEP MANAGEMENT
   ════════════════════════════════════════════════════════════════ */
function goStep(n) {
  step = n;
  ['step1', 'step2', 'step3', 'step4'].forEach((id, i) => {
    const el = $(id);
    if (!el) return;
    if (i + 1 === n) { el.classList.remove('hidden'); el.classList.add('fade-in'); }
    else el.classList.add('hidden');
  });
  updateIndicators();
  window.scrollTo({ top: $('appWizard').offsetTop - 80, behavior: 'smooth' });
}

function updateIndicators() {
  for (let i = 1; i <= 4; i++) {
    const n = $(` sn${i}`.trim()), l = $(`sl${i}`);
    if (!n) continue;
    n.classList.remove('active', 'done');
    if (l) l.classList.remove('active');
    if (i < step) { n.classList.add('done'); n.textContent = '✓'; }
    else if (i === step) { n.classList.add('active'); n.textContent = i; if (l) l.classList.add('active'); }
    else n.textContent = i;
  }
}

/* ════════════════════════════════════════════════════════════════
   STEP 1 — RESUME UPLOAD
   ════════════════════════════════════════════════════════════════ */
function initStep1() {
  const dz = $('resumeDZ'), inp = $('resumeInput');

  dz.addEventListener('click', e => { if (e.target.id === 'rClearBtn') return; inp.click(); });
  dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') inp.click(); });
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragging'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragging'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragging'); handleResume(e.dataTransfer.files[0]); });
  inp.addEventListener('change', () => handleResume(inp.files[0]));
  $('rClearBtn').addEventListener('click', e => { e.stopPropagation(); clearResume(); });
  $('s1NextBtn').addEventListener('click', s1Next);
  $('s1BrowseBtn').addEventListener('click', e => { e.stopPropagation(); inp.click(); });
}

async function handleResume(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'docx', 'doc'].includes(ext)) { showErr('s1Err', t.app.errFile); return; }
  hi('s1Err'); resumeFile = file;
  try { resumeText = (await extractText(file)).replace(/\0/g, ' ').slice(0, 12000); }
  catch { resumeText = `[${file.name}]`; }
  hi('dzEmpty'); sh('dzFilled');
  tx('rFileName', file.name);
  tx('rFileSize', `${(file.size / 1024).toFixed(0)} KB · ${resumeText.length} chars extracted`);
}

function clearResume() {
  resumeFile = null; resumeText = '';
  sh('dzEmpty'); hi('dzFilled');
  $('resumeInput').value = '';
}

function s1Next() {
  if (!resumeFile) { showErr('s1Err', t.app.errFile); return; }
  hi('s1Err'); goStep(2);
}

/* ════════════════════════════════════════════════════════════════
   STEP 2 — JOB DESCRIPTION
   ════════════════════════════════════════════════════════════════ */
function initStep2() {
  $('modePaste').addEventListener('click', () => setJdMode('paste'));
  $('modeUpload').addEventListener('click', () => setJdMode('upload'));
  $('s2BackBtn').addEventListener('click', () => goStep(1));
  $('s2NextBtn').addEventListener('click', s2Next);

  const jdDz = $('jdDZ'), jdInp = $('jdInput');
  jdDz.addEventListener('click', () => jdInp.click());
  jdDz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') jdInp.click(); });
  jdDz.addEventListener('dragover', e => { e.preventDefault(); jdDz.classList.add('dragging'); });
  jdDz.addEventListener('dragleave', () => jdDz.classList.remove('dragging'));
  jdDz.addEventListener('drop', e => { e.preventDefault(); jdDz.classList.remove('dragging'); handleJD(e.dataTransfer.files[0]); });
  jdInp.addEventListener('change', () => handleJD(jdInp.files[0]));
}

function setJdMode(m) {
  jdMode = m;
  if (m === 'paste') { sh('jdPasteWrap'); hi('jdUploadWrap'); $('modePaste').classList.add('active'); $('modeUpload').classList.remove('active'); }
  else { hi('jdPasteWrap'); sh('jdUploadWrap'); $('modeUpload').classList.add('active'); $('modePaste').classList.remove('active'); }
}

async function handleJD(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'docx', 'doc', 'txt'].includes(ext)) { showErr('s2Err', t.app.errFile); return; }
  hi('s2Err');
  try {
    jdText = (await extractText(file)).replace(/\0/g, ' ').slice(0, 7000);
  } catch { jdText = `[${file.name}]`; }
  tx('jdFileName', file.name); hi('jdDZEmpty'); sh('jdDZFilled');
  sh('jdExtractOk'); tx('jdExtractOk', t.app.extracted(jdText.length));
}

async function s2Next() {
  if (jdMode === 'paste') jdText = ($('jdTA').value || '').trim();
  if (!jdText.trim()) { showErr('s2Err', t.app.errJD); return; }
  hi('s2Err'); hi('globalError');
  goStep(3);
  await runAnalysis();
}

/* Parses JSON even if the model's response was cut off mid-string */
function safeParseJSON(raw) {
  let s = raw.replace(/```json|```/g, '').trim();
  // Extract from first { to last }
  const start = s.indexOf('{');
  if (start === -1) throw new Error('No JSON found in response');
  s = s.slice(start);
  const lastBrace = s.lastIndexOf('}');
  if (lastBrace !== -1) {
    try { return JSON.parse(s.slice(0, lastBrace + 1)); } catch (e) { }
  }
  // Repair truncated JSON: close open strings, arrays, and braces
  let inStr = false, esc = false, depth = 0, arrDepth = 0;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '[') arrDepth++;
    else if (ch === ']') arrDepth--;
  }
  let fixed = s;
  if (inStr) fixed += '"';
  // Remove trailing comma or incomplete key
  fixed = fixed.replace(/,\s*$/, '').replace(/,\s*"[^"]*$/, '');
  while (arrDepth-- > 0) fixed += ']';
  while (depth-- > 0) fixed += '}';
  return JSON.parse(fixed);
}

/* ════════════════════════════════════════════════════════════════
   ANALYSIS
   ════════════════════════════════════════════════════════════════ */
async function runAnalysis() {
  try {
    const raw = await gemini(
      `You are an expert ATS analyst and resume consultant.
CRITICAL: Never invent experience, education, certifications, or achievements.
Only analyze what is in the resume.
Return ONLY valid JSON — no markdown, no fences, no extra text.`,
      `Analyze this resume against the job description. Return ONLY this JSON structure:
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
  "summary": "<2-sentence summary>"
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`, 3000);

    analysis = safeParseJSON(raw);
  } catch (err) {
    analysis = {
      overallScore: 50, skillsScore: 55, experienceScore: 45, educationScore: 65, keywordsScore: 40,
      missingKeywords: [`Error: ${err.message}`],
      missingSkills: [], strengths: [], suggestions: ['Check your API key and try again'],
      summary: `Analysis failed: ${err.message}`,
    };
  }
  goStep(4);
  renderStep4();
}

/* ════════════════════════════════════════════════════════════════
   STEP 4 RENDER
   ════════════════════════════════════════════════════════════════ */
function renderStep4() {
  if (!analysis) return;
  const s = analysis.overallScore || 0;
  const circ = 2 * Math.PI * 65;
  const color = s >= 75 ? '#00C9A7' : s >= 50 ? '#F59E0B' : '#EF4444';
  const arc = $('ringArc');
  if (arc) { arc.setAttribute('stroke', color); setTimeout(() => arc.setAttribute('stroke-dasharray', `${(s / 100) * circ} ${circ}`), 60); }
  tx('ringPct', `${s}%`);
  if ($('ringPct')) $('ringPct').setAttribute('fill', color);

  setBar('pFillSkills', 'pPctSkills', analysis.skillsScore || 0);
  setBar('pFillExp', 'pPctExp', analysis.experienceScore || 0);
  setBar('pFillEdu', 'pPctEdu', analysis.educationScore || 0);
  setBar('pFillKw', 'pPctKw', analysis.keywordsScore || 0);

  if (analysis.summary) { tx('summaryBox', analysis.summary); sh('summaryBox'); }

  const mkw = $('missingKwWrap');
  if (mkw) mkw.innerHTML = (analysis.missingKeywords || []).map(k => `<span class="kw-tag">${esc(k)}</span>`).join('');

  if ((analysis.missingSkills || []).length > 0) {
    sh('missingSkillsWrap'); tx('misSkillsLbl', t.app.misSkillsLbl);
    const msw = $('missingSkillsTags');
    if (msw) msw.innerHTML = analysis.missingSkills.map(s => `<span class="kw-tag">${esc(s)}</span>`).join('');
  }

  const stw = $('strengthsTags');
  if (stw) stw.innerHTML = (analysis.strengths || []).map(s => `<span class="str-tag">${esc(s)}</span>`).join('');

  if ((analysis.suggestions || []).length > 0) {
    sh('suggestionsWrap'); tx('sugLbl', t.app.sugLbl);
    const sl = $('sugList');
    if (sl) sl.innerHTML = analysis.suggestions.map(s => `<div class="sug-item">${esc(s)}</div>`).join('');
  }

  renderTab(0);
  updateGenAll();
}

function setBar(fillId, pctId, val) {
  const color = val >= 75 ? '#00C9A7' : val >= 50 ? '#F59E0B' : '#EF4444';
  const f = $(fillId), p = $(pctId);
  if (f) { f.style.background = color; setTimeout(() => { f.style.width = val + '%'; }, 60); }
  if (p) { p.textContent = val + '%'; p.style.color = color; }
}

/* ════════════════════════════════════════════════════════════════
   TABS
   ════════════════════════════════════════════════════════════════ */
function renderTab(idx) {
  activeTab = idx;
  for (let i = 0; i < 3; i++) $(`tab${i}`)?.classList.toggle('active', i === idx);

  const box = $('tabContent');
  if (!box) return;

  const icons = ['✏️', '📝', '🎤'];
  const fnames = ['optimized-resume.txt', 'cover-letter.txt', 'interview-prep.txt'];

  if (busy[idx]) {
    box.innerHTML = `<div class="tab-loading"><div class="spinner-md"></div><p>${t.app.generating}</p></div>`;
    return;
  }
  if (!results[idx]) {
    box.innerHTML = `
      <div class="tab-empty">
        <div class="tab-empty-icon">${icons[idx]}</div>
        <p>${t.app.readyTxt}</p>
        <button class="btn-primary" onclick="generate(${idx})">${t.app['gen' + idx]}</button>
      </div>`;
    return;
  }
  const dlBtns = (idx === 0 && resumeJSON)
    ? `<button class="btn-primary btn-sm" onclick="dlPdfTpl(1)">${t.app.tpl1}</button>
       <button class="btn-secondary btn-sm" onclick="dlDocxTpl(1)">Word · Classic</button>
       <button class="btn-primary btn-sm" onclick="dlPdfTpl(2)">${t.app.tpl2}</button>
       <button class="btn-secondary btn-sm" onclick="dlDocxTpl(2)">Word · Navy Pro</button>
       <button class="btn-primary btn-sm" onclick="dlPdfTpl(3)">${t.app.tpl3}</button>
       <button class="btn-secondary btn-sm" onclick="dlDocxTpl(3)">Word · Minimal</button>`
    : `<button class="btn-primary btn-sm" onclick="dlPdf(${idx})">${t.app.dlPdf}</button>
       <button class="btn-primary btn-sm" onclick="dlDocx(${idx})">${t.app.dlDocx}</button>`;
  box.innerHTML = `
    <div class="result-box">${esc(results[idx])}</div>
    <div class="result-actions">
      ${dlBtns}
      <button class="btn-secondary btn-sm" id="cpyBtn${idx}" onclick="copyTab(${idx})">${t.app.copy}</button>
      <button class="btn-secondary btn-sm" onclick="generate(${idx})">${t.app.regen}</button>
    </div>`;
}

function updateGenAll() {
  const done = results[0] && results[1] && results[2];
  $('genAllWrap').style.display = done ? 'none' : 'block';
}

/* ════════════════════════════════════════════════════════════════
   GENERATORS
   ════════════════════════════════════════════════════════════════ */
async function generate(idx) {
  const fns = [genResume, genCover, genInterview];
  await fns[idx]();
}

async function genResume() {
  busy[0] = true; renderTab(0);
  try {
    const raw = await gemini(
      `You are a top 1% professional resume writer with 15+ years of experience, certified in ATS optimization (CPRW-level expertise). You have written thousands of resumes that passed Fortune 500 ATS systems.

YOUR PROFESSIONAL STANDARDS:
- Every bullet starts with a strong action verb (Led, Engineered, Streamlined, Resolved, Implemented — never "Responsible for" or "Worked on")
- Quantify wherever the original data allows: percentages, counts, timeframes, budgets (use ONLY numbers present in the original — never invent metrics)
- Mirror the EXACT keywords and terminology from the job description wherever the candidate genuinely has that experience (ATS systems match exact phrases)
- Present tense for current roles, past tense for previous roles
- No first-person pronouns (I, my, me) anywhere
- Concise, high-impact phrasing — cut filler words
- Professional summary: 3-4 sentences positioning the candidate for THIS specific role using their real background

CRITICAL — NEVER BREAK:
- Never invent, fabricate, or add any experience, job, employer, date, degree, certification, project, skill, or achievement.
- Only rewrite and optimize what is genuinely in the resume.
- NEVER DELETE information: every job, education entry, project, certification, and contact detail in the original MUST appear in your output.
- Return ONLY valid JSON. No markdown fences, no extra text.`,
      `Optimize this resume targeting the job description, then return it as JSON with EXACTLY this structure:
{
  "name": "<full name>",
  "title": "<professional title, aligned with the target job if truthful>",
  "summary": "<rewritten professional summary, 3-4 sentences, keyword-optimized>",
  "contact": {
    "email": "<email or empty string>",
    "phone": "<phone or empty string>",
    "location": "<city or empty string>",
    "linkedin": "<linkedin handle/url or empty string>"
  },
  "experience": [
    {
      "title": "<job title>",
      "company": "<company name>",
      "dates": "<dates as in original>",
      "location": "<location>",
      "bullets": ["<rewritten bullet with strong action verb and JD keywords>", "..."]
    }
  ],
  "education": [
    {"degree": "<degree>", "school": "<school>", "dates": "<dates>", "note": "<honors/GPA or empty>"}
  ],
  "projects": [
    {"name": "<project name>", "description": "<one-line description>", "bullets": ["<achievement>", "..."]}
  ],
  "softSkills": ["..."],
  "hardSkills": ["..."],
  "certifications": [
    {"name": "<cert name>", "issuer": "<issuer>", "date": "<date>"}
  ],
  "suggestions": ["<2-3 honest missing qualifications for this job — advice only>"]
}

RULES:
- Copy contact details EXACTLY as found in the resume. If missing, use empty string.
- Include ALL experience entries with ALL bullets (rewritten, none dropped).
- Include ALL education, projects, certifications from the original.
- Integrate job description keywords naturally into summary and bullets.
- Never fabricate anything not in the original resume.

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`,
      4000);
    resumeJSON = safeParseJSON(raw);
    results[0] = resumeToText(resumeJSON);
  } catch (e) { resumeJSON = null; results[0] = `Error: ${e.message}`; }
  busy[0] = false; renderTab(0); updateGenAll();
}

/* Convert structured resume to readable plain text (for display + TXT) */
function resumeToText(d) {
  const L = [];
  L.push(d.name || '');
  if (d.title) L.push(d.title);
  L.push('');
  const c = d.contact || {};
  const ct = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).join('  |  ');
  if (ct) { L.push(ct); L.push(''); }
  if (d.summary) { L.push('PROFESSIONAL SUMMARY'); L.push(d.summary); L.push(''); }
  if ((d.experience || []).length) {
    L.push('EXPERIENCE');
    for (const j of d.experience) {
      L.push(`${j.title || ''} — ${j.company || ''}`);
      L.push([j.dates, j.location].filter(Boolean).join('  ·  '));
      for (const b of j.bullets || []) L.push('• ' + b);
      L.push('');
    }
  }
  if ((d.education || []).length) {
    L.push('EDUCATION');
    for (const e of d.education) {
      L.push(`${e.degree || ''} — ${e.school || ''}`);
      L.push([e.dates, e.note].filter(Boolean).join('  ·  '));
      L.push('');
    }
  }
  if ((d.projects || []).length) {
    L.push('PROJECTS');
    for (const p of d.projects) {
      L.push(p.name || '');
      if (p.description) L.push(p.description);
      for (const b of p.bullets || []) L.push('• ' + b);
      L.push('');
    }
  }
  if ((d.softSkills || []).length) { L.push('SOFT SKILLS'); for (const s of d.softSkills) L.push('• ' + s); L.push(''); }
  if ((d.hardSkills || []).length) { L.push('HARD SKILLS'); for (const s of d.hardSkills) L.push('• ' + s); L.push(''); }
  if ((d.certifications || []).length) {
    L.push('CERTIFICATES & COURSES');
    for (const cert of d.certifications) L.push(`• ${cert.name || ''} — ${cert.issuer || ''}, ${cert.date || ''}`);
    L.push('');
  }
  if ((d.suggestions || []).length) {
    L.push('SUGGESTIONS FOR STRENGTHENING THIS APPLICATION:');
    for (const s of d.suggestions) L.push('• ' + s);
  }
  return L.join('\n');
}

async function genCover() {
  busy[1] = true; renderTab(1);
  try {
    results[1] = await gemini(
      `You are an expert professional cover letter writer.
CRITICAL: Only reference experience and skills that are actually in the resume. Never invent anything.`,
      `Write a tailored, professional cover letter using the resume and job description below.

Structure:
- Date and address block
- Opening: Genuine enthusiasm, specific role and company mention
- Body para 1: Connect strongest relevant experience to key job requirements
- Body para 2: Highlight relevant skills and a real achievement from the resume
- Closing: Clear call to action and professional sign-off

Length: 350–400 words.
Use [Hiring Manager Name] and [Company Name] as placeholders.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`, 2400);
  } catch (e) { results[1] = `Error: ${e.message}`; }
  busy[1] = false; renderTab(1); updateGenAll();
}

async function genInterview() {
  busy[2] = true; renderTab(2);
  try {
    results[2] = await gemini(
      `You are an expert interview coach. Base all answers only on the real experience in the resume. Never fabricate.`,
      `Generate comprehensive interview preparation based on this resume and job description.

Format:

## HR / General Questions
Q1: [question]
Suggested Answer: [answer using real resume experience]

Q2: [question]
Suggested Answer: [answer]

Q3: [question]
Suggested Answer: [answer]

Q4: [question]
Suggested Answer: [answer]

## Behavioral Questions (STAR Method)
Q5: [question]
Suggested Answer: Situation: [...] | Task: [...] | Action: [...] | Result: [...]

Q6: [question]
Suggested Answer: [STAR]

Q7: [question]
Suggested Answer: [STAR]

Q8: [question]
Suggested Answer: [STAR]

## Technical / Role-Specific Questions
Q9: [question]
Suggested Answer: [answer using skills from resume]

Q10: [question]
Suggested Answer: [answer]

Q11: [question]
Suggested Answer: [answer]

Q12: [question]
Suggested Answer: [answer]

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`, 2800);
  } catch (e) { results[2] = `Error: ${e.message}`; }
  busy[2] = false; renderTab(2); updateGenAll();
}

async function generateAll() {
  await genResume();
  await genCover();
  await genInterview();
}

/* ════════════════════════════════════════════════════════════════
   COPY / DOWNLOAD
   ════════════════════════════════════════════════════════════════ */
function copyTab(idx) {
  navigator.clipboard.writeText(results[idx] || '').then(() => {
    const b = $(`cpyBtn${idx}`);
    if (b) { b.textContent = t.app.copied; setTimeout(() => { b.textContent = t.app.copy; }, 2000); }
  }).catch(() => { });
}

function dlTab(idx, name) {
  const blob = new Blob([results[idx] || ''], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ── Parse plain-text resume into structured blocks ── */
const DOC_NAMES = ['Optimized-Resume', 'Cover-Letter', 'Interview-Prep'];

function parseBlocks(text) {
  const blocks = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd();
    const tr = line.trim();
    if (!tr) { blocks.push({ type: 'space' }); continue; }
    // ALL CAPS heading (min 3 chars, letters + basic symbols only)
    const isHeading = /^[A-Z][A-Z0-9\s&/():.,'-]{2,60}$/.test(tr) && tr === tr.toUpperCase() && /[A-Z]{3}/.test(tr);
    const isMdHeading = /^#{1,3}\s/.test(tr);
    if (isHeading || isMdHeading) { blocks.push({ type: 'heading', text: tr.replace(/^#{1,3}\s/, '') }); continue; }
    if (/^[•\-\*]\s/.test(tr)) { blocks.push({ type: 'bullet', text: tr.replace(/^[•\-\*]\s/, '') }); continue; }
    blocks.push({ type: 'para', text: tr });
  }
  return blocks;
}

/* ── Download as formatted PDF ── */
function dlPdf(idx) {
  if (idx === 0 && resumeJSON) { styledResumePdf(resumeJSON); return; }
  genericPdf(idx);
}

/* ── Template dispatcher ── */
function dlPdfTpl(n) {
  if (!resumeJSON) return;
  if (n === 1) classicResumePdf(resumeJSON);
  else if (n === 3) minimalResumePdf(resumeJSON);
  else styledResumePdf(resumeJSON);
}

function dlDocxTpl(n) {
  if (!resumeJSON) return;
  if (n === 1) classicResumeDocx(resumeJSON);
  else if (n === 3) minimalResumeDocx(resumeJSON);
  else styledResumeDocx(resumeJSON);
}

/* Shared DOCX helpers */
function docxSave(docFile, name) {
  window.docx.Packer.toBlob(docFile).then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

/* ── TEMPLATE 1 DOCX — Classic ATS ── */
function classicResumeDocx(dta) {
  const d = window.docx, TAB = d.TabStopPosition.MAX;
  const ch = [];
  const c = dta.contact || {};
  // Name centered
  ch.push(new d.Paragraph({
    alignment: d.AlignmentType.CENTER,
    children: [new d.TextRun({ text: (dta.name || '').toUpperCase(), bold: true, size: 56, font: 'Arial' })]
  }));
  if (dta.title) ch.push(new d.Paragraph({
    alignment: d.AlignmentType.CENTER, spacing: { before: 80 },
    children: [new d.TextRun({ text: dta.title, bold: true, size: 24, font: 'Arial' })]
  }));
  const ct = [c.location, c.email, c.phone, c.linkedin].filter(v => v && String(v).trim()).join('  |  ');
  if (ct) ch.push(new d.Paragraph({
    alignment: d.AlignmentType.CENTER, spacing: { before: 60, after: 200 },
    children: [new d.TextRun({ text: ct, size: 20, font: 'Arial' })]
  }));

  const head = t => ch.push(new d.Paragraph({
    spacing: { before: 280, after: 120 },
    border: { bottom: { color: '1E1E1E', size: 12, style: d.BorderStyle.SINGLE } },
    children: [new d.TextRun({ text: t, bold: true, size: 30, font: 'Arial' })]
  }));
  const bullet = t => ch.push(new d.Paragraph({
    bullet: { level: 0 }, spacing: { after: 50 },
    children: [new d.TextRun({ text: t, size: 21, font: 'Arial' })]
  }));

  if (dta.summary) {
    head('PROFESSIONAL SUMMARY');
    ch.push(new d.Paragraph({ children: [new d.TextRun({ text: dta.summary, size: 21, font: 'Arial' })] }));
  }

  if ((dta.experience || []).length) {
    head('WORK EXPERIENCE');
    for (const j of dta.experience) {
      ch.push(new d.Paragraph({
        spacing: { before: 140 },
        children: [new d.TextRun({ text: j.title || '', bold: true, size: 23, font: 'Arial' })]
      }));
      ch.push(new d.Paragraph({
        tabStops: [{ type: d.TabStopType.RIGHT, position: TAB }], spacing: { after: 80 },
        children: [new d.TextRun({ text: j.company || '', bold: true, size: 21, font: 'Arial' }),
        new d.TextRun({ text: '\t' + (j.dates || ''), bold: true, size: 21, font: 'Arial' })]
      }));
      for (const b of j.bullets || []) bullet(b);
    }
  }

  if ((dta.education || []).length) {
    head('EDUCATION');
    for (const e of dta.education) {
      ch.push(new d.Paragraph({ children: [new d.TextRun({ text: e.degree || '', bold: true, size: 23, font: 'Arial' })] }));
      ch.push(new d.Paragraph({
        tabStops: [{ type: d.TabStopType.RIGHT, position: TAB }], spacing: { after: 100 },
        children: [new d.TextRun({ text: e.school || '', bold: true, size: 21, font: 'Arial' }),
        new d.TextRun({ text: '\t' + [e.dates, e.note].filter(Boolean).join(' · '), size: 21, font: 'Arial' })]
      }));
    }
  }

  const skills = [...(dta.hardSkills || []), ...(dta.softSkills || [])];
  if (skills.length) {
    head('SKILLS');
    for (let i = 0; i < skills.length; i += 4) bullet(skills.slice(i, i + 4).join(', '));
  }

  if ((dta.projects || []).length) {
    head('PROJECTS');
    for (const p of dta.projects) {
      ch.push(new d.Paragraph({ children: [new d.TextRun({ text: p.name || '', bold: true, size: 23, font: 'Arial' })] }));
      if (p.description) ch.push(new d.Paragraph({ spacing: { after: 60 }, children: [new d.TextRun({ text: p.description, size: 21, font: 'Arial' })] }));
      for (const b of p.bullets || []) bullet(b);
    }
  }

  if ((dta.certifications || []).length) {
    head('CERTIFICATIONS');
    for (const cert of dta.certifications) bullet([cert.name, cert.issuer, cert.date].filter(Boolean).join(' — '));
  }

  docxSave(new d.Document({ sections: [{ properties: { page: { margin: { top: 820, bottom: 820, left: 900, right: 900 } } }, children: ch }] }),
    'Optimized-Resume-Classic.docx');
}

/* ── TEMPLATE 3 DOCX — Minimal Modern ── */
function minimalResumeDocx(dta) {
  const d = window.docx, TAB = d.TabStopPosition.MAX;
  const ch = [];
  const c = dta.contact || {};
  ch.push(new d.Paragraph({
    alignment: d.AlignmentType.CENTER,
    children: [new d.TextRun({ text: dta.name || '', bold: true, size: 34, color: '283446', font: 'Calibri' })]
  }));
  const ct = [c.location, c.email, c.phone, c.linkedin].filter(v => v && String(v).trim()).join('   \u2022   ');
  if (ct) ch.push(new d.Paragraph({
    alignment: d.AlignmentType.CENTER, spacing: { after: 220 },
    children: [new d.TextRun({ text: ct, size: 15, color: '828282', font: 'Calibri' })]
  }));

  const head = t => ch.push(new d.Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { color: 'C8C8C8', size: 4, style: d.BorderStyle.SINGLE } },
    children: [new d.TextRun({ text: t.toUpperCase(), bold: true, size: 18, color: '5A5A5A', font: 'Calibri' })]
  }));
  const bullet = t => ch.push(new d.Paragraph({
    bullet: { level: 0 }, spacing: { after: 40 },
    children: [new d.TextRun({ text: t, size: 17, color: '3C3C3C', font: 'Calibri' })]
  }));

  if (dta.summary) {
    head('Professional Summary');
    ch.push(new d.Paragraph({ children: [new d.TextRun({ text: dta.summary, size: 17, color: '3C3C3C', font: 'Calibri' })] }));
  }

  if ((dta.experience || []).length) {
    head('Work Experience');
    for (const j of dta.experience) {
      ch.push(new d.Paragraph({
        tabStops: [{ type: d.TabStopType.RIGHT, position: TAB }], spacing: { before: 120 },
        children: [new d.TextRun({ text: j.title || '', bold: true, size: 20, color: '283446', font: 'Calibri' }),
        new d.TextRun({ text: '\t' + [j.dates, j.location].filter(Boolean).join('  '), bold: true, size: 15, color: '283446', font: 'Calibri' })]
      }));
      ch.push(new d.Paragraph({ spacing: { after: 60 }, children: [new d.TextRun({ text: j.company || '', size: 17, color: '3C3C3C', font: 'Calibri' })] }));
      for (const b of j.bullets || []) bullet(b);
    }
  }

  if ((dta.projects || []).length) {
    head('Projects');
    for (const p of dta.projects) {
      ch.push(new d.Paragraph({ children: [new d.TextRun({ text: p.name || '', bold: true, size: 20, color: '283446', font: 'Calibri' })] }));
      if (p.description) ch.push(new d.Paragraph({ spacing: { after: 40 }, children: [new d.TextRun({ text: p.description, size: 17, color: '3C3C3C', font: 'Calibri' })] }));
      for (const b of p.bullets || []) bullet(b);
    }
  }

  if ((dta.education || []).length) {
    head('Education');
    for (const e of dta.education) {
      ch.push(new d.Paragraph({
        tabStops: [{ type: d.TabStopType.RIGHT, position: TAB }],
        children: [new d.TextRun({ text: e.degree || '', bold: true, size: 20, color: '283446', font: 'Calibri' }),
        new d.TextRun({ text: '\t' + [e.dates, e.note].filter(Boolean).join('  '), size: 15, color: '283446', font: 'Calibri' })]
      }));
      ch.push(new d.Paragraph({ spacing: { after: 80 }, children: [new d.TextRun({ text: e.school || '', size: 17, color: '3C3C3C', font: 'Calibri' })] }));
    }
  }

  const soft = dta.softSkills || [], hard = dta.hardSkills || [];
  if (soft.length || hard.length) {
    head('Skills');
    if (hard.length) ch.push(new d.Paragraph({
      spacing: { after: 60 },
      children: [new d.TextRun({ text: 'Technical: ', bold: true, size: 17, font: 'Calibri' }),
      new d.TextRun({ text: hard.join(', '), size: 17, color: '3C3C3C', font: 'Calibri' })]
    }));
    if (soft.length) ch.push(new d.Paragraph({
      spacing: { after: 60 },
      children: [new d.TextRun({ text: 'Soft: ', bold: true, size: 17, font: 'Calibri' }),
      new d.TextRun({ text: soft.join(', '), size: 17, color: '3C3C3C', font: 'Calibri' })]
    }));
  }

  if ((dta.certifications || []).length) {
    head('Certifications');
    for (const cert of dta.certifications) bullet([cert.name, cert.issuer, cert.date].filter(Boolean).join(' \u2022 '));
  }

  docxSave(new d.Document({ sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children: ch }] }),
    'Optimized-Resume-Minimal.docx');
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATE 1 — CLASSIC ATS
   Centered huge name, centered contact, bold underlined headings
   ══════════════════════════════════════════════════════════════ */
function classicResumePdf(d) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595.28, H = 841.89, M = 52, LW = W - M * 2, CX = W / 2;
  let y = M + 16;
  const BLACK = [15, 15, 15], DARK = [35, 35, 35];
  const pageBreak = h => { if (y + h > H - M) { doc.addPage(); y = M; } };

  /* Name — centered, uppercase, huge */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(32); doc.setTextColor(...BLACK);
  doc.text((d.name || '').toUpperCase(), CX, y, { align: 'center' }); y += 26;

  /* Title — centered bold */
  if (d.title) {
    doc.setFontSize(13);
    doc.text(d.title, CX, y, { align: 'center' }); y += 17;
  }

  /* Contact — centered one line */
  const c = d.contact || {};
  const ct = [c.location, c.email, c.phone, c.linkedin].filter(v => v && String(v).trim()).join('  |  ');
  if (ct) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...DARK);
    doc.text(ct, CX, y, { align: 'center' }); y += 24;
  }

  const head = (txt) => {
    pageBreak(40); y += 12;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...BLACK);
    doc.text(txt, M, y); y += 7;
    doc.setDrawColor(30, 30, 30); doc.setLineWidth(1.6);
    doc.line(M, y, W - M, y); y += 17;
    doc.setFont('helvetica', 'normal');
  };
  const bullets = (arr) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...DARK);
    for (const b of arr || []) {
      const lines = doc.splitTextToSize(b, LW - 18);
      pageBreak(lines.length * 13 + 2);
      doc.text('\u2022', M + 4, y);
      doc.text(lines, M + 18, y);
      y += lines.length * 13;
    }
  };

  if (d.summary) {
    head('PROFESSIONAL SUMMARY');
    doc.setFontSize(10.5); doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(d.summary, LW);
    pageBreak(lines.length * 13);
    doc.text(lines, M, y); y += lines.length * 13 + 4;
  }

  if ((d.experience || []).length) {
    head('WORK EXPERIENCE');
    for (const j of d.experience) {
      pageBreak(44);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...BLACK);
      doc.text(j.title || '', M, y); y += 13;
      doc.setFontSize(10.5);
      doc.text(j.company || '', M, y);
      if (j.dates) doc.text(j.dates, W - M, y, { align: 'right' });
      y += 16;
      bullets(j.bullets);
      y += 10;
    }
  }

  if ((d.education || []).length) {
    head('EDUCATION');
    for (const e of d.education) {
      pageBreak(34);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...BLACK);
      doc.text(e.degree || '', M, y); y += 13;
      doc.setFontSize(10.5);
      doc.text(e.school || '', M, y);
      const right = [e.dates, e.note].filter(Boolean).join(' · ');
      if (right) doc.text(right, W - M, y, { align: 'right' });
      y += 18;
    }
  }

  const skills = [...(d.hardSkills || []), ...(d.softSkills || [])];
  if (skills.length) {
    head('SKILLS');
    // Group into comma lines of ~4
    for (let i = 0; i < skills.length; i += 4) {
      const line = skills.slice(i, i + 4).join(', ');
      const lines = doc.splitTextToSize(line, LW - 18);
      pageBreak(lines.length * 13);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...DARK);
      doc.text('\u2022', M + 4, y);
      doc.text(lines, M + 18, y);
      y += lines.length * 13;
    }
    y += 4;
  }

  if ((d.projects || []).length) {
    head('PROJECTS');
    for (const p of d.projects) {
      pageBreak(30);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...BLACK);
      doc.text(p.name || '', M, y); y += 13;
      if (p.description) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...DARK);
        const lines = doc.splitTextToSize(p.description, LW);
        doc.text(lines, M, y); y += lines.length * 13 + 2;
      }
      bullets(p.bullets); y += 8;
    }
  }

  if ((d.certifications || []).length) {
    head('CERTIFICATIONS');
    for (const cert of d.certifications) {
      pageBreak(14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...DARK);
      const line = [cert.name, cert.issuer, cert.date].filter(Boolean).join(' — ');
      doc.text('\u2022', M + 4, y);
      doc.text(line, M + 18, y);
      y += 14;
    }
  }

  doc.save('Optimized-Resume-Classic.pdf');
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATE 3 — MINIMAL MODERN
   Small centered name, thin gray small-caps headings with lines
   ══════════════════════════════════════════════════════════════ */
function minimalResumePdf(d) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595.28, H = 841.89, M = 56, LW = W - M * 2, CX = W / 2;
  let y = M + 10;
  const SLATE = [40, 52, 70], GRAY = [130, 130, 130], TEXT = [60, 60, 60], LINE = [200, 200, 200];
  const pageBreak = h => { if (y + h > H - M) { doc.addPage(); y = M; } };

  /* Name — centered, medium */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(...SLATE);
  doc.text(d.name || '', CX, y, { align: 'center' }); y += 14;

  /* Contact — centered tiny gray */
  const c = d.contact || {};
  const ct = [c.location, c.email, c.phone, c.linkedin].filter(v => v && String(v).trim()).join('   \u2022   ');
  if (ct) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
    doc.text(ct, CX, y, { align: 'center' }); y += 22;
  }

  const head = (txt) => {
    pageBreak(34); y += 10;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(90, 90, 90);
    doc.text(txt.toUpperCase(), M, y); y += 5;
    doc.setDrawColor(...LINE); doc.setLineWidth(0.7);
    doc.line(M, y, W - M, y); y += 14;
  };
  const bullets = (arr) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
    for (const b of arr || []) {
      const lines = doc.splitTextToSize(b, LW - 12);
      pageBreak(lines.length * 10.5 + 1);
      doc.text('\u2022', M, y);
      doc.text(lines, M + 10, y);
      y += lines.length * 10.5;
    }
  };

  if (d.summary) {
    head('Professional Summary');
    doc.setFontSize(8.5); doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(d.summary, LW);
    pageBreak(lines.length * 10.5);
    doc.text(lines, M, y); y += lines.length * 10.5 + 2;
  }

  if ((d.experience || []).length) {
    head('Work Experience');
    for (const j of d.experience) {
      pageBreak(34);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...SLATE);
      doc.text(j.title || '', M, y); y += 11;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
      doc.text(j.company || '', M, y);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...SLATE);
      const right = [j.dates, j.location].filter(Boolean).join('   ');
      if (right) doc.text(right, W - M, y, { align: 'right' });
      y += 12;
      bullets(j.bullets);
      y += 8;
    }
  }

  if ((d.projects || []).length) {
    head('Projects');
    for (const p of d.projects) {
      pageBreak(24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...SLATE);
      doc.text(p.name || '', M, y); y += 11;
      if (p.description) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
        const lines = doc.splitTextToSize(p.description, LW);
        doc.text(lines, M, y); y += lines.length * 10.5 + 2;
      }
      bullets(p.bullets); y += 6;
    }
  }

  if ((d.education || []).length) {
    head('Education');
    for (const e of d.education) {
      pageBreak(24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...SLATE);
      doc.text(e.degree || '', M, y); y += 11;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
      doc.text(e.school || '', M, y);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...SLATE);
      const right = [e.dates, e.note].filter(Boolean).join('   ');
      if (right) doc.text(right, W - M, y, { align: 'right' });
      y += 14;
    }
  }

  const soft = d.softSkills || [], hard = d.hardSkills || [];
  if (soft.length || hard.length) {
    head('Skills');
    doc.setFontSize(8.5); doc.setTextColor(...TEXT);
    if (hard.length) {
      pageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Technical: ', M, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(hard.join(', '), LW - 50);
      doc.text(lines, M + 46, y); y += lines.length * 10.5 + 3;
    }
    if (soft.length) {
      pageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Soft: ', M, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(soft.join(', '), LW - 30);
      doc.text(lines, M + 26, y); y += lines.length * 10.5 + 3;
    }
  }

  if ((d.certifications || []).length) {
    head('Certifications');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
    for (const cert of d.certifications) {
      pageBreak(11);
      const line = [cert.name, cert.issuer, cert.date].filter(Boolean).join(' \u2022 ');
      doc.text('\u2022 ' + line, M, y);
      y += 11;
    }
  }

  doc.save('Optimized-Resume-Minimal.pdf');
}

/* Styled resume PDF — replicates the original CV design:
   big name, steel-blue title, navy contact bar, navy section
   headings with left ticks, two-column skills                */
function styledResumePdf(d) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595.28, H = 841.89, M = 42, LW = W - M * 2;
  let y = M + 14;

  const NAVY = [27, 42, 74];
  const STEEL = [46, 90, 125];
  const BAR = [26, 35, 53];
  const GRAY = [110, 110, 110];
  const TEXT = [45, 45, 45];

  const pageBreak = (h) => { if (y + h > H - M) { doc.addPage(); y = M; } };

  /* Name */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(26); doc.setTextColor(15, 15, 15);
  doc.text(d.name || '', M, y); y += 18;

  /* Title */
  if (d.title) {
    doc.setFontSize(12); doc.setTextColor(...STEEL);
    doc.text(d.title, M, y); y += 14;
  }

  /* Summary */
  if (d.summary) {
    doc.setFontSize(8.5); doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(d.summary, LW);
    doc.text(lines, M, y); y += lines.length * 10 + 6;
  }

  /* Contact bar (full-width navy) */
  const c = d.contact || {};
  const items = [c.email, c.phone, c.location, c.linkedin].filter(v => v && String(v).trim());
  if (items.length) {
    doc.setFillColor(...BAR);
    doc.rect(0, y - 4, W, 26, 'F');
    doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
    const seg = (W - 40) / items.length;
    items.forEach((it, i) => doc.text(String(it), 20 + i * seg, y + 12));
    y += 38;
  }

  /* Section heading helper */
  const head = (txt) => {
    pageBreak(46); y += 10;
    doc.setDrawColor(90, 90, 90); doc.setLineWidth(1.4);
    doc.line(14, y - 5, 32, y - 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
    doc.text(txt, M, y); y += 17;
    doc.setFont('helvetica', 'normal');
  };

  const bullets = (arr, indent = 12) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TEXT);
    for (const b of arr || []) {
      const lines = doc.splitTextToSize(b, LW - indent - 4);
      pageBreak(lines.length * 11 + 2);
      doc.text('\u2022', M, y);
      doc.text(lines, M + indent, y);
      y += lines.length * 11;
    }
  };

  /* EXPERIENCE */
  if ((d.experience || []).length) {
    head('WORK EXPERIENCE');
    for (const j of d.experience) {
      pageBreak(52);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(25, 25, 25);
      doc.text(j.title || '', M, y); y += 13;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 40, 40);
      doc.text(j.company || '', M, y); y += 11;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...GRAY);
      if (j.dates) doc.text(j.dates, M, y);
      if (j.location) doc.text(j.location, W - M, y, { align: 'right' });
      y += 13;
      bullets(j.bullets);
      y += 9;
    }
  }

  /* EDUCATION */
  if ((d.education || []).length) {
    head('EDUCATION');
    for (const e of d.education) {
      pageBreak(40);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(25, 25, 25);
      doc.text(e.degree || '', M, y); y += 13;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 40, 40);
      doc.text(e.school || '', M, y); y += 11;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...GRAY);
      if (e.dates) doc.text(e.dates, M, y);
      if (e.note) doc.text(e.note, W - M, y, { align: 'right' });
      y += 15;
    }
  }

  /* SKILLS — two columns like the original */
  const soft = d.softSkills || [], hard = d.hardSkills || [];
  if (soft.length || hard.length) {
    pageBreak(60); y += 10;
    const colX = M + LW / 2;
    doc.setDrawColor(90, 90, 90); doc.setLineWidth(1.4);
    doc.line(14, y - 5, 32, y - 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
    doc.text('SOFT SKILLS', M, y);
    doc.text('HARD SKILLS', colX, y);
    y += 15;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TEXT);
    const rows = Math.max(soft.length, hard.length);
    for (let i = 0; i < rows; i++) {
      pageBreak(12);
      if (soft[i]) doc.text('\u2022  ' + soft[i], M, y);
      if (hard[i]) doc.text('\u2022  ' + hard[i], colX, y);
      y += 12;
    }
    y += 6;
  }

  /* PROJECTS */
  if ((d.projects || []).length) {
    head('PROJECTS');
    for (const p of d.projects) {
      pageBreak(40);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(25, 25, 25);
      doc.text(p.name || '', M, y); y += 13;
      if (p.description) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TEXT);
        const lines = doc.splitTextToSize(p.description, LW);
        doc.text(lines, M, y); y += lines.length * 11 + 2;
      }
      bullets(p.bullets);
      y += 9;
    }
  }

  /* CERTIFICATES */
  if ((d.certifications || []).length) {
    head('CERTIFICATIONS');
    for (const cert of d.certifications) {
      pageBreak(26);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(25, 25, 25);
      doc.text(cert.name || '', M, y); y += 11;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GRAY);
      doc.text([cert.issuer, cert.date].filter(Boolean).join(', '), M, y); y += 14;
    }
  }

  doc.save('Optimized-Resume-Navy.pdf');
}

/* Generic PDF for cover letter & interview prep */
function genericPdf(idx) {
  const text = results[idx] || '';
  if (!text) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595.28, M = 50, LW = W - M * 2;
  let y = M;
  const addPageIfNeeded = (h) => { if (y + h > 841.89 - M) { doc.addPage(); y = M; } };
  for (const b of parseBlocks(text)) {
    if (b.type === 'space') { y += 8; continue; }
    if (b.type === 'heading') {
      addPageIfNeeded(30); y += 10;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20, 40, 70);
      doc.text(b.text, M, y); y += 6;
      doc.setDrawColor(0, 160, 140); doc.setLineWidth(1.2);
      doc.line(M, y, M + LW, y); y += 16;
      continue;
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(40, 40, 40);
    const prefix = b.type === 'bullet' ? '\u2022  ' : '';
    const indent = b.type === 'bullet' ? 14 : 0;
    const lines = doc.splitTextToSize(prefix + b.text, LW - indent);
    for (const ln of lines) {
      addPageIfNeeded(14);
      doc.text(ln, M + indent, y);
      y += 13;
    }
    y += 3;
  }
  doc.save(`${DOC_NAMES[idx]}.pdf`);
}

/* ── Download as formatted Word DOCX ── */
async function dlDocx(idx) {
  if (idx === 0 && resumeJSON) { await styledResumeDocx(resumeJSON); return; }
  const text = results[idx] || '';
  if (!text) return;
  const d = window.docx;
  const children = [];

  for (const b of parseBlocks(text)) {
    if (b.type === 'space') { children.push(new d.Paragraph({ text: '' })); continue; }
    if (b.type === 'heading') {
      children.push(new d.Paragraph({
        spacing: { before: 240, after: 120 },
        border: { bottom: { color: '00A88B', size: 8, style: d.BorderStyle.SINGLE } },
        children: [new d.TextRun({ text: b.text, bold: true, size: 26, color: '142846', font: 'Calibri' })],
      }));
      continue;
    }
    if (b.type === 'bullet') {
      children.push(new d.Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new d.TextRun({ text: b.text, size: 21, font: 'Calibri' })],
      }));
      continue;
    }
    children.push(new d.Paragraph({
      spacing: { after: 80 },
      children: [new d.TextRun({ text: b.text, size: 21, font: 'Calibri' })],
    }));
  }

  const docFile = new d.Document({
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 850, right: 850 } } }, children }],
  });
  const blob = await d.Packer.toBlob(docFile);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${DOC_NAMES[idx]}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* Styled resume DOCX — mirrors the original CV design */
async function styledResumeDocx(dta) {
  const d = window.docx;
  const NAVY = '1B2A4A', STEEL = '2E5A7D', BARBG = '1A2335', GRAY = '6E6E6E';
  const ch = [];

  // Name + title
  ch.push(new d.Paragraph({ children: [new d.TextRun({ text: dta.name || '', size: 52, font: 'Calibri', color: '0F0F0F' })] }));
  if (dta.title) ch.push(new d.Paragraph({ spacing: { after: 100 }, children: [new d.TextRun({ text: dta.title, size: 24, color: STEEL, font: 'Calibri' })] }));

  // Summary
  if (dta.summary) ch.push(new d.Paragraph({ spacing: { after: 140 }, children: [new d.TextRun({ text: dta.summary, size: 17, font: 'Calibri', color: '2D2D2D' })] }));

  // Contact bar (shaded paragraph)
  const c = dta.contact || {};
  const items = [c.email, c.phone, c.location, c.linkedin].filter(v => v && String(v).trim());
  if (items.length) {
    ch.push(new d.Paragraph({
      shading: { type: d.ShadingType.SOLID, color: BARBG, fill: BARBG },
      spacing: { before: 60, after: 200 },
      children: [new d.TextRun({ text: '  ' + items.join('      |      ') + '  ', size: 17, color: 'FFFFFF', font: 'Calibri' })],
    }));
  }

  const head = (txt) => ch.push(new d.Paragraph({
    spacing: { before: 260, after: 120 },
    children: [new d.TextRun({ text: txt, bold: true, size: 28, color: NAVY, font: 'Calibri' })],
  }));
  const bullet = (txt) => ch.push(new d.Paragraph({
    bullet: { level: 0 }, spacing: { after: 50 },
    children: [new d.TextRun({ text: txt, size: 18, font: 'Calibri', color: '2D2D2D' })],
  }));

  // Experience
  if ((dta.experience || []).length) {
    head('WORK EXPERIENCE');
    for (const j of dta.experience) {
      ch.push(new d.Paragraph({ spacing: { before: 120 }, children: [new d.TextRun({ text: j.title || '', bold: true, size: 22, font: 'Calibri' })] }));
      ch.push(new d.Paragraph({ children: [new d.TextRun({ text: j.company || '', size: 20, font: 'Calibri' })] }));
      ch.push(new d.Paragraph({ spacing: { after: 80 }, children: [new d.TextRun({ text: [j.dates, j.location].filter(Boolean).join('    ·    '), italics: true, size: 16, color: GRAY, font: 'Calibri' })] }));
      for (const b of j.bullets || []) bullet(b);
    }
  }

  // Education
  if ((dta.education || []).length) {
    head('EDUCATION');
    for (const e of dta.education) {
      ch.push(new d.Paragraph({ children: [new d.TextRun({ text: e.degree || '', bold: true, size: 22, font: 'Calibri' })] }));
      ch.push(new d.Paragraph({ children: [new d.TextRun({ text: e.school || '', size: 20, font: 'Calibri' })] }));
      ch.push(new d.Paragraph({ spacing: { after: 100 }, children: [new d.TextRun({ text: [e.dates, e.note].filter(Boolean).join('    ·    '), italics: true, size: 16, color: GRAY, font: 'Calibri' })] }));
    }
  }

  // Skills two-column table
  const soft = dta.softSkills || [], hard = dta.hardSkills || [];
  if (soft.length || hard.length) {
    head('SKILLS');
    const mkCell = (title, items) => new d.TableCell({
      width: { size: 50, type: d.WidthType.PERCENTAGE },
      borders: { top: { style: d.BorderStyle.NONE }, bottom: { style: d.BorderStyle.NONE }, left: { style: d.BorderStyle.NONE }, right: { style: d.BorderStyle.NONE } },
      children: [
        new d.Paragraph({ children: [new d.TextRun({ text: title, bold: true, size: 22, color: NAVY, font: 'Calibri' })] }),
        ...items.map(s => new d.Paragraph({ bullet: { level: 0 }, children: [new d.TextRun({ text: s, size: 18, font: 'Calibri' })] })),
      ],
    });
    ch.push(new d.Table({
      width: { size: 100, type: d.WidthType.PERCENTAGE },
      borders: { top: { style: d.BorderStyle.NONE }, bottom: { style: d.BorderStyle.NONE }, left: { style: d.BorderStyle.NONE }, right: { style: d.BorderStyle.NONE }, insideHorizontal: { style: d.BorderStyle.NONE }, insideVertical: { style: d.BorderStyle.NONE } },
      rows: [new d.TableRow({ children: [mkCell('SOFT SKILLS', soft), mkCell('HARD SKILLS', hard)] })],
    }));
  }

  // Projects
  if ((dta.projects || []).length) {
    head('PROJECTS');
    for (const p of dta.projects) {
      ch.push(new d.Paragraph({ children: [new d.TextRun({ text: p.name || '', bold: true, size: 22, font: 'Calibri' })] }));
      if (p.description) ch.push(new d.Paragraph({ spacing: { after: 60 }, children: [new d.TextRun({ text: p.description, size: 18, font: 'Calibri' })] }));
      for (const b of p.bullets || []) bullet(b);
    }
  }

  // Certifications
  if ((dta.certifications || []).length) {
    head('CERTIFICATIONS');
    for (const cert of dta.certifications) {
      ch.push(new d.Paragraph({ children: [new d.TextRun({ text: cert.name || '', bold: true, size: 20, font: 'Calibri' })] }));
      ch.push(new d.Paragraph({ spacing: { after: 80 }, children: [new d.TextRun({ text: [cert.issuer, cert.date].filter(Boolean).join(', '), size: 16, color: GRAY, font: 'Calibri' })] }));
    }
  }

  const docFile = new d.Document({ sections: [{ properties: { page: { margin: { top: 700, bottom: 700, left: 820, right: 820 } } }, children: ch }] });
  const blob = await d.Packer.toBlob(docFile);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Optimized-Resume.docx';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ════════════════════════════════════════════════════════════════
   ERROR HELPERS
   ════════════════════════════════════════════════════════════════ */
function showErr(id, msg) { const e = $(id); if (e) { e.textContent = msg; e.classList.remove('hidden'); } }

/* ════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════ */
function init() {
  renderLanding();
  renderAppText();
  updateIndicators();

  $('navBrand').addEventListener('click', restart);
  $('heroCtaBtn').addEventListener('click', showApp);
  $('ctaBandBtn').addEventListener('click', showApp);
  $('restartBtn').addEventListener('click', restart);

  $('tabsBar').addEventListener('click', e => {
    const b = e.target.closest('.tab-btn');
    if (b) renderTab(parseInt(b.dataset.tab));
  });
  $('genAllBtn').addEventListener('click', generateAll);

  initStep1();
  initStep2();
}

document.addEventListener('DOMContentLoaded', init);
