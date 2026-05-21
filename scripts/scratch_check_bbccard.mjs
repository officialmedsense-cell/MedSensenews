import fs from 'fs';

const content = fs.readFileSync('c:/Users/HomePC/Documents/WEBactivitties/MedSens News/components/BbcCard.js', 'utf8');
console.log(content.slice(0, 1500));
