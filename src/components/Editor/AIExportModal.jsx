import React, { useState, useMemo, useEffect } from 'react';
import { useCV } from '../../context/CVContext';
import { getPrompts, getUI } from '../../locales/index';
import { buildAIPromptPayload, getLanguageLegend } from '../../utils/aiExporter';
import { saveVersion } from '../../utils/versionStorage';
import { generateThumbnail } from '../../utils/thumbnailGenerator';
import { cleanAndParseRawJSON, normalizeAnyJSONToCVSnapshot } from '../../utils/universalJsonImporter';
import { 
  BrainCircuit, 
  Target, 
  Layout, 
  FileText, 
  Briefcase, 
  Eye, 
  Download, 
  Copy, 
  Check, 
  X, 
  MessageSquare,
  Sparkles,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ClipboardPaste,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock
} from 'lucide-react';

const AIExportModal = ({ isOpen, onClose }) => {
  const { 
    cvData, 
    activeLanguage, 
    loadVersionSnapshot, 
    setActiveLanguage, 
    switchLanguage, 
    showToast 
  } = useCV();
  const [selectedPromptId, setSelectedPromptId] = useState('recruiter_audit');
  const selectedFormat = 'markdown'; // Fixed to Semantic Markdown per R1
  const [userCommentary, setUserCommentary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [copied, setCopied] = useState(false);

  // External LLM Response Ingestion State
  const [externalLLMResponse, setExternalLLMResponse] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState(null);
  const [targetTranslationLang, setTargetTranslationLang] = useState('en');

  // UX States: Collapsible Prompt Preview & External AI Waiting Hand-off Mode
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  // Reset ingestion and waiting state on prompt change or modal open
  useEffect(() => {
    setExternalLLMResponse('');
    setApplyStatus(null);
    setIsWaitingForAI(false);
    setIsPromptExpanded(false);
  }, [selectedPromptId, isOpen]);

  const localizedPrompts = useMemo(() => {
    return getPrompts(activeLanguage);
  }, [activeLanguage]);

  const ui = useMemo(() => {
    return getUI(activeLanguage);
  }, [activeLanguage]);

  const selectedPrompt = useMemo(() => {
    return localizedPrompts.find(p => p.id === selectedPromptId) || localizedPrompts[0] || {};
  }, [localizedPrompts, selectedPromptId]);

  // Identify prompts that require applying an external LLM response
  const isResponseImportablePrompt = useMemo(() => {
    return (
      selectedPromptId === 'translate_english' ||
      selectedPromptId === 'bring_your_own_cv' ||
      selectedPrompt?.category === 'localization' ||
      selectedPrompt?.requires_json_response === true
    );
  }, [selectedPromptId, selectedPrompt]);

  // Automatic Layout Mode Detection (R1):
  // Detects active layout dynamically from cvData without manual state or dropdown selectors
  const isAtsMode = useMemo(() => {
    return cvData?.layout?.isAtsMode === true || cvData?.layout?.type === '1-column';
  }, [cvData?.layout?.isAtsMode, cvData?.layout?.type]);

  const targetCvData = useMemo(() => {
    return {
      ...cvData,
      layout: {
        ...(cvData?.layout || {}),
        type: isAtsMode ? '1-column' : '2-column',
        isAtsMode: isAtsMode
      }
    };
  }, [cvData, isAtsMode]);

  const compiledPayload = useMemo(() => {
    return buildAIPromptPayload(targetCvData, selectedPromptId, {
      format: selectedFormat,
      jobDescription,
      userCommentary,
      lang: activeLanguage
    });
  }, [targetCvData, selectedPromptId, selectedFormat, jobDescription, userCommentary, activeLanguage]);

  const handleApplyResponse = async () => {
    if (!externalLLMResponse || !externalLLMResponse.trim()) {
      setApplyStatus({
        type: 'error',
        message: 'Por favor, pega la respuesta JSON del LLM antes de aplicar.'
      });
      return;
    }

    setIsApplying(true);
    setApplyStatus(null);

    try {
      // 1. Clean and parse raw JSON from external LLM (handles markdown fences, preamble, trailing commas, etc.)
      const parsed = cleanAndParseRawJSON(externalLLMResponse);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('No se pudo encontrar un JSON válido en la respuesta pegada. Asegúrate de copiar el bloque ```json ... ``` devuelto por el LLM.');
      }

      // 2. Normalize and validate against Ressume CV schema
      const validatedCV = normalizeAnyJSONToCVSnapshot(parsed);
      if (!validatedCV) {
        throw new Error('El JSON devuelto no cumple con la estructura de currículum válida requerida por Ressume.');
      }

      // 3. Save current CV snapshot with the source language legend (e.g. "ESPAÑOL")
      const currentCandidateName = cvData?.profile?.name || 'CV';
      const sourceLangLegend = getLanguageLegend(activeLanguage); // e.g. 'ESPAÑOL'
      const currentVersionTitle = `${currentCandidateName} - ${sourceLangLegend}`;

      const currentSnapshotToSave = {
        ...cvData,
        versionName: currentVersionTitle,
        activeVersionName: currentVersionTitle
      };
      const currentThumbnail = await generateThumbnail(currentSnapshotToSave);
      await saveVersion(currentVersionTitle, currentSnapshotToSave, currentThumbnail);

      // 4. Determine target language and target version title
      const isTranslation = selectedPromptId === 'translate_english' || selectedPrompt?.category === 'localization';
      const effectiveTargetLang = isTranslation ? (targetTranslationLang || 'en') : (activeLanguage || 'es');
      const targetLangLegend = getLanguageLegend(effectiveTargetLang);

      const newCandidateName = validatedCV.profile?.name || currentCandidateName;
      const newVersionTitle = selectedPromptId === 'bring_your_own_cv'
        ? `${newCandidateName} - IMPORTADO ATS`
        : `${newCandidateName} - ${targetLangLegend}`;

      const newSnapshotToSave = {
        ...validatedCV,
        versionName: newVersionTitle,
        activeVersionName: newVersionTitle
      };
      const newThumbnail = await generateThumbnail(newSnapshotToSave);
      const savedNew = await saveVersion(newVersionTitle, newSnapshotToSave, newThumbnail);

      // 5. Apply into editor state and make it the active CV
      if (typeof loadVersionSnapshot === 'function') {
        loadVersionSnapshot({
          ...newSnapshotToSave,
          activeVersionId: savedNew?.id
        });
      }

      // 6. Set active language
      if (typeof setActiveLanguage === 'function') {
        setActiveLanguage(effectiveTargetLang);
      } else if (typeof switchLanguage === 'function') {
        switchLanguage(effectiveTargetLang);
      }

      const successMsg = `¡Copia de respaldo guardada con éxito como "${currentVersionTitle}" y nuevo CV en ${targetLangLegend} activado en el editor!`;
      setApplyStatus({
        type: 'success',
        message: successMsg,
        savedOld: currentVersionTitle,
        savedNew: newVersionTitle
      });

      if (typeof showToast === 'function') {
        showToast(successMsg, 'success');
      }
    } catch (err) {
      console.error('Error aplicando respuesta del LLM:', err);
      setApplyStatus({
        type: 'error',
        message: err.message || 'Error al validar y aplicar el JSON devuelto por el LLM.'
      });
      if (typeof showToast === 'function') {
        showToast(err.message || 'Error al aplicar el JSON', 'error');
      }
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (isResponseImportablePrompt) {
        setIsWaitingForAI(true);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setExternalLLMResponse(text);
          if (applyStatus) setApplyStatus(null);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleDownload = () => {
    const candidateName = cvData?.profile?.name ? cvData.profile.name.replace(/\s+/g, '_') : 'CV';
    const blob = new Blob([compiledPayload], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidateName}_AI_Prompt_${selectedPromptId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
        style={{
        background: 'var(--container-color, #ffffff)',
        color: 'var(--text-color, #333333)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        border: '1px solid rgba(150, 150, 150, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(150, 150, 150, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BrainCircuit size={28} color="#3874ff" />
            <div>
              <h3 id="ai-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Generar Prompts de IA con los datos de tu CV</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-color-light, #777)' }}>
                Reemplazo semántico del PDF para modelos de lenguaje (GPT, Claude, Gemini, DeepSeek) y ATS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Cerrar modal"
            data-testid="ai-modal-close-btn"
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

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Row: Prompt Selection (Layout & Format Selectors are kept commented out/hidden per R1) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            
            {/* Prompt Selector */}
            <div>
              <label 
                htmlFor="ai-prompt-select"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                <Target size={15} color="#3874ff" /> Seleccionar Objetivo del Prompt:
              </label>
              <select 
                id="ai-prompt-select"
                data-testid="ai-prompt-select"
                value={selectedPromptId} 
                onChange={(e) => setSelectedPromptId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(150, 150, 150, 0.3)',
                  background: 'var(--body-color, #f9f9f9)',
                  color: 'inherit',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {localizedPrompts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Language for Translation */}
            {(selectedPromptId === 'translate_english' || selectedPrompt?.category === 'localization') && (
              <div>
                <label 
                  htmlFor="ai-target-lang-select"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
                >
                  <Target size={15} color="#10b981" /> Idioma Destino (Traducción):
                </label>
                <select 
                  id="ai-target-lang-select"
                  data-testid="ai-target-lang-select"
                  value={targetTranslationLang} 
                  onChange={(e) => setTargetTranslationLang(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(150, 150, 150, 0.3)',
                    background: 'var(--body-color, #f9f9f9)',
                    color: 'inherit',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="en">Inglés (English - US Tech / Global)</option>
                  <option value="es">Español (Spanish - LatAm / España)</option>
                  <option value="de">Alemán (Deutsch - DACH)</option>
                  <option value="fr">Francés (Français - France / Canada)</option>
                  <option value="pt">Portugués (Português - Brasil / Portugal)</option>
                  <option value="it">Italiano (Italian)</option>
                </select>
              </div>
            )}

            {/* Layout Mode Selector (Preserved commented out - Layout is auto-detected from active CV context without manual selectors)
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <Layout size={15} color="#6366f1" /> Disposición de Abstracción:
              </label>
              <select 
                value={isAtsMode ? '1-column' : '2-column'} 
                disabled
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(150, 150, 150, 0.3)',
                  background: 'var(--body-color, #f9f9f9)',
                  color: 'inherit',
                  fontSize: '0.88rem',
                  cursor: 'not-allowed'
                }}
              >
                <option value="1-column">1 Columna — Optimizado ATS</option>
                <option value="2-column">2 Columnas — Visual para Reclutador</option>
              </select>
            </div>
            */}

            {/* Abstraction Format Selector (Preserved commented out - Format locked strictly to Semantic Markdown)
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <FileText size={15} color="#10b981" /> Formato de Abstracción:
              </label>
              <select 
                value={selectedFormat} 
                disabled
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(150, 150, 150, 0.3)',
                  background: 'var(--body-color, #f9f9f9)',
                  color: 'inherit',
                  fontSize: '0.88rem',
                  cursor: 'not-allowed'
                }}
              >
                <option value="markdown">Semantic Markdown (Recomendado)</option>
                <option value="xml">Semantic XML</option>
                <option value="ats_text">Texto Plano Lineal</option>
                <option value="json">JSON Schema Nativo</option>
              </select>
            </div>
            */}
          </div>

          {/* Description of Selected Prompt - Obsidian Info Callout */}
          {selectedPrompt.description && (
            <div 
              className="obsidian-callout"
              style={{
                background: 'rgba(8, 109, 221, 0.08)',
                borderLeft: '4px solid rgba(8, 109, 221, 1)',
                padding: '0.75rem 1rem',
                borderRadius: '4px 8px 8px 4px',
                fontSize: '0.85rem'
              }}
            >
              <div 
                className="callout-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  color: 'rgba(8, 109, 221, 1)',
                  marginBottom: '0.25rem'
                }}
              >
                <Target size={15} color="rgba(8, 109, 221, 1)" />
                <span>Descripción del Objetivo:</span>
              </div>
              <div className="callout-content" style={{ color: 'inherit', opacity: 0.9 }}>
                {selectedPrompt.description}
              </div>
            </div>
          )}

          {/* Universal User Commentary Input (R1) */}
          <div>
            <label 
              htmlFor="ai-user-commentary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              <MessageSquare size={15} color="#8b5cf6" /> Instrucciones Adicionales o Comentarios Libres (Opcional):
            </label>
            <textarea
              id="ai-user-commentary"
              data-testid="ai-user-commentary"
              rows={3}
              value={userCommentary}
              onChange={(e) => setUserCommentary(e.target.value)}
              placeholder="Ej: Enfatizar experiencia en arquitectura cloud y microservicios, orientar el perfil a empresas de EE.UU., descartar proyectos académicos antiguos..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(150, 150, 150, 0.3)',
                background: 'var(--body-color, #f9f9f9)',
                color: 'inherit',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Optional Job Description Input (Gated exclusively for job_matcher or required_inputs) */}
          {(selectedPrompt.id === 'job_matcher' || selectedPrompt.required_inputs?.includes('job_description')) && (
            <div>
              <label 
                htmlFor="ai-job-description"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                <Briefcase size={15} color="#e11d48" /> Pegar Descripción de la Oferta Laboral (Job Description):
              </label>
              <textarea
                id="ai-job-description"
                data-testid="ai-job-description"
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Pega aquí los requisitos y responsabilidades de la oferta de trabajo para calcular compatibilidad..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(150, 150, 150, 0.3)',
                  background: 'var(--body-color, #f9f9f9)',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Waiting Banner & Stepper (Visible when user has copied prompt and is waiting for external AI) */}
          {isWaitingForAI && isResponseImportablePrompt && (
            <div 
              data-testid="ai-waiting-banner"
              style={{
                padding: '1.2rem',
                borderRadius: '12px',
                background: 'rgba(56, 116, 255, 0.07)',
                border: '1.5px solid rgba(56, 116, 255, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#3874ff',
                    display: 'inline-block',
                    boxShadow: '0 0 10px #3874ff'
                  }} />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#3874ff' }}>
                    Esperando respuesta de tu IA externa...
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWaitingForAI(false)}
                  data-testid="ai-back-to-setup-btn"
                  style={{
                    background: 'none',
                    border: '1px solid rgba(56, 116, 255, 0.3)',
                    borderRadius: '6px',
                    padding: '0.3rem 0.65rem',
                    color: '#3874ff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowLeft size={13} /> Volver a Configurar
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.45', color: 'var(--text-color, #333333)', opacity: 0.9 }}>
                Hemos copiado el prompt a tu portapapeles. Ve a otra pestaña, interactúa con el modelo de lenguaje de tu preferencia y regresa a pegar aquí el bloque de código JSON generado.
              </p>

              {/* Guided Stepper */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.65rem',
                background: 'var(--body-color, rgba(255, 255, 255, 0.7))',
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(56, 116, 255, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem' }}>
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', color: '#10b981' }}>1. Prompt copiado</strong>
                    <span style={{ color: 'var(--text-color-light, #777)', fontSize: '0.75rem' }}>Listo en portapapeles</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem' }}>
                  <ExternalLink size={16} color="#3874ff" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', color: '#3874ff' }}>2. Ve a tu IA externa</strong>
                    <span style={{ color: 'var(--text-color-light, #777)', fontSize: '0.75rem' }}>
                      {selectedPromptId === 'bring_your_own_cv' ? 'Pega prompt + adjunta CV' : 'Pega el prompt (Ctrl+V)'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem' }}>
                  <Download size={16} color="#8b5cf6" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', color: '#8b5cf6' }}>3. Copia el JSON</strong>
                    <span style={{ color: 'var(--text-color-light, #777)', fontSize: '0.75rem' }}>Copia el bloque devuelto</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem' }}>
                  <ArrowDownToLine size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', color: '#f59e0b' }}>4. Pega aquí abajo</strong>
                    <span style={{ color: 'var(--text-color-light, #777)', fontSize: '0.75rem' }}>Importa a tu CV con 1 clic</span>
                  </div>
                </div>
              </div>

              {/* Quick External AI Launchers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color-light, #777)' }}>
                  Abrir IA en nueva pestaña:
                </span>
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(56, 116, 255, 0.1)',
                    color: '#3874ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  ChatGPT <ExternalLink size={11} />
                </a>
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(56, 116, 255, 0.1)',
                    color: '#3874ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  Claude <ExternalLink size={11} />
                </a>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(56, 116, 255, 0.1)',
                    color: '#3874ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  Gemini <ExternalLink size={11} />
                </a>
                <a
                  href="https://chat.deepseek.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(56, 116, 255, 0.1)',
                    color: '#3874ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  DeepSeek <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Live Preview Container (Collapsible by default per UX requirement to prevent cognitive overload) */}
          <div style={{
            border: '1px solid rgba(150, 150, 150, 0.25)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            background: 'rgba(0, 0, 0, 0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isPromptExpanded ? '0.6rem' : '0.35rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                <Eye size={15} color="#3874ff" /> Vista Previa del Payload Completo (Prompt + Datos Estáticos):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-color-light, #888)' }}>
                  {compiledPayload.length} caracteres (~{Math.round(compiledPayload.length / 4)} tokens)
                </span>
                <button
                  type="button"
                  onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                  data-testid="ai-toggle-prompt-btn"
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
              <pre 
                data-testid="ai-payload-preview"
                style={{
                  background: '#18181b',
                  color: '#d4d4d4',
                  padding: isPromptExpanded ? '1rem' : '0.45rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: isPromptExpanded ? '0.8rem' : '0.68rem',
                  lineHeight: isPromptExpanded ? '1.45' : '1.25',
                  fontFamily: '"Cascadia Code", Consolas, Monaco, monospace',
                  maxHeight: isPromptExpanded ? '260px' : '44px',
                  overflowY: isPromptExpanded ? 'auto' : 'hidden',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  opacity: isPromptExpanded ? 1 : 0.75,
                  transition: 'max-height 0.2s ease, opacity 0.2s ease'
                }}
              >
                {compiledPayload}
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

          {/* Setup Callout to initiate external AI waiting flow for importable prompts */}
          {!isWaitingForAI && isResponseImportablePrompt && (
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
                  Flujo en 2 pasos para {selectedPrompt.name}:
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-color-light, #666)' }}>
                  1. Copia el prompt optimizado. 2. Ve a ChatGPT o Claude y vuelve a pegar la respuesta.
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopy}
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
                <Copy size={14} /> Copiar Prompt y Esperar IA ➔
              </button>
            </div>
          )}

          {/* External LLM Response Ingestion Section */}
          {isResponseImportablePrompt && (
            <div 
              data-testid="ai-response-ingestion-container"
              style={{
                marginTop: '0.5rem',
                padding: '1.25rem',
                borderRadius: '12px',
                border: isWaitingForAI ? '2px solid rgba(56, 116, 255, 0.45)' : '1px solid rgba(56, 116, 255, 0.35)',
                background: isWaitingForAI ? 'rgba(56, 116, 255, 0.04)' : 'rgba(56, 116, 255, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                boxShadow: isWaitingForAI ? '0 4px 16px rgba(56, 116, 255, 0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <label 
                  htmlFor="ai-response-input"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, color: '#3874ff' }}
                >
                  <Sparkles size={18} color="#3874ff" />
                  {isWaitingForAI ? 'Pegar Respuesta del LLM Externo (JSON de Salida):' : 'Pegar Respuesta del LLM Externo (JSON de Salida):'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(56, 116, 255, 0.3)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.55rem',
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
                  {externalLLMResponse && (
                    <button
                      type="button"
                      onClick={() => setExternalLLMResponse('')}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(150, 150, 150, 0.3)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.55rem',
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
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color-light, #888)' }}>
                    Directiva Estricta: Solo JSON
                  </span>
                </div>
              </div>

              {/* Obsidian Info Callout */}
              <div 
                className="obsidian-callout"
                style={{
                  background: 'rgba(8, 109, 221, 0.08)',
                  borderLeft: '4px solid rgba(8, 109, 221, 1)',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px 8px 8px 4px',
                  fontSize: '0.85rem'
                }}
              >
                <div 
                  className="callout-title"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    color: 'rgba(8, 109, 221, 1)',
                    marginBottom: '0.25rem'
                  }}
                >
                  <Target size={16} color="rgba(8, 109, 221, 1)" />
                  <span>Copia de Respaldo Automática & Activación Inmediata:</span>
                </div>
                <div className="callout-content" style={{ color: 'inherit', opacity: 0.9 }}>
                  {selectedPromptId === 'translate_english' || selectedPrompt?.category === 'localization'
                    ? `Al aplicar la respuesta del LLM, se guardará automáticamente una copia del CV actual con la leyenda "${getLanguageLegend(activeLanguage)}" en el Gestor de Versiones, y se cargará e iniciará inmediatamente el nuevo CV en "${getLanguageLegend(targetTranslationLang)}" como CV activo en el editor.`
                    : `Al aplicar la respuesta del LLM, se guardará automáticamente una copia del CV actual con la leyenda "${getLanguageLegend(activeLanguage)}" en el Gestor de Versiones, y se cargará el nuevo CV importado inmediatamente en el editor.`
                  }
                </div>
              </div>

              {/* Prominent / Giant Textarea for Response */}
              <textarea
                id="ai-response-input"
                data-testid="ai-response-input"
                rows={isWaitingForAI ? 12 : 7}
                value={externalLLMResponse}
                onChange={(e) => {
                  setExternalLLMResponse(e.target.value);
                  if (applyStatus) setApplyStatus(null);
                }}
                placeholder={
                  selectedPromptId === 'translate_english' || selectedPrompt?.category === 'localization'
                    ? "Pega aquí la respuesta devuelta por ChatGPT, Claude, Gemini o DeepSeek (ej: ```json { ... } ``` o { ... })..."
                    : "Pega aquí el código JSON devuelto por el conversor ATS..."
                }
                style={{
                  width: '100%',
                  minHeight: isWaitingForAI ? '260px' : '150px',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(150, 150, 150, 0.35)',
                  background: 'var(--body-color, #f9f9f9)',
                  color: 'inherit',
                  fontFamily: '"Cascadia Code", Consolas, Monaco, monospace',
                  fontSize: '0.84rem',
                  lineHeight: '1.4',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleApplyResponse}
                  disabled={isApplying || !externalLLMResponse.trim()}
                  data-testid="ai-apply-response-btn"
                  style={{
                    padding: '0.7rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: (!isApplying && externalLLMResponse.trim()) ? 'pointer' : 'not-allowed',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: (!isApplying && externalLLMResponse.trim()) ? 1 : 0.6
                  }}
                >
                  {isApplying ? (
                    <>Procesando y guardando copia de respaldo...</>
                  ) : (
                    <>
                      <ArrowDownToLine size={16} /> Guardar Estado ({getLanguageLegend(activeLanguage)}) y Aplicar Nuevo CV
                    </>
                  )}
                </button>
              </div>

              {/* Error Callout */}
              {applyStatus?.type === 'error' && (
                <div 
                  className="obsidian-callout"
                  data-testid="ai-apply-error-callout"
                  style={{
                    background: 'rgba(233, 49, 71, 0.1)',
                    borderLeft: '4px solid rgba(233, 49, 71, 1)',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px 8px 8px 4px',
                    fontSize: '0.85rem'
                  }}
                >
                  <div 
                    className="callout-title"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      color: 'rgba(233, 49, 71, 1)',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <AlertCircle size={16} color="rgba(233, 49, 71, 1)" />
                    <span>Error al procesar la respuesta del LLM</span>
                  </div>
                  <div className="callout-content">
                    {applyStatus.message}
                  </div>
                </div>
              )}

              {/* Success Callout */}
              {applyStatus?.type === 'success' && (
                <div 
                  className="obsidian-callout"
                  data-testid="ai-apply-success-callout"
                  style={{
                    background: 'rgba(46, 204, 113, 0.12)',
                    borderLeft: '4px solid rgba(46, 204, 113, 1)',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px 8px 8px 4px',
                    fontSize: '0.85rem'
                  }}
                >
                  <div 
                    className="callout-title"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      color: '#27ae60',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <CheckCircle2 size={16} color="#27ae60" />
                    <span>¡Operación Exitosa!</span>
                  </div>
                  <div className="callout-content">
                    {applyStatus.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(150, 150, 150, 0.2)',
          display: 'flex',
          justifyContent: isWaitingForAI ? 'space-between' : 'flex-end',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          {isWaitingForAI && (
            <button
              type="button"
              onClick={() => setIsWaitingForAI(false)}
              style={{
                background: 'none',
                border: '1px solid rgba(150, 150, 150, 0.3)',
                borderRadius: '8px',
                padding: '0.6rem 1.1rem',
                fontSize: '0.85rem',
                color: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={15} /> Volver a Configurar
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {copied && (
              <span style={{ color: '#2ecc71', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} color="#2ecc71" /> ¡Copiado al portapapeles!
              </span>
            )}
            <button
              onClick={handleDownload}
              data-testid="ai-download-btn"
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
              <Download size={16} /> Descargar Archivo
            </button>
            <button
              onClick={handleCopy}
              data-testid="ai-copy-btn"
              style={{
                padding: '0.6rem 1.4rem',
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
              <Copy size={16} /> {isResponseImportablePrompt ? (isWaitingForAI ? 'Volver a Copiar Prompt' : 'Copiar Prompt y Esperar IA ➔') : 'Copiar Prompt + CV para IA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIExportModal;
