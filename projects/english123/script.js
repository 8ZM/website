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

/* Escapes raw newlines/tabs that models emit inside JSON string values */
function escapeControlChars(s) {
  let out = '', inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\') { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr) {
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') { out += '\\r'; continue; }
      if (ch === '\t') { out += '\\t'; continue; }
      if (ch.charCodeAt(0) < 0x20) continue;   // drop other control chars
    }
    out += ch;
  }
  return out;
}

/* Parses JSON even when the model truncates it or wraps it in prose */
function parseJSON(raw) {
  let s = raw.replace(/```json|```/g, '').trim();
  const start = s.search(/[{[]/);
  if (start === -1) throw new Error('No JSON in response');
  s = escapeControlChars(s.slice(start));

  const lastClose = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (lastClose !== -1) {
    try { return JSON.parse(s.slice(0, lastClose + 1)); } catch { /* try repair below */ }
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

let pauseMs = 8000;          // silence before an answer is accepted; 0 = wait for the Done button
let stopAnswering = null;     // set while listening, called by the Done button

function listenOnce() {
  return new Promise(resolve => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = true;      // keep the mic open through pauses
    recognition.interimResults = true;  // so we can tell speech from silence
    recognition.maxAlternatives = 1;

    let finalText = '';
    let silenceTimer = null;
    let hasSpoken = false;
    let settled = false;

    const showLive = t => {
      const box = $('liveSay');
      if (!box) return;
      if (t.trim()) { box.classList.remove('hidden'); tx('liveSayText', t); }
      else box.classList.add('hidden');
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(silenceTimer);
      stopAnswering = null;
      hi('speakDoneBtn'); hi('pauseHint'); hi('liveSay');
      try { recognition.onend = null; recognition.stop(); } catch { }
      resolve(finalText.trim() || null);
    };

    // Restart the countdown every time new speech arrives
    const resetSilence = () => {
      clearTimeout(silenceTimer);
      if (!hasSpoken || pauseMs === 0) return;   // never auto-cut before they speak
      silenceTimer = setTimeout(finish, pauseMs);
    };

    recognition.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + ' ';
        else interim += r[0].transcript;
      }
      if ((finalText + interim).trim()) {
        hasSpoken = true;
        showLive(finalText + interim);
      }
      resetSilence();
    };

    // Silence is not an error here — just keep waiting
    recognition.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') finish();
    };

    // Chrome ends the session on its own after a pause — restart it
    recognition.onend = () => {
      if (settled) return;
      try { recognition.start(); }
      catch { setTimeout(() => { if (!settled) try { recognition.start(); } catch { finish(); } }, 250); }
    };

    stopAnswering = finish;
    sh('speakDoneBtn');
    const hint = $('pauseHint');
    if (hint) {
      hint.textContent = pauseMs === 0
        ? 'Take all the time you need — tap Done when you finish.'
        : `Take your time. It waits ${pauseMs / 1000} seconds after you stop talking.`;
      hint.classList.remove('hidden');
    }

    try { recognition.start(); } catch { finish(); }
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
  setOrb('Listening — take your time', 'listening');
  const said = await listenOnce();
  if (!speakActive) return;

  hi('speakDoneBtn'); hi('pauseHint'); hi('liveSay');

  if (!said) {
    setOrb('Nothing heard — tap to try again', '');
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
  if (stopAnswering) stopAnswering();
  try { if (recognition) { recognition.onend = null; recognition.stop(); } } catch { }
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
    const y = $('writeReport').getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top: y, behavior: 'smooth' });
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
  tx('quizLoading', 'Writing your questions…');
  tx('quizCount', `0 / ${QUIZ_LEN}`);
  tx('quizScore', '0 correct');
  $('quizProgress').style.width = '0%';

  const system = `You write English practice questions. Return ONLY a JSON array. No markdown, no commentary.`;

  // Worked examples — never placeholder letters, or the model copies them verbatim
  const grammarUser = `Write ${QUIZ_LEN} multiple-choice grammar questions for a ${level} English learner.

Return exactly this shape, with REAL words in every field:
[
  {"prompt":"By the time I arrived, they had already ___ the party.","options":["leave","left","leaving","leaves"],"answer":1,"explain":"After 'had' we use the past participle, so 'left' is correct."},
  {"prompt":"She has been working here ___ 2019.","options":["for","since","from","during"],"answer":1,"explain":"'Since' marks a starting point in time; 'for' marks a length of time."}
]

Rules:
- Every option must be a real word or phrase that could plausibly fill the gap. NEVER output single letters such as "a", "b", "c", "d" as options.
- Exactly 4 different options per question. Only one is correct.
- "answer" is the index (0-3) of the correct option.
- Mark the gap with three underscores: ___
- Cover a mix of tenses, prepositions, articles, conditionals, and word order.
- Do not repeat the two example questions above.`;

  const vocabUser = `Write ${QUIZ_LEN} vocabulary-in-context questions for a ${level} English learner.

Return exactly this shape, with REAL words in every field:
[
  {"prompt":"The manager asked me to ___ the report before Friday's meeting.","options":["submit","admit","permit","commit"],"answer":0,"explain":"'Submit' means to hand something in officially."},
  {"prompt":"Traffic was heavy, so we arrived ___ for the interview.","options":["lately","late","later","latest"],"answer":1,"explain":"'Late' means after the expected time; 'lately' means recently."}
]

Rules:
- Every option must be a real English word. NEVER output single letters such as "a", "b", "c", "d" as options.
- Exactly 4 different options per question. The three wrong ones must be real words that almost fit.
- "answer" is the index (0-3) of the correct option.
- Mark the gap with three underscores: ___
- Use everyday and workplace vocabulary a learner will actually need.
- Do not repeat the two example questions above.`;

  const user = mode === 'grammar' ? grammarUser : vocabUser;

  // Two attempts: junk output on the first try is retried automatically
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (attempt === 2) tx('quizLoading', 'Improving the questions…');
      const raw = await ask(system, user, 2600);
      const arr = parseJSON(raw);
      questions = cleanQuestions(arr);
      if (questions.length >= 3) {
        hi('quizLoading'); sh('quizBody');
        tx('quizCount', `0 / ${questions.length}`);
        renderQuestion();
        return;
      }
    } catch (err) {
      if (attempt === 2) {
        tx('quizLoading', 'Could not build questions. Check your connection and try again.');
        showError(err.message);
        return;
      }
    }
  }
  tx('quizLoading', 'Could not build usable questions. Please try again.');
}

/* Throws out malformed or placeholder questions before they reach the screen */
function cleanQuestions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(q => {
    if (!q || typeof q.prompt !== 'string' || !Array.isArray(q.options)) return false;
    if (q.options.length !== 4) return false;
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) return false;
    if (q.prompt.trim().length < 8) return false;

    const opts = q.options.map(o => String(o ?? '').trim());
    if (opts.some(o => !o)) return false;                              // empty option
    if (new Set(opts.map(o => o.toLowerCase())).size !== 4) return false;  // duplicates
    if (opts.every(o => o.length <= 2)) return false;                  // "a","b","c","d" junk
    if (opts.filter(o => /^[a-d]$/i.test(o)).length >= 2) return false; // letter placeholders
    if (/<[a-z]/i.test(q.prompt)) return false;                        // unfilled <template>
    return true;
  }).map(q => ({
    prompt: q.prompt.trim(),
    options: q.options.map(o => String(o).trim()),
    answer: q.answer,
    explain: String(q.explain || '').trim(),
  }));
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
  document.querySelectorAll('#pausePicker .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#pausePicker .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      pauseMs = +chip.dataset.pause;
    });
  });
  on('speakDoneBtn', 'click', () => { if (stopAnswering) stopAnswering(); });
  document.querySelectorAll('#pauseChoice .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#pauseChoice .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      pauseMs = +chip.dataset.pause;
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
