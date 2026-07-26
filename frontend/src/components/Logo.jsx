import React from 'react';

export default function Logo({ size = 44, showText = false }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2px solid rgba(247,168,77,0.5)',
          boxShadow: '0 3px 12px rgba(247,168,77,0.35)',
          overflow: 'hidden',
          flexShrink: 0,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 1,
        }}
      >
        <img
          src="/awgp01.png"
          alt="Spiritual Audio Hub Logo"
          loading="eager"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          onError={(e) => { e.currentTarget.src = '/awgp01.png'; }}
        />
      </div>

      {showText && (
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FFB300, #FF6D00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px',
          }}
        >
          Spiritual Audio Hub
        </span>
      )}
    </div>
  );
}
