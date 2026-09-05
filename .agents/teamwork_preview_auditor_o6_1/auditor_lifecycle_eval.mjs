import { JSDOM } from 'jsdom';
import { executeCleanPrint } from '../../src/utils/staticHtmlPdfEngine.js';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLBodyElement = dom.window.HTMLBodyElement;
global.HTMLIFrameElement = dom.window.HTMLIFrameElement;

let printCalled = false;
let focusCalled = false;
let iframeCreated = false;
let dimensionsValid = false;

// Intercept appendChild
const origAppendChild = document.body.appendChild.bind(document.body);
document.body.appendChild = function(child) {
  if (child.tagName === 'IFRAME') {
    iframeCreated = true;
    if (child.style.width === '794px' && child.style.height === '1123px' && child.style.position === 'fixed') {
      dimensionsValid = true;
    }
    Object.defineProperty(child, 'contentWindow', {
      configurable: true,
      value: {
        document: {
          open: () => {},
          write: (html) => {},
          close: () => {},
          readyState: 'complete',
          fonts: {
            ready: Promise.resolve()
          },
          body: {
            scrollHeight: 1000,
            style: {}
          }
        },
        focus: () => { focusCalled = true; },
        print: () => { printCalled = true; }
      }
    });
  }
  return origAppendChild(child);
};

console.log('Testing executeCleanPrint execution lifecycle...');

await executeCleanPrint({
  profile: { name: 'Juan Ignacio' },
  layout: { type: '2-column' },
  sections: []
});

console.log('iframeCreated:', iframeCreated);
console.log('dimensionsValid (794px x 1123px):', dimensionsValid);
console.log('focusCalled:', focusCalled);
console.log('printCalled:', printCalled);

if (iframeCreated && dimensionsValid && focusCalled && printCalled) {
  console.log('✅ PASS: executeCleanPrint lifecycle operates genuinely and authentically');
  process.exit(0);
} else {
  console.error('❌ FAIL: executeCleanPrint lifecycle check failed');
  process.exit(1);
}
