const fs = require('fs');

// Fix Layout
let layoutPath = './src/app/kepanitiaan/layout.tsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
layoutContent = layoutContent.replace(/bg-\[#070A13\]/g, 'bg-slate-50');
layoutContent = layoutContent.replace(/bg-slate-950/g, 'bg-white');
layoutContent = layoutContent.replace(/border-slate-800/g, 'border-slate-200');
layoutContent = layoutContent.replace(/bg-slate-900\/10/g, 'bg-slate-50');
layoutContent = layoutContent.replace(/bg-slate-900\/60/g, 'bg-white');
layoutContent = layoutContent.replace(/border-slate-900\/60/g, 'border-slate-200');
layoutContent = layoutContent.replace(/border-slate-900/g, 'border-slate-200');
layoutContent = layoutContent.replace(/text-slate-100/g, 'text-slate-900');
layoutContent = layoutContent.replace(/text-slate-200/g, 'text-slate-700');
layoutContent = layoutContent.replace(/text-slate-300/g, 'text-slate-600');
layoutContent = layoutContent.replace(/text-slate-400/g, 'text-slate-500');
layoutContent = layoutContent.replace(/text-white/g, 'text-slate-900');
layoutContent = layoutContent.replace(/bg-\[radial-gradient[^>]+>/g, 'bg-gradient-to-b from-slate-100 to-white pointer-events-none" />');
layoutContent = layoutContent.replace(/hover:bg-slate-900/g, 'hover:bg-slate-100');
layoutContent = layoutContent.replace(/bg-red-600 text-slate-900/g, 'bg-red-600 text-white');
layoutContent = layoutContent.replace(/bg-red-600 hover:bg-red-500 text-slate-900/g, 'bg-red-600 hover:bg-red-500 text-white');
layoutContent = layoutContent.replace(/bg-red-500\/10 border border-red-500\/20 text-red-500/g, 'bg-red-500/10 border border-red-500/20 text-red-600');

fs.writeFileSync(layoutPath, layoutContent, 'utf8');

// Fix Dashboard Page
let pagePath = './src/app/kepanitiaan/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');
pageContent = pageContent.replace(/bg-slate-900\/30/g, 'bg-white');
pageContent = pageContent.replace(/bg-slate-900\/40/g, 'bg-slate-50');
pageContent = pageContent.replace(/bg-slate-900\/20/g, 'bg-white');
pageContent = pageContent.replace(/bg-slate-800\/50/g, 'bg-slate-100');
pageContent = pageContent.replace(/bg-slate-950/g, 'bg-white');
pageContent = pageContent.replace(/border-slate-800\/50/g, 'border-slate-200');
pageContent = pageContent.replace(/border-slate-800/g, 'border-slate-200');
pageContent = pageContent.replace(/text-white/g, 'text-slate-900');
pageContent = pageContent.replace(/text-slate-300/g, 'text-slate-600');
pageContent = pageContent.replace(/text-slate-400/g, 'text-slate-500');
pageContent = pageContent.replace(/hover:bg-slate-800/g, 'hover:bg-slate-200');
pageContent = pageContent.replace(/hover:bg-slate-700/g, 'hover:bg-slate-300');
pageContent = pageContent.replace(/bg-red-600 text-slate-900/g, 'bg-red-600 text-white');
pageContent = pageContent.replace(/bg-red-600 hover:bg-red-600 text-slate-900/g, 'bg-red-600 hover:bg-red-700 text-white');
pageContent = pageContent.replace(/hover:bg-red-500 text-slate-900/g, 'hover:bg-red-500 text-white');
pageContent = pageContent.replace(/bg-emerald-600 hover:bg-emerald-500 text-slate-900/g, 'bg-emerald-600 hover:bg-emerald-500 text-white');
pageContent = pageContent.replace(/bg-red-950\/15 border border-red-900\/30/g, 'bg-red-50 border border-red-200');

fs.writeFileSync(pagePath, pageContent, 'utf8');

console.log('clean layout and page done');
