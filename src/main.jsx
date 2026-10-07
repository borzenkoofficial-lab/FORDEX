import React from 'react';
import { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import './styles.css';
import './design-system.css';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: '48px', background: '#f4f7f8', color: '#12202a' }}>
          <span style={{ letterSpacing: '0.08em', fontSize: '12px' }}>FORDEX · RUNTIME ERROR</span>
          <h1 style={{ fontSize: '42px', margin: '16px 0' }}>ПРИЛОЖЕНИЕ НЕ СМОГЛО ОТРИСОВАТЬСЯ.</h1>
          <p style={{ maxWidth: '760px', lineHeight: 1.6 }}>Ошибка перехвачена на первом рендере. Обновите страницу после исправления.</p>
          <pre style={{ whiteSpace: 'pre-wrap', maxWidth: '980px', padding: '20px', background: '#fff', border: '1px solid #ccd6db', overflow: 'auto' }}>{String(this.state.error?.stack || this.state.error)}</pre>
        </main>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('FORDEX root element not found');

createRoot(root).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
