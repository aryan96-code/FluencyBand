import React, { useState, useEffect } from 'react';
import { Wind, BookOpen, Repeat, Users, Mic, ChevronRight, Play, CheckCircle, Sparkles } from 'lucide-react';

const therapies = [
  { id: 1, title: 'Breathing Regulation', icon: Wind, desc: 'Practice 4-7-8 breathing to reduce physiological stress before speech.', duration: 60 },
  { id: 2, title: 'Mirror Reading', icon: BookOpen, desc: 'Read aloud while watching your articulation to reduce facial tension.', duration: 120 },
  { id: 3, title: 'Difficult Word Repetition', icon: Repeat, desc: 'Focus on your top problem words identified by the Word AI.', duration: 90 },
  { id: 4, title: 'Confidence Speaking Drill', icon: Users, desc: 'Simulated audience scenario to build stress resilience.', duration: 180 },
  { id: 5, title: 'Continuous Fluency Test', icon: Mic, desc: 'Maintain a steady speech rate for 2 minutes straight.', duration: 120 },
];

export default function Therapy() {
  const [activeTherapy, setActiveTherapy] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState({});
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('fluency_therapy_completed') || '{}');
    setCompleted(saved);

    const fetchRec = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/recommendation');
        if (res.ok) {
          const recs = await res.json();
          if (recs && recs.length > 0) {
            setRecommendation(recs[0]); // highest priority rec
          }
        }
      } catch (e) {
        console.error("Could not fetch recommendation", e);
      }
    };
    fetchRec();
  }, []);

  useEffect(() => {
    let interval;
    if (isActive && activeTherapy && timer < activeTherapy.duration) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else if (isActive && activeTherapy && timer >= activeTherapy.duration) {
      setIsActive(false);
      const newCompleted = { ...completed, [activeTherapy.id]: (completed[activeTherapy.id] || 0) + 1 };
      setCompleted(newCompleted);
      localStorage.setItem('fluency_therapy_completed', JSON.stringify(newCompleted));
    }
    return () => clearInterval(interval);
  }, [isActive, timer, activeTherapy, completed]);

  const startTherapy = (t) => {
    setActiveTherapy(t);
    setTimer(0);
    setIsActive(false);
  };

  const closeTherapy = () => {
    setActiveTherapy(null);
    setIsActive(false);
  };

  if (activeTherapy) {
    const progress = (timer / activeTherapy.duration) * 100;
    const isFinished = timer >= activeTherapy.duration;

    return (
      <div className="fade-in">
        <button className="btn btn-outline mb-4" onClick={closeTherapy}>← Back to Modules</button>
        
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <activeTherapy.icon size={64} color="var(--primary)" style={{ margin: '0 auto 20px' }} />
          <h2>{activeTherapy.title}</h2>
          <p className="text-muted mb-4">{activeTherapy.desc}</p>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{Math.floor(progress)}%</span>
            </div>
            <div className="progress-container" style={{ height: '12px', background: 'var(--border)' }}>
              <div className="progress-bar" style={{ width: `${progress}%`, background: isFinished ? 'var(--success)' : 'var(--primary)' }}></div>
            </div>
          </div>

          <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'monospace', margin: '20px 0' }}>
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')} / {Math.floor(activeTherapy.duration / 60)}:{(activeTherapy.duration % 60).toString().padStart(2, '0')}
          </div>

          {!isFinished ? (
            <button className="btn btn-primary" onClick={() => setIsActive(!isActive)}>
              {isActive ? 'Pause' : <><Play size={18}/> Start Practice</>}
            </button>
          ) : (
            <div className="flex-col items-center gap-2">
              <CheckCircle size={48} color="var(--success)" className="anim-pulse" />
              <div className="stat-label" style={{ color: 'var(--success)' }}>Therapy Complete!</div>
              <button className="btn btn-outline mt-2" onClick={closeTherapy}>Finish</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2>Personalized Speech Therapy</h2>
      
      {recommendation && (
        <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(14,165,233,0.1))', borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header mb-2">
            <div className="card-title text-gradient"><Sparkles size={18} color="var(--primary)"/> AI Recommended Focus</div>
          </div>
          <p className="text-sm mb-2 text-main">{recommendation.text}</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--primary-dark)' }}>
            Suggested Module: {recommendation.therapy}
          </p>
        </div>
      )}

      <p className="text-muted mb-4">Select a module to begin your training session. Your progress is tracked automatically.</p>

      <div className="flex-col gap-4">
        {therapies.map(t => {
          const isRecommended = recommendation && recommendation.therapy_id === t.id;
          return (
            <div key={t.id} className="card" style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '15px 20px', border: isRecommended ? '2px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => startTherapy(t)}>
              <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', marginRight: '15px' }}>
                <t.icon size={24} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="card-title" style={{ marginBottom: '4px' }}>
                  {t.title}
                  {isRecommended && <span className="status-badge status-warning ml-2" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>RECOMMENDED</span>}
                </div>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>{t.desc}</div>
                {completed[t.id] && (
                  <div className="status-badge status-success mt-2" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                    Completed {completed[t.id]} times
                  </div>
                )}
              </div>
              <ChevronRight color="var(--border)" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
