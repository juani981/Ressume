// Initialize state
window.customEdits = {};
try {
    const saved = localStorage.getItem('cv_edits');
    if (saved) {
        window.customEdits = JSON.parse(saved) || {};
    }
} catch(e) {
    console.warn('Failed to parse cv_edits', e);
}

function applyCustomEdits(lang) {
    if (!window.customEdits[lang]) return;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.customEdits[lang][key]) {
            el.innerHTML = window.customEdits[lang][key];
        }
    });
}

// Intercept window.updateLanguage to apply custom edits after default translations
const originalUpdateLanguage = window.updateLanguage;
window.updateLanguage = function(lang) {
    if (originalUpdateLanguage) {
        originalUpdateLanguage(lang);
    }
    applyCustomEdits(lang);
};

// Enable Live Editing (Google Docs style)
function initLiveEditor() {
    // 1. Setup editable fields
    document.querySelectorAll('[data-i18n]').forEach(el => {
        // Skip buttons from being editable
        if (el.tagName === 'A' || el.classList.contains('home__button-movil')) return;
        if (el.getAttribute('data-i18n') === 'actions_title') return;

        el.setAttribute('contenteditable', 'true');
        el.style.outline = 'none';
        
        // Visual cue on hover
        el.addEventListener('mouseenter', () => {
            el.style.outline = '1px dashed rgba(0, 180, 216, 0.5)';
            el.style.cursor = 'text';
        });
        el.addEventListener('mouseleave', () => {
            el.style.outline = 'none';
        });

        // 2. Intercept Paste to force plain text
        el.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        // 3. Save on input
        el.addEventListener('input', (e) => {
            const key = el.getAttribute('data-i18n');
            const currentLang = localStorage.getItem('lang') || 'es';
            
            if (!window.customEdits[currentLang]) {
                window.customEdits[currentLang] = {};
            }
            window.customEdits[currentLang][key] = el.innerHTML;
            localStorage.setItem('cv_edits', JSON.stringify(window.customEdits));
        });
    });

    // 4. Setup Reset and Export buttons
    const btnReset = document.getElementById('btn-reset-edits');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset all your live edits? This cannot be undone.")) {
                localStorage.removeItem('cv_edits');
                window.customEdits = {};
                window.location.reload();
            }
        });
    }

    const btnExport = document.getElementById('btn-export-edits');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.customEdits, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "cv_edits_export.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

    // 5. Setup PDF Generation via Netlify Functions
    const btnPdf = document.getElementById('resume-button');
    if (btnPdf) {
        // Remove existing listener by cloning (simplest way in vanilla JS)
        const newBtnPdf = btnPdf.cloneNode(true);
        btnPdf.parentNode.replaceChild(newBtnPdf, btnPdf);
        
        newBtnPdf.addEventListener('click', async () => {
            const originalIcon = newBtnPdf.className;
            newBtnPdf.className = 'bx bx-loader bx-spin generate-pdf';
            newBtnPdf.style.pointerEvents = 'none';

            try {
                // Ensure all fonts/styles are loaded and applied
                const areaCv = document.getElementById('area-cv');
                const height = areaCv.offsetHeight;
                const currentLang = localStorage.getItem('lang') || 'es';
                
                // If we are locally developing, default to a localhost URL if applicable, but window.location.href works
                let functionUrl = '/.netlify/functions/generate-pdf';
                
                const payload = {
                    url: window.location.href, // Current live URL
                    edits: window.customEdits,
                    lang: currentLang,
                    height: height
                };

                const res = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    throw new Error(`Server returned ${res.status}`);
                }

                const data = await res.json();
                if (!data.pdfBase64) {
                    throw new Error("No PDF data returned from server");
                }

                // Decode base64 to binary
                const raw = window.atob(data.pdfBase64);
                const rawLength = raw.length;
                const array = new Uint8Array(new ArrayBuffer(rawLength));
                for (let i = 0; i < rawLength; i++) {
                    array[i] = raw.charCodeAt(i);
                }
                const blob = new Blob([array], {type: "application/pdf"});
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `CV-${currentLang.toUpperCase()}-${Date.now()}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                
                // Cleanup memory
                setTimeout(() => URL.revokeObjectURL(link.href), 5000);
            } catch (err) {
                console.error("Error generating PDF:", err);
                alert("Failed to generate PDF. Error: " + err.message);
            } finally {
                newBtnPdf.className = originalIcon;
                newBtnPdf.style.pointerEvents = 'auto';
            }
        });
    }
}

// Run initialization immediately
initLiveEditor();
