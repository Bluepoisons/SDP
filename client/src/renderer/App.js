import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import FluidBackground from './components/FluidBackground';
import './styles/App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 16) setTheme('morning');
    else if (hour >= 16 && hour < 19) setTheme('afternoon');
    else setTheme('night');
  }, []);

  return (
    <div className="app-container">
      <FluidBackground />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MainContent activeTab={activeTab} />
    </div>
  );
};

export default App;
