const chromiumModule = require('@sparticuz/chromium');
const chromium = chromiumModule.default || chromiumModule;
const puppeteer = require('puppeteer-core');

exports.handler = async (event, context) => {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let browser = null;
    try {
        const { url, edits, lang, height } = JSON.parse(event.body);
        
        if (!url) {
            return { statusCode: 400, body: 'Missing URL parameter' };
        }

        // Configure chromium for serverless environment
        // This relies on @sparticuz/chromium downloading the correct binaries
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1200, height: 3000, deviceScaleFactor: 2 },
            executablePath: await chromium.executablePath(),
            headless: true,
            ignoreHTTPSErrors: true,
        });
        
        const page = await browser.newPage();
        
        console.log(`Navigating to ${url}...`);
        // Use networkidle0 to ensure fonts and styles are loaded
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        
        // Ensure web fonts are fully loaded
        await page.evaluate(async () => {
            if (document.fonts) {
                await document.fonts.ready;
            }
        });

        console.log(`Injecting custom edits for lang: ${lang}`);
        // Inject the custom edits and language
        await page.evaluate((customEdits, targetLang) => {
            if (customEdits) {
                window.customEdits = customEdits;
            }
            if (window.updateLanguage) {
                window.updateLanguage(targetLang);
            }
        }, edits, lang);
        
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
                .section-title, .profile__description strong {
                    animation: none !important;
                    text-shadow: none !important;
                }
            `
        });
        
        // Force screen media type to preserve exact styling (ignore @media print)
        await page.emulateMediaType('screen');
        
        // Use the height provided by the frontend, or fallback to recalculating
        let finalHeight = height;
        if (!finalHeight) {
            const dimensions = await page.evaluate(() => {
                const el = document.getElementById('area-cv');
                return el ? el.offsetHeight : 3000;
            });
            finalHeight = dimensions;
        }

        console.log(`Generating PDF with height: ${finalHeight}px`);
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
            width: '968px',
            height: `${finalHeight}px`,
            printBackground: true,
            pageRanges: '1',
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });
        
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ pdfBase64: Buffer.from(pdfBuffer).toString('base64') })
        };
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Failed to generate PDF" })
        };
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
