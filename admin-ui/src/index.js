// index.js (또는 main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // ← 이 부분이 App.js가 아니라 App.jsx여야 함
import './styles.css';
import './index.css'; // 또는 './App.css'
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
