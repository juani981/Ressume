import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    let browser = null;
    try {
        const bodyData = JSON.parse(event.body);
        
        // Frontend might send the url along with the state, or we fallback to origin/referer
        const url = bodyData.url || event.headers.referer || event.headers.origin;
        
        if (!url) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing URL parameter or referer' }) };
        }

        // Use the explicit cv_state if provided, otherwise assume the entire body is the state
        const cvState = bodyData.cv_state !== undefined ? bodyData.cv_state : bodyData;

        // Configure chromium for serverless environment
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1200, height: 3000, deviceScaleFactor: 2 },
            executablePath: await chromium.executablePath(),
            headless: true,
            ignoreHTTPSErrors: true,
        });
        
        const page = await browser.newPage();
        
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        
        console.log('Injecting cvData into localStorage...');
        await page.evaluate((state) => {
            localStorage.setItem('cvData', typeof state === 'string' ? state : JSON.stringify(state));
        }, cvState);

        console.log('Reloading page to apply state...');
        await page.reload({ waitUntil: 'networkidle0', timeout: 15000 });

        // Ensure web fonts are fully loaded
        await page.evaluate(async () => {
            if (document.fonts) {
                await document.fonts.ready;
            }
        });

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
        
        // Always calculate the exact height in the backend AFTER styles are injected and animations stopped
        const finalHeight = await page.evaluate(() => {
            const el = document.getElementById('area-cv') || document.body;
            // Add a small buffer of 20px just in case of subpixel rendering clipping
            return el ? el.offsetHeight + 20 : 3000;
        });

        console.log(`Generating PDF with exact height: ${finalHeight}px`);
        
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
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ pdfBase64: Buffer.from(pdfBuffer).toString('base64') })
        };
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || "Failed to generate PDF" })
        };
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
