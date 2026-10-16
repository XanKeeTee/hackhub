import React from 'react';

interface CRTOverlayProps {
  enabled: boolean;
}

export const CRTOverlay: React.FC<CRTOverlayProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Scanline lines */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
          backgroundSize: '100% 4px',
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Screen Vignette / Border shadow */}
      <div 
        className="absolute inset-0 opacity-40 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)]"
      />

      {/* Subtle CRT Flicker sweep */}
      <div className="absolute inset-0 bg-cyber-green/5 opacity-10 animate-scanline pointer-events-none" />
    </div>
  );
};
