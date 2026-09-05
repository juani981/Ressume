const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF(inputPath, outputPath) {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set desktop viewport wide enough to trigger desktop media queries (>= 968px)
    await page.setViewport({ width: 1200, height: 3000, deviceScaleFactor: 2 });

    // Resolve absolute path to handle relative local assets correctly
    const absoluteInputPath = `file://${path.resolve(inputPath)}`;
    console.log(`Loading page: ${absoluteInputPath}`);
    
    await page.goto(absoluteInputPath, { waitUntil: 'networkidle0' });
    
    // Ensure all web fonts (Poppins, Boxicons, etc.) are fully loaded
    await page.evaluate(async () => {
        if (document.fonts) {
            await document.fonts.ready;
        }
    });

    // Force screen media type so it preserves exact desktop styling, colors, and layouts
    await page.emulateMediaType('screen');

    // Inject styles to hide UI navigation elements and prepare layout for pixel-perfect PDF export
    await page.addStyleTag({
        content: `
            .generate-pdf, .change-theme, .l-navbar, .scrolltop, .l-header, .home__button-movil {
                display: none !important;
            }
            body {
                margin: 0 !important;
                padding: 0 !important;
                background-color: var(--body-color) !important;
            }
            .bd-container {
                position: static !important;
                margin: 0 auto !important;
                width: 968px !important;
                max-width: 968px !important;
            }
            /* Neutralize glowing text animations so they print with crisp, sharp text */
            .section-title, .profile__description strong {
                animation: none !important;
                text-shadow: none !important;
            }
        `
    });

    // Extract exact rendered dimensions of the resume container
    const dimensions = await page.evaluate(() => {
        const el = document.getElementById('area-cv');
        return {
            width: el.offsetWidth,
            height: el.offsetHeight
        };
    });

    console.log(`Area CV exact dimensions: ${dimensions.width}px x ${dimensions.height}px`);
    console.log('Generating pixel-perfect vector PDF with selectable text...');

    // Generate vector PDF matching exact DOM dimensions
    await page.pdf({
        path: outputPath,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        printBackground: true,
        margin: {
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px'
        },
        pageRanges: '1'
    });

    console.log(`Successfully saved PDF to: ${outputPath}`);
    await browser.close();
}

// Simple CLI argument parsing
const args = process.argv.slice(2);
const inputFile = args[0] || 'index.html';
const outputFile = args[1] || 'assets/pdf/Carrizo,JuanIgnacio-CV2026.pdf';

if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
}

// Create output directory if it doesn't exist
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

generatePDF(inputFile, outputFile).catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});
