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
          overflow: 'hidden',
          flexShrink: 0,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            color: '#FF6D00',
            letterSpacing: '0.5px',
          }}
        >
          Spiritual Audio Hub
        </span>
      )}
    </div>
  );
}
