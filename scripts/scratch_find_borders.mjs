import fs from 'fs';

const content = fs.readFileSync('c:/Users/HomePC/Documents/WEBactivitties/MedSens News/app/(site)/globals.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('border') && (line.includes('card') || line.includes('bbc-article-card') || line.includes('additional-coverage-item'))) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
