import fs from 'fs';

const content = fs.readFileSync('c:/Users/HomePC/Documents/WEBactivitties/MedSens News/app/(site)/globals.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('sticky') || line.includes('fixed') || line.includes('nav')) {
    if (index < 1000 || line.includes('sticky') || line.includes('fixed')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
