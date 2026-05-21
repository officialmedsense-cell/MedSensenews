import fs from 'fs';

const content = fs.readFileSync('c:/Users/HomePC/Documents/WEBactivitties/MedSens News/app/(site)/globals.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('--primary') || line.includes('--bg') || line.includes('theme="dark"')) {
    if (index < 200 || line.includes('--primary')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
