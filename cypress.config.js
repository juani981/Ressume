import { defineConfig } from "cypress";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    video: false,
    screenshotOnRunFailure: true,
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      on('task', {
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

          // Count /Type /Page objects (distinct from /Pages catalog)
          const pageMatches = content.match(/\/Type\s*\/Page(?=[\s\/><\[\{])/g) || [];
          const pagesCount = pageMatches.length;

          return {
            exists: true,
            isPdf,
            header: headerMatch ? headerMatch[0] : null,
            sizeBytes,
            pagesCount: pagesCount > 0 ? pagesCount : 1
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
          const fonts = fontMatches.map((f) => f.replace(/\/BaseFont\s*\//, ''));
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
          const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
          const resolvedOut = path.resolve(outputPath);
          if (fs.existsSync(resolvedOut)) {
            fs.unlinkSync(resolvedOut);
          }
          execSync(
            `powershell -Command "Start-Process -FilePath '${chromePath}' -ArgumentList '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--print-to-pdf=${resolvedOut}', '${url}' -Wait"`
          );
          return fs.existsSync(resolvedOut);
        }
      });
    },
  },
});
