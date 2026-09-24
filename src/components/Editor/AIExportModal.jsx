import React, { useState, useMemo } from 'react';
import { useCV } from '../../context/CVContext';
import { getPrompts, getUI } from '../../locales/index';
import { buildAIPromptPayload } from '../../utils/aiExporter';
import { BrainCircuit, Target, Layout, FileText, Briefcase, Eye, Download, Copy, Check, X, MessageSquare } from 'lucide-react';

const AIExportModal = ({ isOpen, onClose }) => {
  const { cvData, activeLanguage } = useCV();
  const [selectedPromptId, setSelectedPromptId] = useState('recruiter_audit');
  const selectedFormat = 'markdown'; // Fixed to Semantic Markdown per R1
  const [userCommentary, setUserCommentary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [copied, setCopied] = useState(false);

  const localizedPrompts = useMemo(() => {
    return getPrompts(activeLanguage);
  }, [activeLanguage]);

  const ui = useMemo(() => {
    return getUI(activeLanguage);
  }, [activeLanguage]);

  const selectedPrompt = useMemo(() => {
    return localizedPrompts.find(p => p.id === selectedPromptId) || localizedPrompts[0] || {};
  }, [localizedPrompts, selectedPromptId]);

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

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
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

          {/* Live Preview Container */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                <Eye size={15} color="#3874ff" /> Vista Previa del Payload Completo (Prompt + Datos Estáticos):
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-color-light, #888)' }}>
                {compiledPayload.length} caracteres (~{Math.round(compiledPayload.length / 4)} tokens)
              </span>
            </div>
            <pre 
              data-testid="ai-payload-preview"
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontFamily: '"Cascadia Code", Consolas, Monaco, monospace',
                maxHeight: '220px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0
              }}
            >
              {compiledPayload}
            </pre>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(150, 150, 150, 0.2)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
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
            <Copy size={16} /> Copiar Prompt + CV para IA
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIExportModal;
