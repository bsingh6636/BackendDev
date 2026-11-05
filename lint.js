import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const isFixMode = process.argv.includes('--fix');
const IGNORED_DIRS = new Set(['node_modules', '.git', '.vercel', 'coverage']);
let hasError = false;
let checkedCount = 0;
let fixedCount = 0;

function getJsFiles(dir) {
  let results = [];
  for (const item of readdirSync(dir)) {
    if (IGNORED_DIRS.has(item)) continue;
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getJsFiles(fullPath));
    } else if (extname(item) === '.js') {
      results.push(fullPath);
    }
  }
  return results;
}

console.log(isFixMode ? '🔧 Running Linter in FIX mode...\n' : '🔍 Running Linter on project files...\n');

const files = getJsFiles(process.cwd());

for (const file of files) {
  const relativeFile = file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');

  // Skip linting the linter script itself
  if (relativeFile === 'lint.js') continue;

  checkedCount++;

  let content = readFileSync(file, 'utf-8');
  let fileModified = false;

  // Auto-fixable rules:
  if (isFixMode) {
    // 1. Remove leftover debugger statements
    if (/\bdebugger\b/.test(content)) {
      content = content.replace(/^\s*debugger\s*;?\s*(\r?\n)?/gm, '');
      fileModified = true;
      console.log(`🔧 [Auto-fixed] Removed 'debugger;' from: ${relativeFile}`);
    }

    // 2. Remove trailing whitespace at line ends
    if (/[ \t]+$/m.test(content)) {
      content = content.replace(/[ \t]+$/gm, '');
      fileModified = true;
    }

    if (fileModified) {
      writeFileSync(file, content, 'utf-8');
      fixedCount++;
    }
  }

  // Verification checks:
  // 1. Syntax check via node --check
  const checkResult = spawnSync(process.execPath, ['--check', file], { encoding: 'utf-8' });
  if (checkResult.status !== 0) {
    console.error(`❌ Syntax Error in: ${relativeFile}`);
    console.error(checkResult.stderr.trim());
    hasError = true;
    continue;
  }

  // 2. Remaining bad practice checks
  const currentContent = readFileSync(file, 'utf-8');
  if (/\bdebugger\b/.test(currentContent)) {
    console.error(`❌ Lint Error in ${relativeFile}: Found leftover 'debugger' statement.`);
    hasError = true;
  }
  if (/<<<<<<< HEAD/.test(currentContent)) {
    console.error(`❌ Lint Error in ${relativeFile}: Found unresolved git merge conflict!`);
    hasError = true;
  }
}

if (hasError) {
  console.error(`\n💥 Lint failed! Please fix the errors above.`);
  process.exit(1);
} else {
  if (isFixMode) {
    console.log(`\n✅ Lint & fix complete! ${fixedCount} file(s) modified, ${checkedCount} checked.`);
  } else {
    console.log(`✅ Lint passed! Checked ${checkedCount} JavaScript files successfully.`);
  }
  process.exit(0);
}
