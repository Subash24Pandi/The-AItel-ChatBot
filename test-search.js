const fs = require('fs');
const path = require('path');

// Copy the KB matching logic from knowledgeBase.js
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

// Load KB
const kbPath = path.join(__dirname, 'server', 'english_version.txt');
const raw = fs.readFileSync(kbPath, 'utf8');
const lines = raw.split('\n');
const KB = [];
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
    KB.push({ q: currentQ, a: answer });
    currentQ = null;
  }
}

console.log('✅ KB loaded:', KB.length, 'Q&A pairs\n');

// Test queries
const testQueries = [
  'What is aitel?',
  'how do i login',
  'login help',
  'reset password',
  'tell me about features',
  'hello'
];

console.log('Testing KB search:\n');

testQueries.forEach(query => {
  console.log(`Query: "${query}"`);
  
  const qTokens = tokenize(query);
  console.log(`  Tokens: ${qTokens.join(', ')}`);
  
  // Find best match
  let bestMatch = null;
  let bestScore = 0;
  
  KB.forEach(entry => {
    const qTokens2 = tokenize(entry.q);
    const jacardScore = jaccard(qTokens, qTokens2);
    
    const normQ1 = normalize(query);
    const normQ2 = normalize(entry.q);
    const levScore = 1 - (levenshtein(normQ1, normQ2) / Math.max(normQ1.length, normQ2.length));
    
    const score = 0.6 * jacardScore + 0.4 * levScore;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { ...entry, score };
    }
  });
  
  console.log(`  Best match score: ${bestScore.toFixed(3)}`);
  if (bestMatch && bestScore > 0.22) {
    console.log(`  ✅ Match found: "${bestMatch.q}"`);
    console.log(`  Answer: ${bestMatch.a.substring(0, 60)}...`);
  } else {
    console.log(`  ❌ No match found (threshold: 0.22)`);
  }
  console.log();
});
