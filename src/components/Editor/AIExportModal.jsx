import React, { useState, useMemo } from 'react';
import { useCV } from '../../context/CVContext';
import { getPrompts, getUI } from '../../locales/index';
import { buildAIPromptPayload } from '../../utils/aiExporter';
import { Bot, Target, Layout, FileText, Briefcase, Eye, Download, Copy, Check, X } from 'lucide-react';

const AIExportModal = ({ isOpen, onClose }) => {
  const { cvData, activeLanguage } = useCV();
  const [selectedPromptId, setSelectedPromptId] = useState('recruiter_audit');
  const [selectedFormat, setSelectedFormat] = useState('markdown');
  const [layoutMode, setLayoutMode] = useState('1-column'); // Default to 1-column ATS mode for >95 score
  const [jobDescription, setJobDescription] = useState('');
  const [copied, setCopied] = useState(false);

  const localizedPrompts = useMemo(() => {
    return getPrompts(activeLanguage);
  }, [activeLanguage]);

  const ui = useMemo(() => {
    return getUI(activeLanguage);
  }, [activeLanguage]);

  const selectedPrompt = useMemo(() => {
    return localizedPrompts.find(p => p.id === selectedPromptId) || localizedPrompts[0];
  }, [localizedPrompts, selectedPromptId]);

  const targetCvData = useMemo(() => {
    return {
      ...cvData,
      layout: {
        ...(cvData.layout || {}),
        type: layoutMode
      }
    };
  }, [cvData, layoutMode]);

  const compiledPayload = useMemo(() => {
    return buildAIPromptPayload(targetCvData, selectedPromptId, {
      format: selectedFormat,
      jobDescription,
      lang: activeLanguage
    });
  }, [targetCvData, selectedPromptId, selectedFormat, jobDescription, activeLanguage]);

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
    let extension = 'md';
    let mime = 'text/markdown';
    if (selectedFormat === 'xml') {
      extension = 'xml';
      mime = 'application/xml';
    } else if (selectedFormat === 'ats_text') {
      extension = 'txt';
      mime = 'text/plain';
    } else if (selectedFormat === 'json') {
      extension = 'json';
      mime = 'application/json';
    }

    const candidateName = cvData?.profile?.name ? cvData.profile.name.replace(/\s+/g, '_') : 'CV';
    const blob = new Blob([compiledPayload], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidateName}_AI_Prompt_${selectedPromptId}.${extension}`;
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
      <div style={{
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
            <Bot size={28} color="#3874ff" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Hub de Prompts de IA & Abstracción de CV</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-color-light, #777)' }}>
                Reemplazo semántico del PDF para modelos de lenguaje (GPT, Claude, Gemini, DeepSeek) y ATS
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

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Row: Prompt Selection, Format Selection & Layout Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            
            {/* Prompt Selector */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <Target size={15} color="#3874ff" /> Seleccionar Objetivo del Prompt:
              </label>
              <select 
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

            {/* Layout Mode Selector */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <Layout size={15} color="#6366f1" /> Disposición de Abstracción:
              </label>
              <select 
                value={layoutMode} 
                onChange={(e) => setLayoutMode(e.target.value)}
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
                <option value="1-column">1 Columna — Lineal ATS (&gt;95 Pts)</option>
                <option value="2-column">2 Columnas — Visual para Reclutador</option>
              </select>
            </div>

            {/* Abstraction Format Selector */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <FileText size={15} color="#10b981" /> Formato de Abstracción:
              </label>
              <select 
                value={selectedFormat} 
                onChange={(e) => setSelectedFormat(e.target.value)}
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
                <option value="markdown">Semantic Markdown (Recomendado)</option>
                <option value="xml">Semantic XML</option>
                <option value="ats_text">Texto Plano Lineal</option>
                <option value="json">JSON Schema Nativo</option>
              </select>
            </div>
          </div>

          {/* Description of Selected Prompt */}
          <div style={{
            background: 'rgba(56, 116, 255, 0.08)',
            borderLeft: '4px solid #3874ff',
            padding: '0.75rem 1rem',
            borderRadius: '4px 8px 8px 4px',
            fontSize: '0.85rem'
          }}>
            <strong>Descripción:</strong> {selectedPrompt.description}
          </div>

          {/* Optional Job Description Input for job_matcher */}
          {selectedPrompt.required_inputs?.includes('job_description') && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <Briefcase size={15} color="#e11d48" /> Pegar Descripción de la Oferta Laboral (Job Description):
              </label>
              <textarea
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
                  resize: 'vertical'
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
              <Check size={16} /> ¡Copiado al portapapeles!
            </span>
          )}
          <button
            onClick={handleDownload}
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
