import React from 'react';
import { useCV } from '../../context/CVContext';
import { Lightbulb, CheckCircle2, Info, AlertCircle } from 'lucide-react';

const ToastNotification = () => {
  const { toast } = useCV();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  return (
    <div
      className="toast-notification no-print"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '10px',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '0.85rem',
        fontWeight: 500,
        pointerEvents: 'none',
        animation: 'toastFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        maxWidth: '380px'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: isSuccess ? '#22c55e' : isWarning ? '#eab308' : '#3874ff'
      }}>
        {isSuccess ? <CheckCircle2 size={18} /> : <Lightbulb size={18} color="#eab308" />}
      </div>
      <span style={{ lineHeight: 1.4 }}>{toast.text}</span>
    </div>
  );
};

export default ToastNotification;
