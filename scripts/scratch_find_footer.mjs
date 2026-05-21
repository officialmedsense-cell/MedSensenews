import fs from 'fs';
import path from 'path';

const globalsCssPath = 'c:/Users/HomePC/Documents/WEBactivitties/MedSens News/app/(site)/globals.css';
const content = fs.readFileSync(globalsCssPath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('footer')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
