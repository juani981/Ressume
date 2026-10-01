import { defineConfig } from "cypress";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    defaultCommandTimeout: 15000,
    video: false,
    screenshotOnRunFailure: false,
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log('[CY-TASK-LOG]', message);
          return null;
        },
        inspectPdf(filePath) {
          const resolvedPath = path.resolve(filePath);
          if (!fs.existsSync(resolvedPath)) {
            return { exists: false, error: 'File does not exist' };
          }
          const buffer = fs.readFileSync(resolvedPath);
          const sizeBytes = buffer.length;
          const content = buffer.toString('binary');

          // PDF Magic header: %PDF-1.x
          const headerMatch = content.match(/^%PDF-1\.[0-7]/);
          const isPdf = Boolean(headerMatch);

          let pagesCount = 0;

          // 1. Try pdfinfo if available on system (standard on Linux/macOS poppler-utils)
          try {
            const pdfinfoOut = execSync(`pdfinfo "${resolvedPath}"`, {
              encoding: 'utf8',
              stdio: ['pipe', 'pipe', 'ignore'],
              timeout: 5000,
            });
            const m = pdfinfoOut.match(/Pages:\s*(\d+)/i);
            if (m && m[1]) {
              pagesCount = parseInt(m[1], 10);
            }
          } catch (_) {}

          // 2. Fallback to /Type /Page objects count in uncompressed streams
          if (!pagesCount) {
            const pageMatches = content.match(/\/Type\s*\/Page(?=[\s\/><\[\{])/g) || [];
            if (pageMatches.length > 0) {
              pagesCount = pageMatches.length;
            }
          }

          // 3. Fallback to /Count <N> in /Pages catalog dictionary
          if (!pagesCount) {
            const countMatch = content.match(/\/Pages[\s\S]{1,300}?\/Count\s+(\d+)/) || content.match(/\/Count\s+(\d+)/);
            if (countMatch && countMatch[1]) {
              pagesCount = parseInt(countMatch[1], 10);
            }
          }

          if (!pagesCount && isPdf) {
            pagesCount = 1;
          }

          return {
            exists: true,
            isPdf,
            header: headerMatch ? headerMatch[0] : null,
            sizeBytes,
            pagesCount,
          };
        },

        inspectPdfFonts(filePath) {
          const resolvedPath = path.resolve(filePath);
          if (!fs.existsSync(resolvedPath)) {
            return { exists: false, fonts: [] };
          }
          const buffer = fs.readFileSync(resolvedPath);
          const content = buffer.toString('binary');
          const fontMatches = content.match(/\/BaseFont\s*\/([^\s\/>]+)/g) || [];
          let fonts = fontMatches.map((f) => f.replace(/\/BaseFont\s*\//, ''));

          // Fallback to pdffonts if available
          if (fonts.length === 0) {
            try {
              const pdffontsOut = execSync(`pdffonts "${resolvedPath}"`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore'],
                timeout: 5000,
              });
              const lines = pdffontsOut.split('\n').slice(2);
              const extracted = lines.map((l) => l.trim().split(/\s+/)[0]).filter(Boolean);
              if (extracted.length > 0) fonts = extracted;
            } catch (_) {}
          }

          return {
            exists: true,
            fonts,
          };
        },

        deleteFile(filePath) {
          const resolvedPath = path.resolve(filePath);
          if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
          }
          return null;
        },

        printWithChrome({ url, outputPath }) {
          const resolvedOut = path.resolve(outputPath);
          if (fs.existsSync(resolvedOut)) {
            fs.unlinkSync(resolvedOut);
          }

          let chromeBin = null;
          if (process.platform === 'win32') {
            const candidates = [
              'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
              'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
              path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
              path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
            ];
            chromeBin = candidates.find((c) => fs.existsSync(c));
          } else if (process.platform === 'darwin') {
            const candidates = [
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              '/Applications/Chromium.app/Contents/MacOS/Chromium',
            ];
            chromeBin = candidates.find((c) => fs.existsSync(c));
          } else {
            // Linux
            const candidates = [
              '/usr/bin/google-chrome',
              '/usr/bin/google-chrome-stable',
              '/usr/bin/chromium',
              '/usr/bin/chromium-browser',
              '/snap/bin/chromium',
            ];
            chromeBin = candidates.find((c) => fs.existsSync(c));
            if (!chromeBin) {
              try {
                chromeBin = execSync(
                  'which google-chrome || which google-chrome-stable || which chromium || which chromium-browser',
                  { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                ).trim().split('\n')[0];
              } catch (_) {}
            }
          }

          if (!chromeBin) {
            console.warn(
              'Chrome/Chromium binary not found on host. Recommended to use cy.generatePdfWithCDP instead.'
            );
            return false;
          }

          try {
            if (process.platform === 'win32') {
              execSync(
                `powershell -Command "Start-Process -FilePath '${chromeBin}' -ArgumentList '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--print-to-pdf=${resolvedOut}', '${url}' -Wait"`,
                { stdio: 'ignore' }
              );
            } else {
              execSync(
                `"${chromeBin}" --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${resolvedOut}" "${url}"`,
                { stdio: 'ignore' }
              );
            }
          } catch (err) {
            console.error('printWithChrome failed execution:', err.message);
            return false;
          }

          return fs.existsSync(resolvedOut);
        },
      });
    },
  },
});
