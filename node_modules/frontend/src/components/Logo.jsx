import React from 'react';

export default function Logo({ size = 44 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid rgba(247,168,77,0.35)',
        boxShadow: '0 2px 10px rgba(247,168,77,0.22)',
        overflow: 'hidden',
        flexShrink: 0,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <img
        src="/awgp.jpg"
        alt="AWGP Logo"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
      />
    </div>
  );
}
