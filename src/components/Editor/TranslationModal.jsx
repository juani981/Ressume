import React, { useState, useMemo } from 'react';
import { useCV } from '../../context/CVContext';
import {
  SUPPORTED_LANGUAGES,
  extractDictionaryFromCV,
  buildTranslationPrompt,
  sanitizeAndParseAIResponse,
  validateKeyCoverage
} from '../../utils/translationEngine';

const TranslationModal = ({ isOpen, onClose }) => {
  const {
    cvData,
    languagePacks,
    activeLanguage,
    switchLanguage,
    importLanguagePack,
    getActiveDictionary
  } = useCV();

  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'import' | 'slots'
  const [targetLangCode, setTargetLangCode] = useState('en');
  const [customLangCode, setCustomLangCode] = useState('');
  const [customGuidelines, setCustomGuidelines] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Import Tab State
  const [rawAIInput, setRawAIInput] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  const currentDict = useMemo(() => {
    return getActiveDictionary() || extractDictionaryFromCV(cvData);
  }, [cvData, activeLanguage, languagePacks]);

  const effectiveTargetLang = targetLangCode === 'custom' ? (customLangCode.trim() || 'custom') : targetLangCode;

  const generatedPrompt = useMemo(() => {
    return buildTranslationPrompt(
      currentDict,
      effectiveTargetLang,
      activeLanguage,
      customGuidelines
    );
  }, [currentDict, effectiveTargetLang, activeLanguage, customGuidelines]);

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (e) {
      console.error('Error copying prompt', e);
    }
  };

  const handleParseAIResponse = () => {
    setImportSuccessMsg('');
    const result = sanitizeAndParseAIResponse(rawAIInput, effectiveTargetLang);
    if (result.success) {
      const stats = validateKeyCoverage(currentDict, result.dictionary);
      setParseResult({ ...result, stats });
    } else {
      setParseResult(result);
    }
  };

  const handleApplyImportedLanguage = () => {
    if (!parseResult || !parseResult.success) return;
    const langToSave = parseResult.languageCode || effectiveTargetLang;
    importLanguagePack(langToSave, parseResult.dictionary, true);
    setImportSuccessMsg(`¡Idioma "${langToSave.toUpperCase()}" importado y aplicado con éxito al CV!`);
    setTimeout(() => {
      setImportSuccessMsg('');
      setActiveTab('slots');
    }, 1500);
  };

  const handleDownloadFullContentJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(languagePacks, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "content.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const availableLangKeys = Object.keys(languagePacks);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--container-color, #ffffff)',
        color: 'var(--text-color, #333333)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        border: '1px solid rgba(150, 150, 150, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(150, 150, 150, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🌐</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                Motor de Traducción IA & Slots de Idioma
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-color-light, #777)' }}>
                Genera prompts con salida JSON rígida para LLMs e importa packs de idioma con 1 clic
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-color-light, #888)',
              padding: '0.25rem 0.5rem',
              borderRadius: '8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(150, 150, 150, 0.2)',
          background: 'rgba(0,0,0,0.03)',
          padding: '0 1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('prompt')}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'prompt' ? '3px solid #3874ff' : '3px solid transparent',
              color: activeTab === 'prompt' ? '#3874ff' : 'inherit',
              fontWeight: activeTab === 'prompt' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            📤 1. Generar Prompt para IA
          </button>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'import' ? '3px solid #3874ff' : '3px solid transparent',
              color: activeTab === 'import' ? '#3874ff' : 'inherit',
              fontWeight: activeTab === 'import' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            📥 2. Importar & Validar Respuesta IA
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'slots' ? '3px solid #3874ff' : '3px solid transparent',
              color: activeTab === 'slots' ? '#3874ff' : 'inherit',
              fontWeight: activeTab === 'slots' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            🗂️ 3. Administrar Idiomas ({availableLangKeys.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* TAB 1: PROMPT GENERATOR */}
          {activeTab === 'prompt' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Idioma Origen Actual:
                  </label>
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(150, 150, 150, 0.3)',
                    background: 'rgba(0,0,0,0.05)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>
                    {activeLanguage.toUpperCase()} — {SUPPORTED_LANGUAGES.find(l => l.code === activeLanguage)?.name || 'Idioma Activo'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    🎯 Idioma Destino (Slot a Traducir):
                  </label>
                  <select
                    value={targetLangCode}
                    onChange={(e) => setTargetLangCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(150, 150, 150, 0.3)',
                      background: 'var(--body-color, #f9f9f9)',
                      color: 'inherit',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    {SUPPORTED_LANGUAGES.filter(l => l.code !== activeLanguage).map(l => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name} ({l.code})
                      </option>
                    ))}
                    <option value="custom">➕ Otro Idioma (Código ISO personalizado)</option>
                  </select>
                </div>
              </div>

              {targetLangCode === 'custom' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Código de Idioma Personalizado (ej. "nl", "sv", "pl", "it"):
                  </label>
                  <input
                    type="text"
                    value={customLangCode}
                    onChange={(e) => setCustomLangCode(e.target.value.toLowerCase())}
                    placeholder="Código de 2 o 3 letras..."
                    style={{
                      width: '200px',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(150, 150, 150, 0.3)',
                      background: 'var(--body-color, #f9f9f9)',
                      color: 'inherit'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Directrices o Instrucciones Opcionales para el Modelo:
                </label>
                <input
                  type="text"
                  value={customGuidelines}
                  onChange={(e) => setCustomGuidelines(e.target.value)}
                  placeholder="Ej: 'Priorizar inglés británico' o 'Mantener tono formal para corporaciones alemanas'..."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(150, 150, 150, 0.3)',
                    background: 'var(--body-color, #f9f9f9)',
                    color: 'inherit',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    👁️ Prompt Rígido Ensamblado (Directrices + Diccionario de Texto):
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-color-light, #888)' }}>
                    {Object.keys(currentDict).length} claves a traducir
                  </span>
                </div>
                <pre style={{
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontFamily: 'Consolas, Monaco, monospace',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0
                }}>
                  {generatedPrompt}
                </pre>
              </div>
            </>
          )}

          {/* TAB 2: IMPORT & VALIDATE */}
          {activeTab === 'import' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  📋 Pegar Respuesta Completa de la IA (JSON o Bloque de Código):
                </label>
                <textarea
                  rows={7}
                  value={rawAIInput}
                  onChange={(e) => setRawAIInput(e.target.value)}
                  placeholder={`Pega aquí el JSON devuelto por ChatGPT, Claude, Gemini o DeepSeek...\nEjemplo:\n{\n  "${effectiveTargetLang}": {\n    "nav_home": "Home",\n    ...\n  }\n}`}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(150, 150, 150, 0.3)',
                    background: 'var(--body-color, #f9f9f9)',
                    color: 'inherit',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.82rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleParseAIResponse}
                  disabled={!rawAIInput.trim()}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#3874ff',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: rawAIInput.trim() ? 'pointer' : 'not-allowed',
                    opacity: rawAIInput.trim() ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  🔍 Analizar & Validar Estructura JSON
                </button>
              </div>

              {/* Validation Result Box */}
              {parseResult && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: parseResult.success ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                  border: `1px solid ${parseResult.success ? '#2ecc71' : '#e74c3c'}`
                }}>
                  {parseResult.success ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#27ae60', fontSize: '0.95rem' }}>
                          ✅ JSON Válido — Slot Detectado: "{parseResult.languageCode?.toUpperCase()}"
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          Cobertura: {parseResult.stats.matchPercentage}% ({parseResult.stats.matchedCount}/{parseResult.stats.totalSource} claves)
                        </span>
                      </div>

                      {parseResult.stats.missingKeys?.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#d35400', marginTop: '0.5rem' }}>
                          ⚠️ Claves faltantes ({parseResult.stats.missingKeys.length}): {parseResult.stats.missingKeys.slice(0, 5).join(', ')}...
                        </div>
                      )}

                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={handleApplyImportedLanguage}
                          style={{
                            padding: '0.6rem 1.4rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#27ae60',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✨ Importar y Activar Idioma "{parseResult.languageCode?.toUpperCase()}"
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontWeight: 600, color: '#c0392b' }}>
                        ❌ Error al procesar JSON:
                      </span>
                      <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#c0392b' }}>
                        {parseResult.error}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {importSuccessMsg && (
                <div style={{ padding: '0.75rem', background: '#2ecc71', color: 'white', borderRadius: '8px', fontWeight: 600, textAlign: 'center' }}>
                  {importSuccessMsg}
                </div>
              )}
            </>
          )}

          {/* TAB 3: SLOTS MANAGER */}
          {activeTab === 'slots' && (
            <>
              <div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-color-light, #777)' }}>
                  Slots de idioma disponibles en tu sistema. Puedes alternar el idioma activo en cualquier momento sin perder tu diseño ni orden de secciones.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {availableLangKeys.map(langKey => {
                    const isActive = activeLanguage === langKey;
                    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langKey) || { name: langKey, flag: '🌐' };
                    const keyCount = Object.keys(languagePacks[langKey] || {}).length;

                    return (
                      <div
                        key={langKey}
                        style={{
                          padding: '1.25rem',
                          borderRadius: '12px',
                          border: isActive ? '2px solid #3874ff' : '1px solid rgba(150, 150, 150, 0.25)',
                          background: isActive ? 'rgba(56, 116, 255, 0.06)' : 'var(--body-color, #fafafa)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.4rem' }}>{langInfo.flag}</span>
                          {isActive && (
                            <span style={{ background: '#3874ff', color: 'white', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: 600 }}>
                            {langInfo.name} ({langKey.toUpperCase()})
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-color-light, #888)' }}>
                            {keyCount} claves traducidas
                          </span>
                        </div>

                        <button
                          onClick={() => switchLanguage(langKey)}
                          disabled={isActive}
                          style={{
                            marginTop: 'auto',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: isActive ? '1px solid #3874ff' : '1px solid rgba(150, 150, 150, 0.3)',
                            background: isActive ? '#3874ff' : 'var(--container-color, #ffffff)',
                            color: isActive ? '#ffffff' : 'inherit',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: isActive ? 'default' : 'pointer'
                          }}
                        >
                          {isActive ? '✓ Idioma en Pantalla' : 'Cambiar a este Idioma'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(150, 150, 150, 0.2)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleDownloadFullContentJson}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(150, 150, 150, 0.3)',
                    background: 'var(--body-color, #f0f0f0)',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  💾 Descargar content.json Completo (Multi-Idioma)
                </button>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        {activeTab === 'prompt' && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(150, 150, 150, 0.2)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            {copiedPrompt && (
              <span style={{ color: '#2ecc71', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ ¡Prompt copiado al portapapeles!
              </span>
            )}
            <button
              onClick={handleCopyPrompt}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#3874ff',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(56, 116, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              📋 Copiar Prompt para IA Externa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationModal;
