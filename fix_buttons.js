const fs = require('fs');
const path = require('path');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(dir + '/' + file);
    if (stat.isDirectory()) {
      fileList = getAllFiles(dir + '/' + file, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(dir + '/' + file);
    }
  }
  return fileList;
}

const filesToFix = [...getAllFiles('./src/app'), ...getAllFiles('./src/components')];

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We only replace inside className="..."
  // Match both className="..." and className={'...'} and className={`...`}
  // For simplicity, let's just do a simple replacement for the specific bad button classes that exist.
  // Instead of complex regex, let's just target the specific strings we saw.
  
  content = content.replace(/bg-red-650/g, 'bg-red-600');
  content = content.replace(/bg-slate-850/g, 'bg-slate-200');

  // We want to replace text-slate-900 with text-white IF there is a bg-red-600, etc.
  content = content.replace(/className=(["'{`])([^"'{`]*?)(bg-red-600|bg-red-500|bg-emerald-600|bg-blue-600|bg-slate-900)([^"'{`]*?)text-slate-900([^"'{`]*?)(["'}`])/g, 'className=$1$2$3$4text-white$5$6');
  
  // also if text-slate-900 is BEFORE the bg-color
  content = content.replace(/className=(["'{`])([^"'{`]*?)text-slate-900([^"'{`]*?)(bg-red-600|bg-red-500|bg-emerald-600|bg-blue-600|bg-slate-900)([^"'{`]*?)(["'}`])/g, 'className=$1$2text-white$3$4$5$6');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed buttons in:', file);
  }
});
console.log('done fixing button contrast');
