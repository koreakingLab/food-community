// src/pages/PlaceholderPage.jsx
import React from 'react';

function PlaceholderPage({ title, description }) {
  return (
    <div style=
      maxWidth: 700,
      margin: '80px auto',
      textAlign: 'center',
      padding: '0 24px',
    >
      <div style=
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 64,
        height: 64,
        borderRadius: 16,
        background: '#eff6ff',
        marginBottom: 24,
        fontSize: 28,
      >
        🚧
      </div>
      <h1 style=
        fontSize: 28,
        fontWeight: 700,
        color: '#111827',
        marginBottom: 12,
      >
        {title}
      </h1>
      {description && (
        <p style=
          fontSize: 16,
          color: '#6b7280',
          lineHeight: 1.6,
          marginBottom: 32,
        >
          {description}
        </p>
      )}
      <div style=
        display: 'inline-block',
        padding: '12px 24px',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        fontSize: 14,
        color: '#9ca3af',
      >
        페이지 준비 중입니다 · Coming Soon
      </div>
    </div>
  );
}

export default PlaceholderPage;