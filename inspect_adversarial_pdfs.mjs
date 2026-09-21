import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const pdfDir = 'tests/adversarial-output';
if (!fs.existsSync(pdfDir)) {
  console.error(`Directory ${pdfDir} does not exist!`);
  process.exit(1);
}

const pdfFiles = fs.readdirSync(pdfDir).filter((f) => f.endsWith('.pdf')).sort();

console.log('======================================================================');
console.log('POPPLER UTILITIES ADVERSARIAL PDF AUDIT REPORT');
console.log('======================================================================\n');

const results = [];

for (const file of pdfFiles) {
  const filePath = path.join(pdfDir, file);
  console.log(`\n--------------------------------------------------`);
  console.log(`Auditing: ${file}`);
  console.log(`--------------------------------------------------`);

  // 1. pdfinfo
  let pdfinfoOut = '';
  try {
    pdfinfoOut = execSync(`pdfinfo "${filePath}"`, { encoding: 'utf8' });
  } catch (err) {
    console.error(`Error running pdfinfo on ${file}:`, err.message);
    continue;
  }

  const pagesMatch = pdfinfoOut.match(/Pages:\s*(\d+)/i);
  const totalPages = pagesMatch ? parseInt(pagesMatch[1], 10) : 0;
  const pageSizeMatch = pdfinfoOut.match(/Page size:\s*([^\n]+)/i);
  const pageSize = pageSizeMatch ? pageSizeMatch[1].trim() : 'Unknown';
  const fileSizeMatch = pdfinfoOut.match(/File size:\s*(\d+)\s*bytes/i);
  const fileSize = fileSizeMatch ? parseInt(fileSizeMatch[1], 10) : fs.statSync(filePath).size;

  console.log(`- Page Count: ${totalPages}`);
  console.log(`- Page Size: ${pageSize}`);
  console.log(`- File Size: ${fileSize} bytes`);

  // 2. pdftotext per-page inspection
  const pageStats = [];
  let hasPhantomBlankPage = false;

  for (let p = 1; p <= totalPages; p++) {
    const pageText = execSync(`pdftotext -f ${p} -l ${p} "${filePath}" -`, { encoding: 'utf8' });
    const trimmedText = pageText.trim();
    const charCount = trimmedText.length;
    const wordCount = trimmedText.split(/\s+/).filter(Boolean).length;
    const lines = trimmedText.split('\n').filter((l) => l.trim().length > 0);

    const isBlank = charCount === 0 || wordCount === 0;
    if (isBlank) {
      hasPhantomBlankPage = true;
    }

    pageStats.push({
      page: p,
      chars: charCount,
      words: wordCount,
      lineCount: lines.length,
      isBlank,
      firstLine: lines[0] || '(empty)',
      lastLine: lines[lines.length - 1] || '(empty)',
    });

    console.log(`  * Page ${p}: ${charCount} chars, ${wordCount} words, ${lines.length} lines ${isBlank ? '🚨 [PHANTOM BLANK PAGE!]' : '✅ [OK]'}`);
    console.log(`    First line: "${(lines[0] || '').substring(0, 70)}"`);
    console.log(`    Last line:  "${(lines[lines.length - 1] || '').substring(0, 70)}"`);
  }

  // 3. Page boundary slicing check via bbox-layout
  let slicingAnomalies = [];
  try {
    const bboxXml = execSync(`pdftotext -bbox-layout "${filePath}" -`, { encoding: 'utf8' });
    const wordRegex = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]+)<\/word>/g;
    let match;
    while ((match = wordRegex.exec(bboxXml)) !== null) {
      const xMin = parseFloat(match[1]);
      const yMin = parseFloat(match[2]);
      const xMax = parseFloat(match[3]);
      const yMax = parseFloat(match[4]);
      const text = match[5];
      const height = yMax - yMin;
      if (height < 2.0 && text.trim().length > 0) {
        slicingAnomalies.push({ text, height, yMin, yMax });
      }
    }
  } catch (err) {
    console.warn(`Could not run bbox inspection:`, err.message);
  }

  console.log(`- Phantom Blank Pages: ${hasPhantomBlankPage ? '🚨 DETECTED' : '0 (None)'}`);
  console.log(`- Text Slicing Anomalies: ${slicingAnomalies.length > 0 ? `🚨 ${slicingAnomalies.length} found` : '0 (Clean glyph bounding boxes)'}`);

  results.push({
    file,
    totalPages,
    pageSize,
    fileSize,
    hasPhantomBlankPage,
    slicingAnomaliesCount: slicingAnomalies.length,
    pageStats,
  });
}

console.log('\n======================================================================');
console.log('SUMMARY AUDIT TABLE');
console.log('======================================================================');
console.table(
  results.map((r) => ({
    File: r.file,
    Pages: r.totalPages,
    'Page Size': r.pageSize,
    'Phantom Pages': r.hasPhantomBlankPage ? 'FAIL' : '0 (PASS)',
    'Text Slicing': r.slicingAnomaliesCount === 0 ? 'CLEAN (PASS)' : `${r.slicingAnomaliesCount} issues`,
  }))
);

fs.writeFileSync('tests/adversarial-output/audit-summary.json', JSON.stringify(results, null, 2));
console.log('\nSaved audit summary to tests/adversarial-output/audit-summary.json');
