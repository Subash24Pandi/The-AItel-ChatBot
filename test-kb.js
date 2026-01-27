const fs = require('fs');
const path = require('path');

console.log('Testing KB loading...\n');

// Test from server directory perspective
const serverDir = path.join(__dirname, 'server');
const kbPath = path.join(serverDir, 'english_version.txt');

console.log('Server directory:', serverDir);
console.log('KB path:', kbPath);
console.log('File exists:', fs.existsSync(kbPath));

if (fs.existsSync(kbPath)) {
  const content = fs.readFileSync(kbPath, 'utf8');
  const lines = content.split('\n');
  const qCount = lines.filter(l => /^q\s*:/i.test(l.trim())).length;
  
  console.log('\n✅ KB file loaded successfully');
  console.log('Q&A pairs found:', qCount);
  console.log('\nFirst 300 characters:');
  console.log(content.substring(0, 300));
  console.log('\n---');
} else {
  console.log('\n❌ KB file not found!');
}
