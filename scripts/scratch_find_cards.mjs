import fs from 'fs';

const content = fs.readFileSync('c:/Users/HomePC/Documents/WEBactivitties/MedSens News/app/(site)/globals.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('.bbc-article-card') || line.includes('.bbc-small-card') || line.includes('.bbc-list-card') || line.includes('.bbc-featured-card')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
    // Print next 5 lines
    for (let i = 1; i <= 6; i++) {
      if (lines[index + i]) {
        console.log(`  +${i}: ${lines[index + i].trim()}`);
      }
    }
  }
});
