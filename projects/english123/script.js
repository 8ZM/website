/* ════════════════════════════════════════════════════════════════
   Fluent — English practice · script.js
   Powered by Groq

   ┌──────────────────────────────────────────────────────────────┐
   │  API CONFIGURATION — pick ONE                                 │
   │                                                                │
   │  OPTION A (production, key stays secret):                     │
   │    Deploy the Cloudflare Worker proxy and put its URL in      │
   │    API_PROXY_URL. Leave GROQ_API_KEY empty.                   │
   │                                                                │
   │  OPTION B (local testing only — key visible to visitors):     │
   │    Put your gsk_ key in GROQ_API_KEY, leave the proxy empty.  │
   └──────────────────────────────────────────────────────────────┘ */

const API_PROXY_URL = 'https://groq-proxy.mishary-fgh.workers.dev/';   // e.g. 'https://groq-proxy.yourname.workers.dev'
const GROQ_API_KEY = '';   // local testing only — never commit a real key

/* ════════════════════════════════════════════════════════════════
   GROQ API
   ════════════════════════════════════════════════════════════════ */
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
let groqModel = null;

async function aiChat(system, messages, maxTok = 900) {
  if (!API_PROXY_URL && !GROQ_API_KEY) {
    throw new Error('API key not configured. Contact the site owner.');
  }
  const models = groqModel ? [groqModel, ...GROQ_MODELS.filter(m => m !== groqModel)] : GROQ_MODELS;
  let lastErr = null;

  for (const model of models) {
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
            messages: [{ role: 'system', content: system }, ...messages],
            max_tokens: maxTok,
            temperature: 0.6,
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
        return d.choices?.[0]?.message?.content || '';
      } catch (err) {
        lastErr = err;
        if (err.status === 429 && attempt === 0) {
          await new Promise(r => setTimeout(r, 2500));
          continue;
        }
        if ([400, 404, 429, 503].includes(err.status)) { groqModel = null; break; }
        throw err;
      }
    }
  }
  throw lastErr || new Error('No model available');
}

const ask = (system, user, maxTok) => aiChat(system, [{ role: 'user', content: user }], maxTok);

/* Parses JSON even when the model truncates or wraps it */
function parseJSON(raw) {
  let s = raw.replace(/```json|```/g, '').trim();
  const start = s.search(/[{[]/);
  if (start === -1) throw new Error('No JSON in response');
  s = s.slice(start);
  const lastClose = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (lastClose !== -1) {
    try { return JSON.parse(s.slice(0, lastClose + 1)); } catch { /* fall through */ }
  }
  // Track open brackets on a stack so they close in the right order
  let inStr = false, esc = false;
  const stack = [];
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }
  let fixed = s;
  if (inStr) fixed += '"';
  fixed = fixed.replace(/,\s*$/, '').replace(/,\s*"[^"]*$/, '');
  while (stack.length) fixed += stack.pop() === '{' ? '}' : ']';
  return JSON.parse(fixed);
}

/* ════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const tx = (id, v) => { const e = $(id); if (e) e.textContent = v; };
const sh = id => { const e = $(id); if (e) e.classList.remove('hidden'); };
const hi = id => { const e = $(id); if (e) e.classList.add('hidden'); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };

let level = 'Intermediate';

function showError(msg) {
  const e = $('globalError');
  if (!e) return;
  e.textContent = msg;
  e.classList.remove('hidden');
  setTimeout(() => e.classList.add('hidden'), 6000);
}

const VIEWS = ['homeView', 'speakView', 'writeView', 'quizView'];
function showView(id) {
  VIEWS.forEach(v => (v === id ? sh(v) : hi(v)));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
  endSpeaking();
  showView('homeView');
}

/* ════════════════════════════════════════════════════════════════
   1 · SPEAK
   ════════════════════════════════════════════════════════════════ */
let speakTopic = '';
let speakHistory = [];
let speakSystem = '';
let speakActive = false;
let recognition = null;
let ttsVoice = null;
let scoreLog = [];

function voiceSupported() {
  return ('speechSynthesis' in window) && (window.SpeechRecognition || window.webkitSpeechRecognition);
}

function pickVoice() {
  const v = speechSynthesis.getVoices();
  return v.find(x => /en[-_]US/i.test(x.lang) && /Google|Microsoft|Samantha/i.test(x.name))
    || v.find(x => /^en/i.test(x.lang)) || v[0] || null;
}
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => { ttsVoice = pickVoice(); };
}

function speak(text) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    if (!ttsVoice) ttsVoice = pickVoice();
    if (ttsVoice) u.voice = ttsVoice;
    u.rate = level === 'Beginner' ? 0.86 : 0.97;
    u.onend = resolve;
    u.onerror = resolve;
    speechSynthesis.speak(u);
  });
}

function listenOnce() {
  return new Promise(resolve => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    let got = false;
    recognition.onresult = e => { got = true; resolve(e.results[0][0].transcript); };
    recognition.onerror = () => { if (!got) resolve(null); };
    recognition.onend = () => { if (!got) resolve(null); };
    try { recognition.start(); } catch { resolve(null); }
  });
}

function setOrb(status, mode) {
  tx('speakStatus', status);
  const orb = $('speakOrb');
  const icon = $('orbIcon');
  if (orb) {
    orb.classList.remove('speaking', 'listening', 'thinking');
    if (mode) orb.classList.add(mode);
  }
  if (icon) icon.textContent = mode === 'listening' ? '🎤' : mode === 'thinking' ? '💭' : '🎧';
}

function addTurn(who, text) {
  const box = $('speakTranscript');
  if (!box) return;
  const row = document.createElement('div');
  row.className = 't-row ' + (who === 'ai' ? 't-ai' : 't-me');
  row.innerHTML = `<span class="t-who">${who === 'ai' ? 'Partner' : 'You'}</span><p>${esc(text)}</p>`;
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

function setMeter(score, grammar, vocab, fluency) {
  const marker = $('meterMarker');
  const val = $('meterValue');
  if (marker) {
    marker.style.left = Math.max(0, Math.min(100, score)) + '%';
    marker.classList.remove('good', 'bad');
    if (score >= 75) marker.classList.add('good');
    else if (score < 50) marker.classList.add('bad');
  }
  if (val) {
    val.textContent = score;
    val.style.color = score >= 75 ? 'var(--good)' : score < 50 ? 'var(--bad)' : 'var(--gold)';
  }
  tx('subGrammar', grammar);
  tx('subVocab', vocab);
  tx('subFluency', fluency);
}

function renderCorrections(fixes) {
  const body = $('correctionBody');
  if (!body) return;
  if (!fixes || !fixes.length) {
    body.innerHTML = `<p class="fix-empty">✓ Nothing to fix — that sentence was correct.</p>`;
  } else {
    body.innerHTML = fixes.map(f => `
      <div class="fix-row">
        <p class="fix-line">
          <span class="fix-wrong">${esc(f.wrong || '')}</span>
          &nbsp;→&nbsp;
          <span class="fix-right">${esc(f.right || '')}</span>
        </p>
        ${f.why ? `<p class="fix-why">${esc(f.why)}</p>` : ''}
      </div>`).join('');
  }
  sh('correctionPanel');
}

async function startSpeaking() {
  if (!voiceSupported()) {
    showError('Speaking needs Chrome or Edge with microphone access.');
    return;
  }
  try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { showError('Allow microphone access to practise speaking.'); return; }

  speakActive = true;
  speakHistory = [];
  scoreLog = [];
  hi('speakSetup'); sh('speakLive');
  $('speakTranscript').innerHTML = '';
  hi('correctionPanel');
  setMeter(0, '—', '—', '—');
  $('meterValue').textContent = '—';
  setOrb('Connecting…', 'thinking');

  speakSystem = `You are a warm, encouraging English conversation partner for a ${level} learner. Topic: ${speakTopic}.

RULES:
- Speak naturally, like a friendly person — not a teacher lecturing.
- Keep every turn SHORT: max 35 words. It will be read aloud.
- Ask exactly one question per turn to keep the conversation going.
- Plain text only: no markdown, no lists, no emojis, no stage directions.
- Match your vocabulary to a ${level} learner.
- Never correct the learner in your spoken reply — corrections are handled separately.`;

  try {
    const opening = await aiChat(speakSystem, [{ role: 'user', content: 'Start the conversation with a greeting and your first question.' }], 120);
    speakHistory = [
      { role: 'user', content: 'Start the conversation.' },
      { role: 'assistant', content: opening },
    ];
    await partnerSays(opening);
  } catch (err) {
    setOrb('Could not connect', '');
    showError(err.message);
  }
}

async function partnerSays(text) {
  if (!speakActive) return;
  addTurn('ai', text);
  setOrb('Partner is speaking…', 'speaking');
  await speak(text);
  if (!speakActive) return;
  await hearLearner();
}

async function hearLearner() {
  if (!speakActive) return;
  hi('speakMicBtn');
  setOrb('Listening — speak now', 'listening');
  const said = await listenOnce();
  if (!speakActive) return;

  if (!said) {
    setOrb('Did not catch that', '');
    sh('speakMicBtn');
    return;
  }

  addTurn('me', said);
  setOrb('Thinking…', 'thinking');
  speakHistory.push({ role: 'user', content: said });

  // Score + reply in parallel
  const scoring = ask(
    `You are an English assessor. Score a ${level} learner's spoken sentence. Return ONLY JSON, no markdown:
{"overall":<0-100>,"grammar":<0-100>,"vocabulary":<0-100>,"fluency":<0-100>,"fixes":[{"wrong":"<their exact words>","right":"<corrected words>","why":"<max 12 words>"}]}
Rules: judge only what they said. "fixes" holds at most 3 items and is empty when the sentence is already correct. Speech-to-text may drop punctuation — never treat missing punctuation as an error.`,
    `Learner said: "${said}"`,
    500
  );

  const replying = aiChat(speakSystem, speakHistory, 120);

  try {
    const [scoreRaw, reply] = await Promise.all([scoring, replying]);
    try {
      const s = parseJSON(scoreRaw);
      scoreLog.push(s.overall || 0);
      setMeter(s.overall ?? 0, s.grammar ?? '—', s.vocabulary ?? '—', s.fluency ?? '—');
      renderCorrections(s.fixes);
    } catch { /* keep the conversation alive even if scoring fails */ }

    speakHistory.push({ role: 'assistant', content: reply });
    await partnerSays(reply);
  } catch (err) {
    setOrb('Connection problem', '');
    showError(err.message);
    sh('speakMicBtn');
  }
}

function endSpeaking() {
  speakActive = false;
  try { recognition && recognition.stop(); } catch { }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  hi('speakLive'); sh('speakSetup');
}

/* ════════════════════════════════════════════════════════════════
   2 · WRITE
   ════════════════════════════════════════════════════════════════ */
let writeType = 'general';
let writeTask = '';
let wordTarget = 120;

function countWords(s) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function updateWordCount() {
  const n = countWords($('writeArea').value);
  const el = $('wordCount');
  el.textContent = `${n} / ${wordTarget} words`;
  el.classList.toggle('hit', n >= wordTarget);
}

async function getWriteTask() {
  const btn = $('writeGetTaskBtn');
  btn.disabled = true;
  btn.textContent = 'Writing a task…';
  try {
    const kind = writeType === 'email'
      ? 'a realistic email-writing task (state who the email is to and what it must achieve)'
      : 'a general writing prompt on an everyday or opinion topic';
    const task = await ask(
      `You write short, clear English practice tasks. Reply with the task only — no preamble, no quotes, no markdown.`,
      `Write ${kind} for a ${level} English learner. The learner will write about ${wordTarget} words. Keep the task under 45 words.`,
      200
    );
    writeTask = task.trim();
    tx('writeTaskTag', writeType === 'email' ? 'Email task' : 'Writing task');
    tx('writeTaskText', writeTask);
    $('writeArea').value = '';
    updateWordCount();
    hi('writeReport');
    hi('writeSetup');
    sh('writeWork');
  } catch (err) {
    showError(err.message);
  }
  btn.disabled = false;
  btn.textContent = 'Give me a task';
}

async function submitWriting() {
  const text = $('writeArea').value.trim();
  if (countWords(text) < 20) {
    showError('Write at least 20 words before submitting.');
    return;
  }
  const btn = $('writeSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Reviewing…';

  try {
    const raw = await ask(
      `You are an English writing examiner for a ${level} learner. Return ONLY JSON, no markdown:
{"overall":<0-100>,"grammar":<0-100>,"vocabulary":<0-100>,"structure":<0-100>,
 "errors":[{"wrong":"<exact text from their writing>","right":"<correction>","why":"<max 14 words>"}],
 "strengths":["<point>","<point>"],
 "improve":["<point>","<point>"],
 "rewrite":"<their text rewritten correctly, same meaning and length>"}
Include up to 8 errors, most important first. Be encouraging but accurate.`,
      `TASK: ${writeTask}\nWORD TARGET: ${wordTarget}\nACTUAL WORDS: ${countWords(text)}\n\nLEARNER'S WRITING:\n${text}`,
      2200
    );
    const r = parseJSON(raw);
    const col = n => n >= 75 ? 'var(--good)' : n < 50 ? 'var(--bad)' : 'var(--gold)';

    $('writeReportBody').innerHTML = `
      <div class="score-strip">
        <div class="score-box"><span class="n" style="color:${col(r.overall)}">${r.overall ?? '—'}</span><span class="l">Overall</span></div>
        <div class="score-box"><span class="n" style="color:${col(r.grammar)}">${r.grammar ?? '—'}</span><span class="l">Grammar</span></div>
        <div class="score-box"><span class="n" style="color:${col(r.vocabulary)}">${r.vocabulary ?? '—'}</span><span class="l">Vocabulary</span></div>
        <div class="score-box"><span class="n" style="color:${col(r.structure)}">${r.structure ?? '—'}</span><span class="l">Structure</span></div>
      </div>

      <div class="report-sec">
        <h4>Corrections</h4>
        ${(r.errors && r.errors.length) ? r.errors.map(e => `
          <div class="fix-row">
            <p class="fix-line"><span class="fix-wrong">${esc(e.wrong || '')}</span> → <span class="fix-right">${esc(e.right || '')}</span></p>
            ${e.why ? `<p class="fix-why">${esc(e.why)}</p>` : ''}
          </div>`).join('') : `<p class="fix-empty">✓ No errors found. Well done.</p>`}
      </div>

      ${(r.strengths && r.strengths.length) ? `
      <div class="report-sec">
        <h4>What worked</h4>
        <ul>${r.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>` : ''}

      ${(r.improve && r.improve.length) ? `
      <div class="report-sec">
        <h4>Work on next</h4>
        <ul>${r.improve.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>` : ''}

      ${r.rewrite ? `
      <div class="report-sec">
        <h4>Corrected version</h4>
        <div class="rewrite-box">${esc(r.rewrite)}</div>
      </div>` : ''}
    `;
    sh('writeReport');
    $('writeReport').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showError(err.message);
  }
  btn.disabled = false;
  btn.textContent = 'Submit for review';
}

/* ════════════════════════════════════════════════════════════════
   3 & 4 · GRAMMAR + VOCABULARY QUIZ
   ════════════════════════════════════════════════════════════════ */
let quizMode = 'grammar';
let questions = [];
let qIndex = 0;
let qCorrect = 0;
const QUIZ_LEN = 8;

async function startQuiz(mode) {
  quizMode = mode;
  questions = []; qIndex = 0; qCorrect = 0;
  tx('quizTitle', mode === 'grammar' ? 'Grammar' : 'Vocabulary');
  showView('quizView');
  sh('quizLoading'); hi('quizBody'); hi('quizDone');
  tx('quizCount', `0 / ${QUIZ_LEN}`);
  tx('quizScore', '0 correct');
  $('quizProgress').style.width = '0%';

  const system = mode === 'grammar'
    ? `You write English grammar practice questions. Return ONLY a JSON array, no markdown.`
    : `You write English vocabulary-in-context questions. Return ONLY a JSON array, no markdown.`;

  const user = mode === 'grammar'
    ? `Write ${QUIZ_LEN} multiple-choice grammar questions for a ${level} learner.
Format: [{"prompt":"<sentence with a blank shown as ___ , or a short grammar question>","options":["a","b","c","d"],"answer":<0-3>,"explain":"<why the answer is right, max 22 words>"}]
Cover a mix of tenses, prepositions, articles, conditionals, and word order. Exactly 4 options each. Make the wrong options plausible.`
    : `Write ${QUIZ_LEN} vocabulary questions for a ${level} learner.
Format: [{"prompt":"<a natural sentence with one word replaced by ___>","options":["a","b","c","d"],"answer":<0-3>,"explain":"<what the correct word means and why it fits, max 22 words>"}]
Each question gives one sentence with a single gap and 4 word choices. The wrong options must be real words that almost fit. Use useful everyday and workplace vocabulary.`;

  try {
    const raw = await ask(system, user, 2600);
    const arr = parseJSON(raw);
    questions = (Array.isArray(arr) ? arr : []).filter(q =>
      q && q.prompt && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === 'number');
    if (!questions.length) throw new Error('Could not build questions. Try again.');
    hi('quizLoading'); sh('quizBody');
    renderQuestion();
  } catch (err) {
    tx('quizLoading', err.message);
    showError(err.message);
  }
}

function renderQuestion() {
  const q = questions[qIndex];
  if (!q) return finishQuiz();

  tx('quizCount', `${qIndex + 1} / ${questions.length}`);
  $('quizProgress').style.width = ((qIndex) / questions.length * 100) + '%';

  $('quizPrompt').innerHTML = esc(q.prompt).replace(/_{2,}/g, '<span class="gap">____</span>');

  const box = $('quizOptions');
  box.innerHTML = '';
  q.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="opt-key">${'ABCD'[i]}</span><span>${esc(opt)}</span>`;
    b.addEventListener('click', () => answerQuestion(i));
    box.appendChild(b);
  });

  hi('quizExplain');
  hi('quizNextBtn');
}

function answerQuestion(picked) {
  const q = questions[qIndex];
  const buttons = [...$('quizOptions').children];
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add('correct');
    else if (i === picked) b.classList.add('wrong');
  });

  const right = picked === q.answer;
  if (right) qCorrect++;
  tx('quizScore', `${qCorrect} correct`);

  const ex = $('quizExplain');
  ex.innerHTML = `<strong>${right ? 'Correct.' : 'Not quite.'}</strong> ${esc(q.explain || '')}`;
  sh('quizExplain');

  $('quizNextBtn').textContent = qIndex + 1 >= questions.length ? 'See results' : 'Next question';
  sh('quizNextBtn');
}

function nextQuestion() {
  qIndex++;
  if (qIndex >= questions.length) finishQuiz();
  else renderQuestion();
}

function finishQuiz() {
  hi('quizBody'); sh('quizDone');
  $('quizProgress').style.width = '100%';
  const pct = Math.round(qCorrect / questions.length * 100);
  tx('quizFinalScore', `${qCorrect} / ${questions.length}`);
  tx('quizFinalNote',
    pct >= 85 ? 'Excellent work. Try the next level up.' :
      pct >= 60 ? 'Solid. Read the explanations you missed and go again.' :
        'Keep going — the explanations are where the learning happens.');
}

/* ════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════ */
function init() {
  // Level picker
  document.querySelectorAll('.lvl-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.lvl-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      level = b.dataset.level;
    });
  });

  // Mode cards
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      const m = card.dataset.mode;
      if (m === 'speak') { showView('speakView'); sh('speakSetup'); hi('speakLive'); }
      else if (m === 'write') { showView('writeView'); sh('writeSetup'); hi('writeWork'); }
      else startQuiz(m === 'grammar' ? 'grammar' : 'vocab');
    });
  });

  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', goHome));
  on('brandHome', 'click', goHome);

  // Speak
  document.querySelectorAll('#speakTopics .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#speakTopics .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      speakTopic = chip.dataset.topic;
      $('speakStartBtn').disabled = false;
    });
  });
  on('speakStartBtn', 'click', startSpeaking);
  on('speakEndBtn', 'click', endSpeaking);
  on('speakMicBtn', 'click', hearLearner);
  if (!voiceSupported()) {
    tx('speakSupportNote', 'Speaking needs Chrome or Edge. The other three modes work everywhere.');
  }

  // Write
  document.querySelectorAll('[data-wtype]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-wtype]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      writeType = chip.dataset.wtype;
    });
  });
  on('wordTarget', 'input', e => {
    wordTarget = +e.target.value;
    tx('wordTargetOut', `${wordTarget} words`);
    if ($('writeArea')) updateWordCount();
  });
  on('writeGetTaskBtn', 'click', getWriteTask);
  on('writeArea', 'input', updateWordCount);
  on('writeSubmitBtn', 'click', submitWriting);
  on('writeNewTaskBtn', 'click', () => { hi('writeWork'); sh('writeSetup'); });

  // Quiz
  on('quizNextBtn', 'click', nextQuestion);
  on('quizAgainBtn', 'click', () => startQuiz(quizMode));
}

document.addEventListener('DOMContentLoaded', init);
