let cvData = { es: {}, en: {} };

async function initI18n() {
    try {
        // Fetch the external JSON content
        const response = await fetch('assets/data/content.json');
        cvData = await response.json();
        
        // Ensure language state exists
        let currentLang = localStorage.getItem('lang') || 'es';
        
        // Initial render
        window.updateLanguage(currentLang);
        
        // Setup toggle button
        const langToggle = document.getElementById('lang-button');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                currentLang = currentLang === 'es' ? 'en' : 'es';
                localStorage.setItem('lang', currentLang);
                window.updateLanguage(currentLang);
            });
        }
    } catch (err) {
        console.error("Error loading content.json:", err);
    }
}

// Global function to update the DOM based on the selected language and user edits
window.updateLanguage = function(lang) {
    const langToggleText = document.getElementById('lang-toggle-text');
    if (langToggleText) {
        langToggleText.innerText = lang === 'es' ? 'EN' : 'ES';
    }

    // 1. Apply default JSON content
    if (cvData[lang]) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (cvData[lang][key]) {
                el.innerHTML = cvData[lang][key];
            }
        });
    }

    // 2. Apply user's live edits from localStorage (overrides)
    if (window.customEdits && window.customEdits[lang]) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (window.customEdits[lang][key]) {
                el.innerHTML = window.customEdits[lang][key];
            }
        });
    }

    // 3. Apply custom links
    if (window.applyCustomLinks) {
        window.applyCustomLinks();
    }
};

document.addEventListener('DOMContentLoaded', initI18n);
