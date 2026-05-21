import fs from 'fs';

const content = fs.readFileSync('c:/Users/HomePC/Documents/WEBactivitties/MedSens News/app/(site)/globals.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('header-visible') || line.includes('header-hidden') || line.includes('smart-header') || line.includes('is-scrolled') || line.includes('navbar-logo-row')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
