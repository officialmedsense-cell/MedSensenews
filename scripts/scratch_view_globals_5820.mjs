import fs from 'fs';

const content = fs.readFileSync('c:/Users/HomePC/Documents/WEBactivitties/MedSens News/app/(site)/globals.css', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(5820, 5870).join('\n'));
