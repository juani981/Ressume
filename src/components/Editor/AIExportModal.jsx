import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCV } from '../../context/CVContext';
import { getPrompts, getUI } from '../../locales/index';
import { buildAIPromptPayload, getLanguageLegend } from '../../utils/aiExporter';
import { saveVersion } from '../../utils/versionStorage';
import { generateThumbnail } from '../../utils/thumbnailGenerator';
import { cleanAndParseRawJSON, normalizeAnyJSONToCVSnapshot } from '../../utils/universalJsonImporter';
import { formatBackupVersionTitle } from '../../services/ai/bidirectionalPromptContract';
import { useModalTheme } from '../../hooks/useModalTheme';
import { ModalThemeToggle } from '../common/ModalThemeToggle';
import ModalHelpButton from '../common/ModalHelpButton';
import { TOUR_IDS } from '../../context/TourContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  UploadCloud,
  FileUp,
  Globe,
  ShieldCheck,
  CheckCheck,
  FileCheck,
  Layers,
  FileCode,
  Clock,
  Info
} from 'lucide-react';

const LANGUAGE_OPTIONS = [
  { code: 'en', tag: 'US', name: 'Inglés (US Tech)', sub: 'Silicon Valley / Global Tech' },
  { code: 'es', tag: 'ES', name: 'Español', sub: 'LatAm / España' },
  { code: 'de', tag: 'DE', name: 'Alemán', sub: 'DACH Tech Market' },
  { code: 'fr', tag: 'FR', name: 'Francés', sub: 'France / Canada' },
  { code: 'pt', tag: 'PT', name: 'Portugués', sub: 'Brasil / Portugal' },
  { code: 'it', tag: 'IT', name: 'Italiano', sub: 'Italy' },
];

const AI_PROVIDERS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', color: '#10a37f' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai', color: '#d97706' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', color: '#2563eb' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', color: '#0d9488' }
];

const AIExportModal = ({ 
  isOpen, 
  onClose,
  initialPromptId = 'recruiter_audit',
  unidirectionalOnly = false
}) => {
  const { 
    cvData, 
    activeLanguage, 
    loadVersionSnapshot, 
    setActiveLanguage, 
    switchLanguage, 
    showToast 
  } = useCV();
  const { modalTheme, isDark, toggleModalTheme } = useModalTheme();
  const modalRef = useRef(null);
  useFocusTrap(modalRef, { isOpen, onClose });

  const [selectedPromptId, setSelectedPromptId] = useState(initialPromptId || 'recruiter_audit');
  const selectedFormat = 'markdown'; // Fixed to Semantic Markdown per R1
  const [userCommentary, setUserCommentary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedProvider, setCopiedProvider] = useState(null);

  // Sync initialPromptId when provided or modal opens
  useEffect(() => {
    if (initialPromptId) {
      setSelectedPromptId(initialPromptId);
    }
  }, [initialPromptId, isOpen]);

  // External LLM Response Ingestion State
  const [externalLLMResponse, setExternalLLMResponse] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState(null);
  const [sourceTranslationLang, setSourceTranslationLang] = useState(() => (activeLanguage === 'en' ? 'en' : 'es'));
  const [targetTranslationLang, setTargetTranslationLang] = useState(() => (activeLanguage === 'en' ? 'es' : 'en'));

  // Synchronize translation languages when activeLanguage changes
  useEffect(() => {
    const src = activeLanguage === 'en' ? 'en' : 'es';
    setSourceTranslationLang(src);
    setTargetTranslationLang(src === 'en' ? 'es' : 'en');
  }, [activeLanguage]);

  const handleSourceTranslationLangChange = (newSource) => {
    setSourceTranslationLang(newSource);
    setTargetTranslationLang(newSource === 'en' ? 'es' : 'en');
  };

  const handleTargetTranslationLangChange = (newTarget) => {
    setTargetTranslationLang(newTarget);
    setSourceTranslationLang(newTarget === 'en' ? 'es' : 'en');
  };

  // UX States: Collapsible Prompt Preview & External AI Waiting Hand-off Mode
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  // BYO-CV UX States
  const [byoSourceTab, setByoSourceTab] = useState('upload'); // 'upload' | 'paste'
  const [byoUploadedFile, setByoUploadedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showAdvancedCommentary, setShowAdvancedCommentary] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.name.match(/\.(txt|md|json)$/i)) {
      setByoUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setUserCommentary(text);
          if (typeof showToast === 'function') {
            showToast(`Archivo "${file.name}" leído (${text.split(/\s+/).filter(Boolean).length} palabras)`, 'success', 3000);
          }
        }
      };
      reader.onerror = () => {
        if (typeof showToast === 'function') {
          showToast('Error al leer el archivo del disco', 'error', 3500);
        }
      };
      reader.readAsText(file);
    } else {
      if (typeof showToast === 'function') {
        showToast(`Para documentos ${file.name.split('.').pop().toUpperCase()}, adjúntalo directamente en ChatGPT o Claude junto con el prompt copiado para aprovechar su visión multimodal.`, 'info', 4500);
      }
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.name.match(/\.(txt|md|json)$/i)) {
      setByoUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setUserCommentary(text);
          if (typeof showToast === 'function') {
            showToast(`Archivo "${file.name}" leído (${text.split(/\s+/).filter(Boolean).length} palabras)`, 'success', 3000);
          }
        }
      };
      reader.onerror = () => {
        if (typeof showToast === 'function') {
          showToast('Error al leer el archivo del disco', 'error', 3500);
        }
      };
      reader.readAsText(file);
    } else {
      if (typeof showToast === 'function') {
        showToast(`Para documentos ${file.name.split('.').pop().toUpperCase()}, adjúntalo directamente en ChatGPT o Claude junto con el prompt copiado para aprovechar su visión multimodal.`, 'info', 4500);
      }
    }
  };

  // Reset ingestion, waiting state and optional free text on prompt change or modal open/close
  // Backlog: free-text notes must not persist across prompts or modal sessions
  useEffect(() => {
    setExternalLLMResponse('');
    setApplyStatus(null);
    setIsWaitingForAI(false);
    setIsPromptExpanded(false);
    setCopiedProvider(null);
    setUserCommentary('');
    setJobDescription('');
    if (isOpen && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-modal-prompt-changed', {
        detail: { promptId: selectedPromptId }
      }));
    }
  }, [selectedPromptId, isOpen]);

  const localizedPrompts = useMemo(() => {
    return getPrompts(activeLanguage);
  }, [activeLanguage]);

  // Filtered prompts: when unidirectionalOnly is true, hide bidirectional transformation prompts
  const filteredPrompts = useMemo(() => {
    if (unidirectionalOnly) {
      return localizedPrompts.filter(p => (
        (p.id !== 'translate_english' && p.id !== 'bring_your_own_cv' && !p.requires_json_response) ||
        p.id === selectedPromptId
      ));
    }
    return localizedPrompts;
  }, [localizedPrompts, unidirectionalOnly, selectedPromptId]);

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
      lang: sourceTranslationLang || activeLanguage,
      targetLang: targetTranslationLang
    });
  }, [targetCvData, selectedPromptId, selectedFormat, jobDescription, userCommentary, activeLanguage, sourceTranslationLang, targetTranslationLang]);

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

      // 3. Save current CV snapshot adhering to [subtitulo + Nombre][Backup][idioma] format (L125)
      const currentSubtitle = cvData?.profile?.subtitle || cvData?.profile?.title || '';
      const currentCandidateName = cvData?.profile?.name || 'CV';
      const currentVersionTitle = formatBackupVersionTitle(cvData, activeLanguage);

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
      const newSubtitle = validatedCV.profile?.subtitle || validatedCV.profile?.title || currentSubtitle;
      const newVersionTitle = selectedPromptId === 'bring_your_own_cv'
        ? `[${newSubtitle ? `${newSubtitle} - ` : ''}${newCandidateName}][IMPORTADO ATS]`
        : `[${newSubtitle ? `${newSubtitle} - ` : ''}${newCandidateName}][${targetLangLegend}]`;

      const newSnapshotToSave = {
        ...validatedCV,
        layout: {
          ...(validatedCV.layout || {}),
          language: effectiveTargetLang
        },
        language: effectiveTargetLang,
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

  // Impact Summary (Requirement 3: Enumerating elements in input JSON)
  const impactSummary = useMemo(() => {
    if (!externalLLMResponse || !externalLLMResponse.trim()) return null;
    try {
      const parsed = cleanAndParseRawJSON(externalLLMResponse);
      if (!parsed || typeof parsed !== 'object') return null;
      const validated = normalizeAnyJSONToCVSnapshot(parsed);
      if (!validated) return null;

      const candidateName = validated.profile?.name || cvData?.profile?.name || 'CV';
      const candidateSubtitle = validated.profile?.subtitle || '';
      const sections = Array.isArray(validated.sections) ? validated.sections : [];

      const expSection = sections.find(s => s.type === 'list' && (s.id === 'experience' || /experiencia|experience/i.test(s.title)));
      const expItems = expSection?.items || [];
      const totalBullets = expItems.reduce((acc, it) => acc + (Array.isArray(it.bullets) ? it.bullets.length : (it.description ? 1 : 0)), 0);

      const skillSection = sections.find(s => s.type === 'skills' || /habilidad|skill/i.test(s.title));
      const skillCategories = skillSection?.items || [];
      const totalSkillsCount = skillCategories.reduce((acc, cat) => {
        if (cat.description) {
          return acc + cat.description.split(',').filter(s => s.trim().length > 0).length;
        }
        return acc;
      }, 0);

      const eduSection = sections.find(s => s.type === 'education' || /educaci|education/i.test(s.title));
      const eduItems = eduSection?.items || [];

      const certSection = sections.find(s => s.id === 'certificates' || /certifi/i.test(s.title));
      const langSection = sections.find(s => s.id === 'languages' || /idioma|language/i.test(s.title));

      return {
        isValid: true,
        candidateName,
        candidateSubtitle,
        totalSections: sections.length,
        expCount: expItems.length,
        totalBullets,
        skillsCategoriesCount: skillCategories.length,
        totalSkillsCount,
        eduCount: eduItems.length,
        certCount: certSection?.items?.length || 0,
        langCount: langSection?.items?.length || 0,
        layoutType: validated.layout?.type || '1-column',
        isAtsMode: validated.layout?.isAtsMode ?? true,
      };
    } catch (_) {
      return null;
    }
  }, [externalLLMResponse, cvData?.profile?.name]);

  // Auto-detect and auto-paste LLM response from clipboard upon window focus (Requirement 2)
  useEffect(() => {
    if (!isOpen || !isResponseImportablePrompt) return;

    const handleWindowFocus = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text && text.trim() && text.trim().length > 30 && text.trim() !== externalLLMResponse.trim()) {
            const parsed = cleanAndParseRawJSON(text);
            if (parsed && typeof parsed === 'object') {
              setExternalLLMResponse(text);
              if (applyStatus) setApplyStatus(null);
              if (typeof showToast === 'function') {
                showToast('Se pegó automáticamente la respuesta de tu IA desde el portapapeles y se validó la estructura.', 'success', 3500);
              }
            }
          }
        }
      } catch (_) {
        // Silently ignore clipboard permission errors
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isOpen, isResponseImportablePrompt, externalLLMResponse, applyStatus, showToast]);

  if (!isOpen) return null;

  const handleCopy = async (targetProviderName = null) => {
    try {
      await navigator.clipboard.writeText(compiledPayload);
      setCopied(true);
      setCopiedProvider(targetProviderName);
      setTimeout(() => {
        setCopied(false);
        setCopiedProvider(null);
      }, 2500);
      if (isResponseImportablePrompt) {
        setIsWaitingForAI(true);
      }
      if (!targetProviderName && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ai-modal-tour-action', {
          detail: { action: 'copy_clicked', promptId: selectedPromptId }
        }));
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopyAndOpenProvider = async (url, providerName) => {
    await handleCopy(providerName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-modal-tour-action', {
        detail: { action: 'provider_clicked', providerName, promptId: selectedPromptId }
      }));
    }
    try {
      if (typeof window !== 'undefined' && window.open) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.warn('Failed to open external AI window', e);
    }
    if (typeof showToast === 'function') {
      showToast(`Prompt copiado al portapapeles. Pégalo en ${providerName} con Ctrl+V.`, 'success', 4000);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setExternalLLMResponse(text);
          if (applyStatus) setApplyStatus(null);
          const parsed = cleanAndParseRawJSON(text);
          if (parsed && typeof parsed === 'object' && typeof showToast === 'function') {
            showToast('Se pegó información del portapapeles y se validó automáticamente.', 'success', 3500);
          }
        }
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ai-modal-tour-action', {
          detail: { action: 'paste_clicked', promptId: selectedPromptId }
        }));
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
     <div
        style={{
           position: "fixed",
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           backgroundColor: "rgba(0, 0, 0, 0.65)",
           backdropFilter: "blur(5px)",
           display: "flex",
           alignItems: "center",
           justifyContent: "center",
           zIndex: 1000,
           padding: "1.5rem",
        }}>
        <div
           ref={modalRef}
           role="dialog"
           aria-modal="true"
           aria-labelledby="ai-modal-title"
           data-theme={modalTheme}
           data-prompt-id={selectedPromptId}
           className="ai-modal-dialog"
           style={{
              background: isDark ? "#0f172a" : "#ffffff",
              color: isDark ? "#f8fafc" : "#0f172a",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: isDark
                 ? "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
                 : "0 20px 40px rgba(0,0,0,0.25)",
              border: isDark
                 ? "1px solid #334155"
                 : "1px solid rgba(150, 150, 150, 0.2)",
              overflow: "hidden",
           }}>
           {/* Modal Header */}
           <div
              style={{
                 padding: "1.25rem 1.5rem",
                 borderBottom: isDark
                    ? "1px solid #1e293b"
                    : "1px solid rgba(150, 150, 150, 0.2)",
                 background: isDark ? "#0f172a" : "#ffffff",
                 display: "flex",
                 justifyContent: "space-between",
                 alignItems: "center",
              }}>
              <div
                 style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                 }}>
                 <BrainCircuit size={28} color="#3874ff" />
                 <div>
                    <h3
                       id="ai-modal-title"
                       style={{
                          margin: 0,
                          fontSize: "1.25rem",
                          fontWeight: 600,
                          color: isDark ? "#f8fafc" : "#0f172a",
                       }}>
                       {selectedPromptId === "translate_english"
                          ? "Traducción y Localización Cultural a Inglés (US Tech)"
                          : selectedPromptId === "bring_your_own_cv"
                            ? "Trae tu propio CV (Importar usando IA)"
                            : "Generar Prompts de IA con los datos de tu CV"}
                    </h3>
                    <p
                       style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          color: isDark
                             ? "#94a3b8"
                             : "var(--text-color-light, #777)",
                       }}>
                       {selectedPromptId === "translate_english"
                          ? "Adapta títulos académicos, cargos y experiencia a otro idioma"
                          : selectedPromptId === "bring_your_own_cv"
                            ? "Importa cualquier CV externo desde un archivo"
                            : "Genera prompts útiles para consultar con modelos de lenguaje (GPT, Claude, Gemini, DeepSeek), no necesitas adjuntar ningún archivo"}
                    </p>
                 </div>
              </div>
              <div
                 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                 <ModalHelpButton
                    tourId={
                       selectedPromptId === "bring_your_own_cv"
                          ? TOUR_IDS.IMPORT_CV
                          : TOUR_IDS.AI_EXPORT
                    }
                    isDark={isDark}
                 />
                 <ModalThemeToggle
                    theme={modalTheme}
                    onToggle={toggleModalTheme}
                 />
                 <button
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    data-testid="ai-modal-close-btn"
                    style={{
                       background: "none",
                       border: "none",
                       fontSize: "1.5rem",
                       cursor: "pointer",
                       color: isDark
                          ? "#94a3b8"
                          : "var(--text-color-light, #888)",
                       padding: "0.25rem 0.5rem",
                       borderRadius: "8px",
                       display: "flex",
                       alignItems: "center",
                    }}>
                    <X size={20} />
                 </button>
              </div>
           </div>

           {/* Modal Body */}
           <div
              style={{
                 padding: "1.5rem",
                 overflowY: "auto",
                 display: "flex",
                 flexDirection: "column",
                 gap: "1.25rem",
              }}>
              {/* ========================================================================= */}
              {/* UNIDIRECTIONAL STEP-BY-STEP INTEGRATED WORKFLOW (PROMPTS COMUNES)         */}
              {/* ========================================================================= */}
              {/* Paso 1: Configura el Objetivo del Prompt y Personaliza */}
              <div
                 style={{
                    display: isResponseImportablePrompt ? "none" : "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                    borderBottom: isDark
                       ? "1px solid #1e293b"
                       : "1px solid rgba(150, 150, 150, 0.2)",
                    paddingBottom: "1rem",
                 }}>
                 <div
                    style={{
                       display: isResponseImportablePrompt ? "none" : "flex",
                       alignItems: "center",
                       justifyContent: "space-between",
                       flexWrap: "wrap",
                       gap: "10px",
                    }}>
                    <div
                       style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                       }}>
                       <span
                          style={{
                             width: "24px",
                             height: "24px",
                             borderRadius: "50%",
                             background: "#3874ff",
                             color: "#ffffff",
                             display: "flex",
                             alignItems: "center",
                             justifyContent: "center",
                             fontSize: "0.78rem",
                             fontWeight: 700,
                          }}>
                          1
                       </span>
                       <strong style={{ fontSize: "0.95rem" }}>
                          Paso 1: Selecciona el Objetivo del prompt
                       </strong>
                    </div>

                    <div
                       style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                       }}>
                       <label
                          htmlFor="ai-prompt-select"
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "6px",
                             fontSize: "0.85rem",
                             fontWeight: 600,
                          }}>
                          <Target size={15} color="#3874ff" /> Objetivo:
                       </label>
                       <select
                          id="ai-prompt-select"
                          data-testid="ai-prompt-select"
                          value={selectedPromptId}
                          onChange={(e) => setSelectedPromptId(e.target.value)}
                          style={{
                             padding: "0.45rem 0.75rem",
                             borderRadius: "8px",
                             border: isDark
                                ? "1px solid #334155"
                                : "1px solid rgba(150, 150, 150, 0.3)",
                             background: isDark ? "#1e293b" : "#f8fafc",
                             color: isDark ? "#f8fafc" : "inherit",
                             fontSize: "0.85rem",
                             fontWeight: 500,
                             cursor: "pointer",
                          }}>
                          {filteredPrompts.map((p) => (
                             <option key={p.id} value={p.id}>
                                {p.name}
                             </option>
                          ))}
                       </select>
                    </div>
                 </div>

                 {/* Descripción del Objetivo */}
                 {selectedPrompt.description && (
                    <div
                       className="obsidian-callout"
                       style={{
                          background: "rgba(8, 109, 221, 0.08)",
                          borderLeft: "4px solid rgb(8, 109, 221)",
                          padding: "0.75rem 1rem",
                          borderRadius: "4px 8px 8px 4px",
                          fontSize: "0.85rem",
                       }}>
                       <div
                          className="callout-content"
                          style={{ color: "inherit", opacity: 0.9 }}>
                          {selectedPrompt.description}
                       </div>
                    </div>
                 )}

                 {/* Job Description (si aplica) */}
                 {(selectedPrompt.id === "job_matcher" ||
                    selectedPrompt.required_inputs?.includes(
                       "job_description",
                    )) && (
                    <div>
                       <label
                          htmlFor="ai-job-description"
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "6px",
                             fontSize: "0.85rem",
                             fontWeight: 600,
                             marginBottom: "0.4rem",
                          }}>
                          <Briefcase size={15} color="#e11d48" /> Pegar
                          Descripción de la Oferta Laboral (Job Description):
                       </label>
                       <textarea
                          id="ai-job-description"
                          data-testid="ai-job-description"
                          rows={1}
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Pega aquí los requisitos y responsabilidades de la oferta de trabajo para calcular compatibilidad..."
                          style={{
                             width: "100%",
                             padding: "0.75rem",
                             borderRadius: "8px",
                             border: isDark
                                ? "1px solid #334155"
                                : "1px solid rgba(150, 150, 150, 0.3)",
                             background: isDark ? "#1e293b" : "#f8fafc",
                             color: isDark ? "#f8fafc" : "inherit",
                             fontFamily: "inherit",
                             fontSize: "0.85rem",
                             resize: "vertical",
                             boxSizing: "border-box",
                          }}
                       />
                    </div>
                 )}

                 {/* Instrucciones Adicionales o Comentarios Libres (Opcional) */}
                 <div>
                    <label
                       htmlFor="ai-user-commentary"
                       style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "0.4rem",
                       }}>
                       <MessageSquare size={15} color="#8b5cf6" /> Instrucciones
                       Adicionales o Comentarios Libres (Opcional):
                    </label>
                    <textarea
                       id="ai-user-commentary"
                       data-testid="ai-user-commentary"
                       rows={1}
                       value={userCommentary}
                       onChange={(e) => setUserCommentary(e.target.value)}
                       placeholder="Ej: Enfatizar experiencia en particular, orientar el perfil a empresas de fintech, descartar proyectos académicos antiguos..."
                       style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          border: isDark
                             ? "1px solid #334155"
                             : "1px solid rgba(150, 150, 150, 0.3)",
                          background: isDark ? "#1e293b" : "#f8fafc",
                          color: isDark ? "#f8fafc" : "inherit",
                          fontFamily: "inherit",
                          fontSize: "0.85rem",
                          resize: "vertical",
                          boxSizing: "border-box",
                       }}
                    />
                 </div>
              </div>

              {/* Paso 2: Copia el Prompt y Consulta en tu IA Externa */}
              {!isResponseImportablePrompt && (
                 <div
                    style={{
                       display: "flex",
                       flexDirection: "column",
                       gap: "0.75rem",
                       border: isDark
                          ? "1px solid rgba(56, 116, 255, 0.3)"
                          : "1px solid rgba(56, 116, 255, 0.25)",
                       borderRadius: "10px",
                       padding: "1rem",
                       background: isDark
                          ? "rgba(56, 116, 255, 0.05)"
                          : "rgba(56, 116, 255, 0.02)",
                    }}>
                    <div
                       style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                       }}>
                       <div
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "8px",
                          }}>
                          <span
                             style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "#10b981",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                             }}>
                             2
                          </span>
                          <strong style={{ fontSize: "0.95rem" }}>
                             Paso 2: Copia el Prompt y Consulta en tu IA Externa
                          </strong>
                       </div>

                       <div
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "8px",
                             flexWrap: "wrap",
                          }}>
                          <button
                             type="button"
                             onClick={() => handleCopy(null)}
                             data-testid="ai-copy-btn"
                             style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "7px",
                                padding: "0.5rem 1.15rem",
                                borderRadius: "8px",
                                border: "none",
                                background: copied ? "#10b981" : "#3874ff",
                                color: "#ffffff",
                                fontSize: "0.88rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: copied
                                   ? "0 2px 10px rgba(16, 185, 129, 0.35)"
                                   : "0 2px 10px rgba(56, 116, 255, 0.35)",
                                transition: "all 0.18s ease",
                             }}>
                             {copied ? (
                                <>
                                   <Check size={16} />
                                   <span>¡Prompt Copiado!</span>
                                </>
                             ) : (
                                <>
                                   <Copy size={16} />
                                   <span>Copiar Prompt + CV</span>
                                </>
                             )}
                          </button>

                          {/* <button
                      type="button"
                      onClick={handleDownload}
                      data-testid="ai-download-btn"
                      title="Descargar prompt como archivo Markdown (.md)"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '8px',
                        border: isDark ? '1px solid #334155' : '1px solid rgba(150, 150, 150, 0.3)',
                        background: isDark ? '#1e293b' : '#f8fafc',
                        color: isDark ? '#f8fafc' : 'inherit',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Download size={15} />
                      <span>Descargar .md</span>
                    </button> */}
                       </div>
                    </div>

                    <p
                       style={{
                          margin: 0,
                          fontSize: "0.82rem",
                          color: isDark
                             ? "#94a3b8"
                             : "var(--text-color-light, #666)",
                          lineHeight: "1.4",
                       }}>
                       Copia este prompt con los datos de tu CV ya ensamblados o
                       ábrelo directamente en tu modelo de lenguaje favorito (no
                       requieres adjuntar ningún archivo).
                    </p>

                    {/* Fila de Lanzadores a IA Externa (Links a IA externas) */}
                    <div
                       data-testid="ai-providers-container"
                       style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          marginTop: "0.15rem",
                       }}>
                       <span
                          style={{
                             fontSize: "0.82rem",
                             fontWeight: 600,
                             color: isDark
                                ? "#cbd5e1"
                                : "var(--text-color, #444)",
                          }}>
                          Copiar prompt y abrir en:
                       </span>
                       {AI_PROVIDERS.map((provider) => (
                          <button
                             key={provider.id}
                             type="button"
                             data-testid={`ai-provider-btn-${provider.id}`}
                             onClick={() =>
                                handleCopyAndOpenProvider(
                                   provider.url,
                                   provider.name,
                                )
                             }
                             style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "0.35rem 0.75rem",
                                borderRadius: "7px",
                                border: isDark
                                   ? "1px solid #334155"
                                   : "1px solid rgba(150, 150, 150, 0.3)",
                                background: isDark
                                   ? "#1e293b"
                                   : "var(--body-color, #f9f9f9)",
                                color: provider.color,
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                             }}>
                             <span>{provider.name}</span>
                             <ExternalLink size={12} />
                          </button>
                       ))}
                    </div>

                    {/* Nota sobre modelos múltiples y privacidad */}
                    <div
                       style={{
                          fontSize: "0.75rem",
                          color: isDark
                             ? "#94a3b8"
                             : "var(--text-color-light, #666)",
                          lineHeight: "1.4",
                          marginTop: "0.15rem",
                       }}>
                       Puedes probar este mismo prompt en múltiples IAs (en la
                       nube o locales) sin costes ni almacenamiento de datos
                       para comparar los resultados.
                    </div>

                    {/* Tutorial Paso a Paso Integrado (Stepper Visual) */}
                    <div
                       style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontSize: "0.74rem",
                          color: isDark
                             ? "#94a3b8"
                             : "var(--text-color, #334155)",
                          flexWrap: "wrap",
                          padding: "6px 0 2px 0",
                          borderTop: isDark
                             ? "1px dashed #334155"
                             : "1px dashed rgba(150, 150, 150, 0.25)",
                          marginTop: "0.2rem",
                       }}>
                       <span>
                          <strong>1. Prompt generado con tus datos</strong>
                       </span>
                       <span>
                          → <strong>2. Abre tu IA externa</strong>
                       </span>
                       <span>
                          → <strong>3. Pega con Ctrl+V</strong>
                       </span>
                       <span>
                          →{" "}
                          <strong>4. Recibe feedback y recomendaciones</strong>
                       </span>
                    </div>

                    {/* Feedback Banner cuando se copia */}
                    {copied && (
                       <div
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "6px",
                             fontSize: "0.8rem",
                             color: "#059669",
                             background: "rgba(16, 185, 129, 0.1)",
                             padding: "0.45rem 0.75rem",
                             borderRadius: "6px",
                             fontWeight: 500,
                          }}>
                          <Check size={15} color="#059669" />
                          <span>
                             {copiedProvider
                                ? `¡Copiado al portapapeles! Pégalo en ${copiedProvider} con Ctrl+V para consultar.`
                                : "¡Copiado al portapapeles! Pégalo en tu IA preferida con Ctrl+V para consultar."}
                          </span>
                       </div>
                    )}
                 </div>
              )}

              {/* Description of Selected Prompt - Obsidian Info Callout (Solo para bidireccional) */}
              {isResponseImportablePrompt && selectedPrompt.description && (
                 <div
                    className="obsidian-callout"
                    style={{
                       background: "rgba(8, 109, 221, 0.08)",
                       borderLeft: "4px solid rgb(8, 109, 221)",
                       padding: "0.75rem 1rem",
                       borderRadius: "4px 8px 8px 4px",
                       fontSize: "0.85rem",
                    }}>
                    <div
                       className="callout-content"
                       style={{ color: "inherit", opacity: 0.9 }}>
                       {selectedPrompt.description}
                    </div>
                 </div>
              )}

              {/* ========================================================================= */}
              {/* BIDIRECTIONAL STEP 1 CONTROLS                                             */}
              {/* ========================================================================= */}
              {isResponseImportablePrompt && (
                 <div
                    style={{
                       display: "flex",
                       flexDirection: "column",
                       gap: "0.65rem",
                       borderBottom: "1px solid rgba(150, 150, 150, 0.2)",
                       paddingBottom: "0.85rem",
                    }}>
                    <div
                       style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                       }}>
                       <div
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "8px",
                          }}>
                          <span
                             style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "#3874ff",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                             }}>
                             1
                          </span>
                          <strong style={{ fontSize: "0.95rem" }}>
                             Paso 1: Copia el Prompt de Entrada
                          </strong>
                       </div>

                       <div
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "8px",
                             flexWrap: "wrap",
                          }}>
                          {(selectedPromptId === "translate_english" ||
                             selectedPrompt?.category === "localization") && (
                             <div
                                style={{
                                   display: "flex",
                                   alignItems: "center",
                                   gap: "10px",
                                   flexWrap: "wrap",
                                }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                   <label
                                      htmlFor="ai-source-lang-select"
                                      style={{
                                         fontSize: "0.8rem",
                                         fontWeight: 600,
                                         color: "var(--text-color, #444)",
                                      }}>
                                      <Globe
                                         size={14}
                                         color="#10b981"
                                         style={{
                                            verticalAlign: "middle",
                                            marginRight: "4px",
                                         }}
                                      />
                                      Idioma origen:
                                   </label>
                                   <select
                                      id="ai-source-lang-select"
                                      data-testid="ai-source-lang-select"
                                      value={sourceTranslationLang}
                                      onChange={(e) =>
                                         handleSourceTranslationLangChange(e.target.value)
                                      }
                                      style={{
                                         padding: "0.35rem 0.65rem",
                                         borderRadius: "6px",
                                         border: isDark
                                            ? "1px solid #334155"
                                            : "1px solid rgba(150, 150, 150, 0.3)",
                                         background: isDark
                                            ? "#1e293b"
                                            : "#f8fafc",
                                         color: isDark ? "#f8fafc" : "inherit",
                                         fontSize: "0.8rem",
                                         cursor: "pointer",
                                      }}>
                                      <option value="es">
                                         Español (es)
                                      </option>
                                      <option value="en">
                                         Inglés (en)
                                      </option>
                                   </select>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                   <label
                                      htmlFor="ai-target-lang-select"
                                      style={{
                                         fontSize: "0.8rem",
                                         fontWeight: 600,
                                         color: "var(--text-color, #444)",
                                      }}>
                                      <Globe
                                         size={14}
                                         color="#3874ff"
                                         style={{
                                            verticalAlign: "middle",
                                            marginRight: "4px",
                                         }}
                                      />
                                      Idioma destino:
                                   </label>
                                   <select
                                      id="ai-target-lang-select"
                                      data-testid="ai-target-lang-select"
                                      value={targetTranslationLang}
                                      onChange={(e) =>
                                         handleTargetTranslationLangChange(e.target.value)
                                      }
                                      style={{
                                         padding: "0.35rem 0.65rem",
                                         borderRadius: "6px",
                                         border: isDark
                                            ? "1px solid #334155"
                                            : "1px solid rgba(150, 150, 150, 0.3)",
                                         background: isDark
                                            ? "#1e293b"
                                            : "#f8fafc",
                                         color: isDark ? "#f8fafc" : "inherit",
                                         fontSize: "0.8rem",
                                         cursor: "pointer",
                                      }}>
                                      <option value="en">
                                         Inglés (en)
                                      </option>
                                      <option value="es">
                                         Español (es)
                                      </option>
                                   </select>
                                </div>
                             </div>
                          )}

                          {/* Botón principal y llamativo de copiar prompt */}
                          <button
                             type="button"
                             onClick={() => handleCopy(null)}
                             data-testid="ai-copy-btn"
                             style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "7px",
                                padding: "0.5rem 1.15rem",
                                borderRadius: "8px",
                                border: "none",
                                background: copied ? "#10b981" : "#3874ff",
                                color: "#ffffff",
                                fontSize: "0.88rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: copied
                                   ? "0 2px 10px rgba(16, 185, 129, 0.35)"
                                   : "0 2px 10px rgba(56, 116, 255, 0.35)",
                                transition: "all 0.18s ease",
                             }}>
                             {copied ? (
                                <>
                                   <Check size={16} />
                                   <span>¡Prompt Copiado!</span>
                                </>
                             ) : (
                                <>
                                   <Copy size={16} />
                                   <span>Copiar Prompt</span>
                                </>
                             )}
                          </button>
                       </div>
                    </div>

                    <p
                       style={{
                          margin: 0,
                          fontSize: "0.82rem",
                          color: "var(--text-color-light, #666)",
                          lineHeight: "1.4",
                       }}>
                       {selectedPromptId === "translate_english"
                          ? "Copia este prompt optimizado para traducción técnica ATS y pégalo en tu IA externa de preferencia."
                          : selectedPromptId === "bring_your_own_cv"
                            ? "Copia este prompt conversor y pégalo en tu IA externa junto con el archivo PDF o texto de tu currículum original."
                            : "Copia este prompt con las directivas nativas y pégalo en tu IA externa de preferencia."}
                    </p>

                    {/* Multi-provider Launcher Row when NOT waiting */}
                    {!isWaitingForAI && (
                       <div
                          data-testid="ai-providers-container"
                          style={{
                             display: "flex",
                             alignItems: "center",
                             flexWrap: "wrap",
                             gap: "0.5rem",
                             marginTop: "0.15rem",
                          }}>
                          <span
                             style={{
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                color: "var(--text-color, #444)",
                             }}>
                             Copiar prompt y abrir en:
                          </span>
                          {AI_PROVIDERS.map((provider) => (
                             <button
                                key={provider.id}
                                type="button"
                                data-testid={`ai-provider-btn-${provider.id}`}
                                onClick={() =>
                                   handleCopyAndOpenProvider(
                                      provider.url,
                                      provider.name,
                                   )
                                }
                                style={{
                                   display: "inline-flex",
                                   alignItems: "center",
                                   gap: "5px",
                                   padding: "0.35rem 0.75rem",
                                   borderRadius: "7px",
                                   border: "1px solid rgba(150, 150, 150, 0.3)",
                                   background: "var(--body-color, #f9f9f9)",
                                   color: provider.color,
                                   fontSize: "0.82rem",
                                   fontWeight: 600,
                                   cursor: "pointer",
                                   transition: "all 0.15s ease",
                                }}>
                                <span>{provider.name}</span>
                                <ExternalLink size={12} />
                             </button>
                          ))}
                          <div
                             style={{
                                width: "100%",
                                fontSize: "0.75rem",
                                color: isDark
                                   ? "#94a3b8"
                                   : "var(--text-color-light, #666)",
                                lineHeight: "1.4",
                                marginTop: "0.15rem",
                             }}>
                             Puedes probar este mismo prompt en múltiples IAs
                             (en la nube o locales) sin costes ni almacenamiento
                             de datos para comparar los resultados.
                          </div>
                       </div>
                    )}

                    {/* Waiting Status Banner & Guided Stepper */}
                    {isWaitingForAI && (
                       <div
                          data-testid="ai-waiting-banner"
                          style={{
                             marginTop: "0.35rem",
                             padding: "0.85rem 1rem",
                             borderRadius: "8px",
                             background: "rgba(56, 116, 255, 0.08)",
                             border: "1px solid rgba(56, 116, 255, 0.3)",
                             display: "flex",
                             flexDirection: "column",
                             gap: "0.65rem",
                          }}>
                          <div
                             style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "8px",
                             }}>
                             <div
                                style={{
                                   display: "flex",
                                   alignItems: "center",
                                   gap: "8px",
                                }}>
                                <span
                                   style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      background: "#3874ff",
                                      display: "inline-block",
                                      boxShadow: "0 0 8px #3874ff",
                                   }}
                                />
                                <strong
                                   style={{
                                      fontSize: "0.9rem",
                                      color: "#3874ff",
                                   }}>
                                   Esperando respuesta de tu IA externa...
                                </strong>
                             </div>
                             <button
                                type="button"
                                onClick={() => setIsWaitingForAI(false)}
                                data-testid="ai-back-to-setup-btn"
                                style={{
                                   background: "none",
                                   border: "1px solid rgba(56, 116, 255, 0.3)",
                                   borderRadius: "6px",
                                   padding: "0.25rem 0.55rem",
                                   color: "#3874ff",
                                   fontSize: "0.75rem",
                                   fontWeight: 600,
                                   cursor: "pointer",
                                   display: "flex",
                                   alignItems: "center",
                                   gap: "4px",
                                }}>
                                <ArrowLeft size={12} /> Volver a Configurar
                             </button>
                          </div>

                          <div
                             style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.8rem",
                                color: "#059669",
                                background: "rgba(16, 185, 129, 0.1)",
                                padding: "0.35rem 0.7rem",
                                borderRadius: "6px",
                                fontWeight: 500,
                             }}>
                             <Check size={14} color="#059669" />
                             <span>
                                {copiedProvider
                                   ? `Prompt copiado al portapapeles. Pégalo en ${copiedProvider} con Ctrl+V y regresa aquí para pegar la respuesta.`
                                   : "Prompt copiado al portapapeles. Pégalo en tu IA con Ctrl+V y regresa aquí para pegar la respuesta."}
                             </span>
                          </div>

                          <div
                             style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                fontSize: "0.74rem",
                                color: "var(--text-color, #334155)",
                                flexWrap: "wrap",
                                padding: "2px 0",
                             }}>
                             <span>
                                <strong>1. Prompt copiado</strong>
                             </span>
                             <span>
                                → <strong>2. Ve a tu IA externa</strong>
                             </span>
                             <span>
                                → <strong>3. Copia el JSON</strong>
                             </span>
                             <span>
                                → <strong>4. Pega aquí abajo</strong>
                             </span>
                          </div>

                          <div
                             style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                flexWrap: "wrap",
                             }}>
                             <span
                                style={{
                                   fontSize: "0.75rem",
                                   color: "var(--text-color-light, #777)",
                                }}>
                                Reabrir o cambiar de IA:
                             </span>
                             {AI_PROVIDERS.map((provider) => (
                                <a
                                   key={provider.id}
                                   href={provider.url}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   onClick={() =>
                                      handleCopyAndOpenProvider(
                                         provider.url,
                                         provider.name,
                                      )
                                   }
                                   style={{
                                      fontSize: "0.75rem",
                                      padding: "0.2rem 0.55rem",
                                      borderRadius: "5px",
                                      background: "rgba(56, 116, 255, 0.1)",
                                      color: "#3874ff",
                                      textDecoration: "none",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                   }}>
                                   {provider.name} <ExternalLink size={10} />
                                </a>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              )}

              {/* ========================================================================= */}
              {/* THE INPUT FIELD: PROMPT PAYLOAD PREVIEW (STABLE IN DOM)                   */}
              {/* ========================================================================= */}
              <div
                 style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isPromptExpanded ? "0.5rem" : "0",
                    marginTop: "0.15rem",
                 }}>
                 <div
                    style={{
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "space-between",
                       flexWrap: "wrap",
                       gap: "8px",
                    }}>
                    <button
                       type="button"
                       onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                       data-testid="ai-toggle-prompt-btn"
                       style={{
                          background: "none",
                          border: "none",
                          padding: "0.2rem 0.4rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#3874ff",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          borderRadius: "6px",
                       }}>
                       <Eye size={15} color="#3874ff" />
                       <span>
                          {isPromptExpanded
                             ? "Ocultar prompt"
                             : "Ver prompt completo"}
                       </span>
                       <span
                          style={{
                             fontSize: "0.74rem",
                             color: "var(--text-color-light, #888)",
                             fontWeight: 400,
                          }}>
                          ({compiledPayload.length} caracteres, ~
                          {Math.round(compiledPayload.length / 4)} tokens)
                       </span>
                    </button>
                 </div>

                 <pre
                    data-testid="ai-payload-preview"
                    style={{
                       background: "#18181b",
                       color: "#d4d4d4",
                       padding: isPromptExpanded ? "1rem" : "0",
                       borderRadius: "8px",
                       fontSize: isPromptExpanded ? "0.8rem" : "0.68rem",
                       lineHeight: isPromptExpanded ? "1.45" : "1.25",
                       fontFamily:
                          '"Cascadia Code", Consolas, Monaco, monospace',
                       maxHeight: isPromptExpanded ? "260px" : "44px",
                       height: isPromptExpanded ? "auto" : "0px",
                       overflowY: isPromptExpanded ? "auto" : "hidden",
                       overflow: "hidden",
                       whiteSpace: "pre-wrap",
                       wordBreak: "break-word",
                       margin: 0,
                       opacity: isPromptExpanded ? 1 : 0,
                       display: isPromptExpanded ? "block" : "none",
                       transition: "all 0.2s ease",
                    }}>
                    {compiledPayload}
                 </pre>
              </div>
              {/* ========================================================================= */}
              {/* THE OUTPUT FIELD: BIDIRECTIONAL RESPONSE INGESTION CONTAINER              */}
              {/* ========================================================================= */}
              {isResponseImportablePrompt && (
                 <div
                    data-testid="ai-response-ingestion-container"
                    style={{
                       border: "1px solid rgba(16, 185, 129, 0.3)",
                       borderRadius: "10px",
                       padding: "1rem",
                       background: "rgba(16, 185, 129, 0.02)",
                       display: "flex",
                       flexDirection: "column",
                       gap: "0.75rem",
                    }}>
                    <div
                       style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "8px",
                       }}>
                       <div
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "8px",
                          }}>
                          <span
                             style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "#10b981",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                             }}>
                             2
                          </span>
                          <label
                             htmlFor="ai-response-input"
                             style={{
                                fontSize: "0.95rem",
                                fontWeight: 700,
                                margin: 0,
                             }}>
                             Paso 2: Pega el JSON Devuelto por la IA (Salida)
                          </label>
                       </div>

                       <div
                          style={{
                             display: "flex",
                             alignItems: "center",
                             gap: "0.5rem",
                          }}>
                          <button
                             type="button"
                             onClick={handlePasteFromClipboard}
                             data-testid="ai-paste-response-btn"
                             style={{
                                background: "none",
                                border: "1px solid rgba(16, 185, 129, 0.4)",
                                borderRadius: "6px",
                                padding: "0.25rem 0.55rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#059669",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                             }}>
                             <ClipboardPaste size={13} /> Pegar del portapapeles
                          </button>
                          {externalLLMResponse && (
                             <button
                                type="button"
                                onClick={() => setExternalLLMResponse("")}
                                style={{
                                   background: "none",
                                   border: "1px solid rgba(150, 150, 150, 0.3)",
                                   borderRadius: "6px",
                                   padding: "0.25rem 0.55rem",
                                   fontSize: "0.75rem",
                                   color: "var(--text-color-light, #888)",
                                   cursor: "pointer",
                                   display: "flex",
                                   alignItems: "center",
                                   gap: "3px",
                                }}>
                                <Trash2 size={13} /> Limpiar
                             </button>
                          )}
                       </div>
                    </div>

                    <p
                       style={{
                          margin: 0,
                          fontSize: "0.82rem",
                          color: "var(--text-color-light, #666)",
                          lineHeight: "1.4",
                       }}>
                       Pega el bloque de código JSON obtenido. Tu CV actual se
                       respaldará automáticamente en el Gestor de Versiones
                       antes de aplicar los cambios.
                    </p>

                    {/* Output Textarea */}
                    <textarea
                       id="ai-response-input"
                       data-testid="ai-response-input"
                       rows={isWaitingForAI ? 10 : 4}
                       value={externalLLMResponse}
                       onPaste={() => {
                          if (typeof window !== "undefined") {
                             window.dispatchEvent(
                                new CustomEvent("ai-modal-tour-action", {
                                   detail: {
                                      action: "paste_clicked",
                                      promptId: selectedPromptId,
                                   },
                                }),
                             );
                          }
                       }}
                       onChange={(e) => {
                          setExternalLLMResponse(e.target.value);
                          if (applyStatus) setApplyStatus(null);
                       }}
                       placeholder="Pega aquí la respuesta devuelta por la IA (ej: ```json { ... } ``` o { ... })..."
                       style={{
                          width: "100%",
                          minHeight: isWaitingForAI ? "260px" : "100px",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          border: isDark
                             ? "1px solid #334155"
                             : "1px solid rgba(150, 150, 150, 0.35)",
                          background: isDark ? "#1e293b" : "#f8fafc",
                          color: isDark ? "#f8fafc" : "inherit",
                          fontFamily:
                             '"Cascadia Code", Consolas, Monaco, monospace',
                          fontSize: "0.84rem",
                          lineHeight: "1.4",
                          resize: "vertical",
                          boxSizing: "border-box",
                       }}
                    />

                    {/* Live Impact Summary Card */}
                    {impactSummary?.isValid && (
                       <div
                          className="obsidian-callout"
                          data-testid="ai-impact-summary-callout"
                          style={{
                             background: "rgba(16, 185, 129, 0.08)",
                             borderLeft: "4px solid rgba(16, 185, 129, 1)",
                             padding: "0.85rem 1.1rem",
                             borderRadius: "4px 8px 8px 4px",
                             fontSize: "0.85rem",
                          }}>
                          <div
                             className="callout-title"
                             style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 700,
                                color: "#059669",
                                fontSize: "0.92rem",
                                marginBottom: "0.35rem",
                             }}>
                             <CheckCircle2 size={17} color="#059669" />
                             <span>Resumen de Impacto del CV Detectado:</span>
                          </div>
                          <div
                             className="callout-content"
                             style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.45rem",
                             }}>
                             <div
                                style={{
                                   display: "grid",
                                   gridTemplateColumns:
                                      "repeat(auto-fit, minmax(180px, 1fr))",
                                   gap: "0.5rem",
                                }}>
                                <div
                                   style={{
                                      background: "rgba(255, 255, 255, 0.5)",
                                      padding: "0.4rem 0.6rem",
                                      borderRadius: "6px",
                                      border:
                                         "1px solid rgba(16, 185, 129, 0.2)",
                                   }}>
                                   <span
                                      style={{
                                         fontSize: "0.72rem",
                                         color: "#059669",
                                         fontWeight: 700,
                                         textTransform: "uppercase",
                                         display: "block",
                                      }}>
                                      Candidato
                                   </span>
                                   <strong style={{ fontSize: "0.85rem" }}>
                                      {impactSummary.candidateName}
                                   </strong>
                                   {impactSummary.candidateSubtitle && (
                                      <div
                                         style={{
                                            fontSize: "0.75rem",
                                            color: "var(--text-color-light, #666)",
                                         }}>
                                         {impactSummary.candidateSubtitle}
                                      </div>
                                   )}
                                </div>
                                <div
                                   style={{
                                      background: "rgba(255, 255, 255, 0.5)",
                                      padding: "0.4rem 0.6rem",
                                      borderRadius: "6px",
                                      border:
                                         "1px solid rgba(16, 185, 129, 0.2)",
                                   }}>
                                   <span
                                      style={{
                                         fontSize: "0.72rem",
                                         color: "#059669",
                                         fontWeight: 700,
                                         textTransform: "uppercase",
                                         display: "block",
                                      }}>
                                      Experiencia
                                   </span>
                                   <strong style={{ fontSize: "0.85rem" }}>
                                      {impactSummary.expCount} puestos
                                      registrados
                                   </strong>
                                   <div
                                      style={{
                                         fontSize: "0.75rem",
                                         color: "var(--text-color-light, #666)",
                                      }}>
                                      {impactSummary.totalBullets} viñetas de
                                      logros
                                   </div>
                                </div>
                                <div
                                   style={{
                                      background: "rgba(255, 255, 255, 0.5)",
                                      padding: "0.4rem 0.6rem",
                                      borderRadius: "6px",
                                      border:
                                         "1px solid rgba(16, 185, 129, 0.2)",
                                   }}>
                                   <span
                                      style={{
                                         fontSize: "0.72rem",
                                         color: "#059669",
                                         fontWeight: 700,
                                         textTransform: "uppercase",
                                         display: "block",
                                      }}>
                                      Habilidades
                                   </span>
                                   <strong style={{ fontSize: "0.85rem" }}>
                                      {impactSummary.skillsCategoriesCount}{" "}
                                      categorías
                                   </strong>
                                   <div
                                      style={{
                                         fontSize: "0.75rem",
                                         color: "var(--text-color-light, #666)",
                                      }}>
                                      {impactSummary.totalSkillsCount}{" "}
                                      tecnologías detectadas
                                   </div>
                                </div>
                                <div
                                   style={{
                                      background: "rgba(255, 255, 255, 0.5)",
                                      padding: "0.4rem 0.6rem",
                                      borderRadius: "6px",
                                      border:
                                         "1px solid rgba(16, 185, 129, 0.2)",
                                   }}>
                                   <span
                                      style={{
                                         fontSize: "0.72rem",
                                         color: "#059669",
                                         fontWeight: 700,
                                         textTransform: "uppercase",
                                         display: "block",
                                      }}>
                                      Educación
                                   </span>
                                   <strong style={{ fontSize: "0.85rem" }}>
                                      {impactSummary.eduCount} títulos
                                      académicos
                                   </strong>
                                   <div
                                      style={{
                                         fontSize: "0.75rem",
                                         color: "var(--text-color-light, #666)",
                                      }}>
                                      {impactSummary.certCount > 0
                                         ? `${impactSummary.certCount} certificados`
                                         : ""}
                                      {impactSummary.certCount > 0 &&
                                      impactSummary.langCount > 0
                                         ? " · "
                                         : ""}
                                      {impactSummary.langCount > 0
                                         ? `${impactSummary.langCount} idiomas`
                                         : ""}
                                   </div>
                                </div>
                             </div>
                             <div
                                style={{
                                   fontSize: "0.75rem",
                                   color: "#059669",
                                   fontWeight: 600,
                                   display: "flex",
                                   alignItems: "center",
                                   gap: "5px",
                                }}>
                                <ShieldCheck size={14} color="#059669" /> Tu
                                versión actual en{" "}
                                {getLanguageLegend(activeLanguage)} se
                                respaldará automáticamente en el Gestor de
                                Versiones al aplicar.
                             </div>
                          </div>
                       </div>
                    )}

                    {/* Error Callout */}
                    {applyStatus?.type === "error" && (
                       <div
                          className="obsidian-callout"
                          data-testid="ai-apply-error-callout"
                          style={{
                             background: "rgba(233, 49, 71, 0.1)",
                             borderLeft: "4px solid rgba(233, 49, 71, 1)",
                             padding: "0.75rem 1rem",
                             borderRadius: "4px 8px 8px 4px",
                             fontSize: "0.85rem",
                          }}>
                          <div
                             className="callout-title"
                             style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 600,
                                color: "rgba(233, 49, 71, 1)",
                                marginBottom: "0.25rem",
                             }}>
                             <AlertCircle
                                size={16}
                                color="rgba(233, 49, 71, 1)"
                             />
                             <span>
                                Error al procesar la respuesta de la IA
                             </span>
                          </div>
                          <div className="callout-content">
                             {applyStatus.message}
                          </div>
                       </div>
                    )}

                    {/* Success Callout */}
                    {applyStatus?.type === "success" && (
                       <div
                          className="obsidian-callout"
                          data-testid="ai-apply-success-callout"
                          style={{
                             background: "rgba(46, 204, 113, 0.12)",
                             borderLeft: "4px solid rgba(46, 204, 113, 1)",
                             padding: "0.75rem 1rem",
                             borderRadius: "4px 8px 8px 4px",
                             fontSize: "0.85rem",
                          }}>
                          <div
                             className="callout-title"
                             style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 600,
                                color: "#27ae60",
                                marginBottom: "0.25rem",
                             }}>
                             <CheckCircle2 size={16} color="#27ae60" />
                             <span>¡Operación Exitosa!</span>
                          </div>
                          <div className="callout-content">
                             {applyStatus.message}
                          </div>
                       </div>
                    )}

                    {/* Apply Button */}
                    <div>
                       <button
                          type="button"
                          onClick={handleApplyResponse}
                          disabled={isApplying || !externalLLMResponse.trim()}
                          data-testid="ai-apply-response-btn"
                          style={{
                             padding: "0.65rem 1.4rem",
                             borderRadius: "8px",
                             border: "none",
                             background: "#10b981",
                             color: "#ffffff",
                             fontWeight: 600,
                             fontSize: "0.88rem",
                             cursor:
                                !isApplying && externalLLMResponse.trim()
                                   ? "pointer"
                                   : "not-allowed",
                             boxShadow: "0 2px 10px rgba(16, 185, 129, 0.25)",
                             display: "inline-flex",
                             alignItems: "center",
                             gap: "0.5rem",
                             opacity:
                                !isApplying && externalLLMResponse.trim()
                                   ? 1
                                   : 0.6,
                          }}>
                          {isApplying ? (
                             <>Procesando y guardando respaldo...</>
                          ) : (
                             <>
                                <ArrowDownToLine size={16} /> Guardar Respaldo (
                                {getLanguageLegend(activeLanguage)}) y Aplicar
                                Nuevo CV
                             </>
                          )}
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
     </div>
  );
};

export default AIExportModal;
