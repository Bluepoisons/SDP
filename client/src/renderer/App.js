import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import FluidBackground from './components/FluidBackground';
import './styles/App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('gal-theme');
    return stored ? stored === 'dark' : false;
  });

  useEffect(() => {
    document.body.classList.toggle('theme-dark', isDark);
    localStorage.setItem('gal-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className="app-container">
      <FluidBackground />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark(prev => !prev)}
      />
      <MainContent activeTab={activeTab} />
    </div>
  );
};

export default App;
