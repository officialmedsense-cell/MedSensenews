import fs from 'fs';

const content = fs.readFileSync('c:/Users/HomePC/Documents/WEBactivitties/MedSens News/app/(site)/page.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('health') || line.toLowerCase().includes('insights') || line.toLowerCase().includes('h2') || line.toLowerCase().includes('section')) {
    if (index < 200 || line.includes('h2') || line.includes('section')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
