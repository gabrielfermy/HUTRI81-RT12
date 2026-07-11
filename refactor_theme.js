const fs = require('fs');
const path = require('path');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(dir + '/' + file);
    if (stat.isDirectory()) {
      getAllFiles(dir + '/' + file, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(dir + '/' + file);
    }
  }
  return fileList;
}

const targetDir = path.join(__dirname, 'src');
const files = getAllFiles(targetDir);

let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace specific shades
  const replaceMap = {
    'red-50': 'primary-50',
    'red-100': 'primary-100',
    'red-200': 'primary-200',
    'red-300': 'primary-300',
    'red-400': 'primary-400',
    'red-450': 'primary-400', // normalize
    'red-500': 'primary-500',
    'red-600': 'primary-600',
    'red-650': 'primary-700', // normalize
    'red-700': 'primary-700',
    'red-800': 'primary-800',
    'red-900': 'primary-900',
    'red-950': 'primary-950',
  };

  // Use a regex that specifically targets these Tailwind utility prefixes
  const prefixes = ['bg-', 'text-', 'border-', 'from-', 'via-', 'to-', 'ring-', 'fill-', 'stroke-', 'shadow-'];
  
  for (const [redShade, primaryShade] of Object.entries(replaceMap)) {
    for (const prefix of prefixes) {
      // e.g. text-red-600 or hover:bg-red-50
      // We need a word boundary or quote boundary before the prefix, and word boundary after shade.
      // E.g., class="bg-red-600" or hover:bg-red-600
      const regex = new RegExp(`(?<=[^a-zA-Z0-9-]|^)(${prefix})${redShade}(?=[^a-zA-Z0-9-]|$)`, 'g');
      content = content.replace(regex, `$1${primaryShade}`);
    }
  }

  // Also catch generic tailwind combinations with arbitrary values if any (e.g. text-[#450A0A] to text-primary-950)
  // I noticed nav used bg-[#450A0A]/95
  content = content.replace(/bg-\[\#450A0A\]/g, 'bg-primary-950');
  content = content.replace(/bg-\[\#7F1D1D\]/g, 'bg-primary-900');

  // Any leftover red-600 not caught by prefix (like just "red-600" inside some logic)?
  // Usually they are attached to prefixes.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Updated:', file);
  }
}

console.log(`Finished refactoring theme. Changed ${changedFiles} files.`);
