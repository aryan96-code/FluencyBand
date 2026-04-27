import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, Mic, BarChart2, BookOpen, MessageSquare } from 'lucide-react';
import './App.css';

import Dashboard from './pages/Dashboard';
import Session from './pages/Session';
import Analytics from './pages/Analytics';
import Therapy from './pages/Therapy';
import WordAI from './pages/WordAI';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header" style={{ padding: '15px 20px', background: 'white' }}>
          <div className="logo">
            <Activity color="var(--primary)" size={28} />
            FluencyBand AI
          </div>
        </header>

        <main className="main-content fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/session" element={<Session />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/therapy" element={<Therapy />} />
            <Route path="/wordai" element={<WordAI />} />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Activity size={24} />
            <span>Dash</span>
          </NavLink>
          <NavLink to="/session" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Mic size={24} />
            <span>Session</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart2 size={24} />
            <span>Report</span>
          </NavLink>
          <NavLink to="/therapy" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BookOpen size={24} />
            <span>Therapy</span>
          </NavLink>
          <NavLink to="/wordai" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MessageSquare size={24} />
            <span>Word AI</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
}

export default App;
