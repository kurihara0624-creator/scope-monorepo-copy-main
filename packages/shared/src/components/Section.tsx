import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface SectionProps {
  title: ReactNode;
  icon: ReactNode;
  children: ReactNode;
  onHelpClick?: () => void;
}

export function Section({ title, icon, children, onHelpClick }: SectionProps) {
  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          {icon} {title}
        </h2>
        {onHelpClick && (
          <button onClick={onHelpClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <HelpCircle size={18} />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}