export const Footer = () => {

  return (
    <footer
      className="app-footer bd-container no-print"
      data-testid="app-footer"
      role="contentinfo"
      
    >
      {/* Bottom Row: Branding, Privacy & Copyright */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.78rem',
          color: 'var(--text-color-light, #64748b)',
          paddingTop: '0.25rem'
        }}
      >
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <strong style={{ color: 'var(--text-color, #0f172a)', fontWeight: 700 }}>Los datos se guardan localmente en tu navegador</strong>
          <span>•</span>
          <span>¿Encontraste un problema o tenés sugerencias? <a href="https://linkedin.com/in/juan-ignacio-carrizo-juani981/" target="_blank" rel="noopener noreferrer">Contactame</a></span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
          <span>© 2026 - Juan Ignacio Carrizo</span>
        </div>


    </footer>
  );
};

export default Footer;
