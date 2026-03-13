// src/pages/PlaceholderPage.jsx
import React from 'react';

const styles = {
  wrapper: {
    maxWidth: 700,
    margin: '80px auto',
    textAlign: 'center',
    padding: '0 24px',
  },
  iconBox: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 16,
    background: '#eff6ff',
    marginBottom: 24,
    fontSize: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  badge: {
    display: 'inline-block',
    padding: '12px 24px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 14,
    color: '#9ca3af',
  },
};

function PlaceholderPage({ title, description }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.iconBox}>
        🚧
      </div>
      <h1 style={styles.title}>
        {title}
      </h1>
      {description && (
        <p style={styles.description}>
          {description}
        </p>
      )}
      <div style={styles.badge}>
        페이지 준비 중입니다 · Coming Soon
      </div>
    </div>
  );
}

export default PlaceholderPage;