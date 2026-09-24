import fs from 'fs';
import { defaultSchema } from './src/utils/schema.js';
import { generateCleanPrintHTML } from './src/utils/staticHtmlPdfEngine.js';

const cvData = JSON.parse(JSON.stringify(defaultSchema));
cvData.layout.type = '1-column';
cvData.layout.isAtsMode = true;

const html = generateCleanPrintHTML(cvData, 'es');
fs.writeFileSync('/home/juani/.gemini/antigravity-cli/brain/1e1fe292-e669-4961-a690-dc0a46ec5280/scratch/default_ats.html', html);
console.log('HTML size:', html.length);
