// Levenshtein distance for fuzzy matching
function levenshtein(a = '', b = '') {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

const fs = require('fs');
const path = require('path');

let KB = [];
let chunks = [];

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','else','when','where','who','what','why','how',
  'do','does','did','i','me','my','you','your','we','our','us','is','am','are','was','were',
  'to','of','in','on','at','for','from','with','about','into','over','under','it','this','that',
  'can','could','should','would','will','shall','may','might','must','please'
]);

function tokenize(text = '') {
  return normalize(text)
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean)
    .filter(t => t.length >= 2)
    .filter(t => !STOPWORDS.has(t));
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (!a.size || !b.size) return 0;

  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 0;
}

function parseKnowledgeFile(rawText) {
  const lines = rawText.split(/\r?\n/);
  const entries = [];
  let currentQ = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^q\s*:/i.test(line)) {
      currentQ = line.replace(/^q\s*:/i, '').trim();
      continue;
    }

    if (/^a\s*:/i.test(line) && currentQ) {
      const answer = line.replace(/^a\s*:/i, '').trim();
      entries.push({ q: currentQ, a: answer });
      currentQ = null;
    }
  }
  return entries;
}

function trainKnowledgeBase() {
  try {
    const kbPath = path.join(__dirname, '..', 'knowledge', 'english_version.txt');
    if (!fs.existsSync(kbPath)) {
      console.log('⚠️ Knowledge file not found:', kbPath);
      KB.length = 0;
      chunks.length = 0;
      return;
    }

    const raw = fs.readFileSync(kbPath, 'utf8');
    const entries = parseKnowledgeFile(raw);

    KB.length = 0;
    KB.push(...entries);

    chunks.length = 0;
    chunks.push(...KB.map(e => `Q: ${e.q}\nA: ${e.a}`));

    console.log(`📚 KB loaded: ${KB.length}`);
  } catch (e) {
    console.log('❌ KB train error:', e.message);
    KB.length = 0;
    chunks.length = 0;
  }
}

function getKbCount() {
  return KB.length;
}

function retrieveScored(query, topK = 5) {
  const qTokens = tokenize(query);
  if (!qTokens.length || !KB.length) return [];

  // Fuzzy match: also compute Levenshtein distance between normalized questions
  const normQuery = normalize(query);

  const scored = KB.map(item => {
    const qDocTokens = tokenize(item.q);
    const aDocTokens = tokenize(item.a);

    const scoreQ = jaccard(qTokens, qDocTokens);
    const scoreA = jaccard(qTokens, aDocTokens);
    const score = (0.75 * scoreQ) + (0.25 * scoreA);

    // Levenshtein distance (lower is better)
    const normQ = normalize(item.q);
    const levDist = levenshtein(normQuery, normQ);
    // Normalize Levenshtein to similarity (1 - dist/maxLen)
    const maxLen = Math.max(normQuery.length, normQ.length) || 1;
    const levSim = 1 - levDist / maxLen;

    // Overlap with QUESTION tokens only (strict)
    const overlap = qTokens.filter(t => qDocTokens.includes(t));
    const overlapCount = new Set(overlap).size;

    // Combine scores: prioritize Jaccard, but boost if Levenshtein is high
    const finalScore = (0.7 * score) + (0.3 * levSim);

    return { item, score: finalScore, overlapCount };
  });

  scored.sort((a, b) => b.score - a.score);

  // Stricter baseline to avoid false matches.
  // For longer questions, require more overlap.
  const qLen = qTokens.length;
  const MIN_SCORE = 0.24;
  const MIN_OVERLAP = qLen >= 6 ? 3 : 2;

  return scored
    .filter(s => s.score >= MIN_SCORE && s.overlapCount >= MIN_OVERLAP)
    .slice(0, topK)
    .map(s => ({ chunk: `Q: ${s.item.q}\nA: ${s.item.a}`, score: s.score }));
}

function retrieve(query, topK = 5) {
  return retrieveScored(query, topK).map(x => x.chunk);
}

function getBestAnswer(query) {
  const r = retrieveScored(query, 1);
  if (!r.length) return { answer: null, confidence: 0 };

  const { chunk, score } = r[0];
  const answerLine = chunk.split('\n').find(l => /^a\s*:/i.test(l.trim()));
  const answer = answerLine ? answerLine.replace(/^a\s*:/i, '').trim() : null;
  return { answer, confidence: answer ? score : 0 };
}

function classifyIntent(message = '') {
  const m = normalize(message);

  if (
    m.includes('pricing') || m.includes('price') || m.includes('quote') || m.includes('cost') ||
    m.includes('plan') || m.includes('package') || m.includes('subscription') ||
    m.includes('buy') || m.includes('purchase') || m.includes('billing') || m.includes('amount')
  ) return 'sales_marketing';

  if (
    m.includes('prompt') || m.includes('instruction') || m.includes('model') ||
    m.includes('llm') || m.includes('integration') || m.includes('api')
  ) return 'engineers';

  return 'aitelsupport';
}

module.exports = {
  trainKnowledgeBase,
  getKbCount,
  getBestAnswer,
  retrieve,
  classifyIntent,
  KB,
  chunks
};
