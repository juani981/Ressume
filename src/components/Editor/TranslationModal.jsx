import React, { useState, useMemo } from 'react';
import { useCV } from '../../context/CVContext';
import {
  SUPPORTED_LANGUAGES,
  extractDictionaryFromCV,
  buildTranslationPrompt,
  sanitizeAndParseAIResponse,
  validateKeyCoverage,
  getLanguageLegend
} from '../../utils/translationEngine';
import { saveVersion } from '../../utils/versionStorage';
import { generateThumbnail } from '../../utils/thumbnailGenerator';
import { 
  Globe, 
  Upload, 
  Download, 
  FolderArchive, 
  Target, 
  Plus, 
  Eye, 
  Clipboard, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  XCircle, 
  X,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  ArrowRight,
  ClipboardPaste,
  Trash2
} from 'lucide-react';

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
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isWaitingAI, setIsWaitingAI] = useState(false);

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
      setIsWaitingAI(true);
      setActiveTab('import');
    } catch (e) {
      console.error('Error copying prompt', e);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawAIInput(text);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
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

  const handleApplyImportedLanguage = async () => {
    if (!parseResult || !parseResult.success) return;
    const langToSave = parseResult.languageCode || effectiveTargetLang;

    // Save backup of current CV with source language legend (e.g. "ESPAÑOL")
    try {
      const candidateName = cvData?.profile?.name || 'CV';
      const sourceLegend = getLanguageLegend(activeLanguage);
      const backupTitle = `${candidateName} - ${sourceLegend}`;
      const snapshot = {
        ...cvData,
        versionName: backupTitle,
        activeVersionName: backupTitle
      };
      const thumb = await generateThumbnail(snapshot);
      await saveVersion(backupTitle, snapshot, thumb);
    } catch (err) {
      console.warn('Could not save pre-translation snapshot in TranslationModal:', err);
    }

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
            <Globe size={28} color="#10b981" />
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
            aria-label="Cerrar modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-color-light, #888)',
              padding: '0.25rem 0.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
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
            <Upload size={16} /> 1. Generar Prompt para IA
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
            <Download size={16} /> 2. Importar & Validar Respuesta IA
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
            <FolderArchive size={16} /> 3. Administrar Idiomas ({availableLangKeys.length})
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    <Target size={15} color="#3874ff" /> Idioma Destino (Slot a Traducir):
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
                        {l.name} ({l.code})
                      </option>
                    ))}
                    <option value="custom">Otro Idioma (Código ISO personalizado)</option>
                  </select>
                </div>
              </div>

              {targetLangCode === 'custom' && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    <Plus size={15} /> Código de Idioma Personalizado (ej. "nl", "sv", "pl", "it"):
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

              {/* Collapsible Prompt Preview */}
              <div style={{
                border: '1px solid rgba(150, 150, 150, 0.25)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                background: 'rgba(0, 0, 0, 0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isPromptExpanded ? '0.6rem' : '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                    <Eye size={15} color="#3874ff" /> Prompt Rígido Ensamblado (Directrices + Diccionario):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-color-light, #888)' }}>
                      {Object.keys(currentDict).length} claves a traducir
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(150, 150, 150, 0.35)',
                        borderRadius: '6px',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#3874ff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isPromptExpanded ? (
                        <>
                          <ChevronUp size={13} /> Ocultar prompt
                        </>
                      ) : (
                        <>
                          <Eye size={13} /> Desplegar prompt completo
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <pre style={{
                    background: '#18181b',
                    color: '#d4d4d4',
                    padding: isPromptExpanded ? '1rem' : '0.45rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: isPromptExpanded ? '0.8rem' : '0.68rem',
                    lineHeight: isPromptExpanded ? '1.45' : '1.25',
                    fontFamily: 'Consolas, Monaco, monospace',
                    maxHeight: isPromptExpanded ? '220px' : '44px',
                    overflowY: isPromptExpanded ? 'auto' : 'hidden',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    opacity: isPromptExpanded ? 1 : 0.75,
                    transition: 'max-height 0.2s ease, opacity 0.2s ease'
                  }}>
                    {generatedPrompt}
                  </pre>
                  {!isPromptExpanded && (
                    <div 
                      onClick={() => setIsPromptExpanded(true)}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '22px',
                        background: 'linear-gradient(transparent, rgba(24, 24, 27, 0.95))',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        paddingBottom: '2px',
                        cursor: 'pointer',
                        borderRadius: '0 0 8px 8px',
                        fontSize: '0.68rem',
                        color: '#94a3b8'
                      }}
                    >
                      <span>Vista compacta — Clic para desplegar</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Banner to Transition to Waiting State */}
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(56, 116, 255, 0.05)',
                border: '1px solid rgba(56, 116, 255, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3874ff' }}>
                    Flujo guiado de Traducción con IA:
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-color-light, #666)' }}>
                    Copia el prompt, genera la traducción en tu IA externa y vuelve a pegarla en la pestaña de Importar.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#3874ff',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(56, 116, 255, 0.25)'
                  }}
                >
                  <Clipboard size={14} /> Copiar Prompt y Esperar IA ➔
                </button>
              </div>
            </>
          )}

          {/* TAB 2: IMPORT & VALIDATE */}
          {activeTab === 'import' && (
            <>
              {/* Waiting Mode Banner in Tab 2 */}
              {isWaitingAI && (
                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(56, 116, 255, 0.07)',
                  border: '1.5px solid rgba(56, 116, 255, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#3874ff',
                        display: 'inline-block',
                        boxShadow: '0 0 8px #3874ff'
                      }} />
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#3874ff' }}>
                        Esperando respuesta de tu IA externa...
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWaitingAI(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-color-light, #666)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Ocultar guía
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: '1.4', opacity: 0.9 }}>
                    El prompt de traducción ya fue copiado a tu portapapeles. Ve a otra pestaña, solicita la traducción en tu IA y regresa a pegar el bloque JSON aquí abajo.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color-light, #777)' }}>
                      Abrir IA externa en nueva pestaña:
                    </span>
                    <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(56, 116, 255, 0.1)', color: '#3874ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      ChatGPT <ExternalLink size={11} />
                    </a>
                    <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(56, 116, 255, 0.1)', color: '#3874ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      Claude <ExternalLink size={11} />
                    </a>
                    <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(56, 116, 255, 0.1)', color: '#3874ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      Gemini <ExternalLink size={11} />
                    </a>
                    <a href="https://chat.deepseek.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(56, 116, 255, 0.1)', color: '#3874ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      DeepSeek <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Clipboard size={15} color="#3874ff" /> Pegar Respuesta Completa de la IA (JSON o Bloque de Código):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(56, 116, 255, 0.3)',
                        borderRadius: '6px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#3874ff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ClipboardPaste size={13} /> Pegar del portapapeles
                    </button>
                    {rawAIInput && (
                      <button
                        type="button"
                        onClick={() => setRawAIInput('')}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(150, 150, 150, 0.3)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-color-light, #888)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Trash2 size={13} /> Limpiar
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  rows={isWaitingAI ? 10 : 7}
                  value={rawAIInput}
                  onChange={(e) => setRawAIInput(e.target.value)}
                  placeholder={`Pega aquí el JSON devuelto por ChatGPT, Claude, Gemini o DeepSeek...\nEjemplo:\n{\n  "${effectiveTargetLang}": {\n    "nav_home": "Home",\n    ...\n  }\n}`}
                  style={{
                    width: '100%',
                    minHeight: isWaitingAI ? '220px' : '140px',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(150, 150, 150, 0.35)',
                    background: 'var(--body-color, #f9f9f9)',
                    color: 'inherit',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.83rem',
                    lineHeight: '1.4',
                    resize: 'vertical',
                    boxSizing: 'border-box'
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
                  <Search size={16} /> Analizar & Validar Estructura JSON
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
                        <span style={{ fontWeight: 600, color: '#27ae60', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={18} /> JSON Válido — Slot Detectado: "{parseResult.languageCode?.toUpperCase()}"
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          Cobertura: {parseResult.stats.matchPercentage}% ({parseResult.stats.matchedCount}/{parseResult.stats.totalSource} claves)
                        </span>
                      </div>

                      {parseResult.stats.missingKeys?.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#d35400', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={15} /> Claves faltantes ({parseResult.stats.missingKeys.length}): {parseResult.stats.missingKeys.slice(0, 5).join(', ')}...
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
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Sparkles size={16} /> Importar y Activar Idioma "{parseResult.languageCode?.toUpperCase()}"
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontWeight: 600, color: '#c0392b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <XCircle size={18} /> Error al procesar JSON:
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
                    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langKey) || { name: langKey, flag: '' };
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
                          <Globe size={22} color="#3874ff" />
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
                          {isActive ? 'Idioma en Pantalla' : 'Cambiar a este Idioma'}
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
                  <Download size={16} /> Descargar content.json Completo (Multi-Idioma)
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
              <span style={{ color: '#2ecc71', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> ¡Prompt copiado al portapapeles!
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
              <Clipboard size={16} /> Copiar Prompt para IA Externa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationModal;
