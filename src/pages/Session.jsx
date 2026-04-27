import React, { useState, useEffect } from 'react';
import { useSensorData } from '../hooks/useSensorData';
import { Play, Pause, Square, RotateCcw, Save } from 'lucide-react';

export default function Session() {
  const { data } = useSensorData();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  
  const [stats, setStats] = useState({
    samples: 0,
    stutters: 0,
    preStutters: 0
  });

  const [sessionReport, setSessionReport] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime(t => t + 1);
        
        // Update local stats for UI
        setStats(prev => ({
          ...prev,
          samples: prev.samples + 1,
          stutters: prev.stutters + (data.prediction === 'STUTTER' ? 1 : 0),
          preStutters: prev.preStutters + (data.prediction === 'PRE-STUTTER' ? 1 : 0)
        }));

        // Send update to backend
        fetch('http://127.0.0.1:8000/session/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(err => console.error("Error updating session:", err));

      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, data]);

  const handleStart = async () => {
    try {
      await fetch('http://127.0.0.1:8000/session/start', { method: 'POST' });
      setIsActive(true);
      setIsPaused(false);
      setSessionReport(null);
      setStats({ samples: 0, stutters: 0, preStutters: 0 });
    } catch (e) {
      console.error("Could not start session on backend", e);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTime(0);
    setStats({ samples: 0, stutters: 0, preStutters: 0 });
    setSessionReport(null);
  };

  const handleEnd = async () => {
    setIsActive(false);
    setIsPaused(false);
    
    if (stats.samples === 0) return;
    
    try {
      const res = await fetch('http://127.0.0.1:8000/session/end', { method: 'POST' });
      if (res.ok) {
        const report = await res.json();
        setSessionReport(report);
      }
    } catch (e) {
      console.error("Could not end session on backend", e);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentConfidence = stats.samples > 0 
    ? Math.max(0, 100 - ((stats.stutters + stats.preStutters) / stats.samples) * 100).toFixed(0)
    : 100;

  return (
    <div className="fade-in">
      <h2>Smart Speech Session</h2>

      <div className="card text-center" style={{ padding: '40px 20px' }}>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--primary)' }}>
          {formatTime(time)}
        </div>
        <div className="text-muted mb-4">Duration</div>

        <div className="flex justify-center gap-4">
          {!isActive || isPaused ? (
            <button className="btn btn-primary" onClick={handleStart}>
              <Play size={18} /> {time === 0 ? 'Start Session' : 'Resume'}
            </button>
          ) : (
            <button className="btn btn-warning" onClick={handlePause}>
              <Pause size={18} /> Pause
            </button>
          )}
          <button className="btn btn-danger" onClick={handleEnd} disabled={!isActive && time === 0}>
            <Square size={18} /> End & Save
          </button>
          <button className="btn btn-outline" onClick={handleReset}>
            <RotateCcw size={18} /> Reset
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Live Session Panel</div>
          </div>
          <div className="flex-col gap-4">
            <div className="flex justify-between items-center p-3" style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <span className="stat-label mb-0">Speech State</span>
              <span className="status-badge" style={{ 
                background: data.prediction === 'NORMAL' ? 'var(--success)' : data.prediction === 'STUTTER' ? 'var(--danger)' : 'var(--warning)',
                color: 'white'
              }}>{data.prediction}</span>
            </div>
            
            <div className="flex justify-between items-center p-3" style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <span className="stat-label mb-0">Confidence Score</span>
              <span className="font-bold text-gradient" style={{ fontSize: '1.2rem' }}>{currentConfidence}%</span>
            </div>

            <div className="flex justify-between items-center p-3" style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <span className="stat-label mb-0">Motor Warning Level</span>
              <span className="font-bold" style={{ color: data.motion > 0.8 ? 'var(--danger)' : 'var(--success)' }}>
                {data.motion > 0.8 ? 'HIGH' : 'NORMAL'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Event Tracking</div>
          </div>
          <div className="flex-col gap-4">
            <div className="stat-box mb-2">
              <div className="stat-label">Total Stutters Detected</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.stutters}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Stress Peaks (Pre-Stutter)</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.preStutters}</div>
            </div>
          </div>
        </div>
      </div>

      {sessionReport && (
        <div className="card fade-in" style={{ border: '2px solid var(--success)' }}>
          <div className="card-header">
            <div className="card-title"><Save size={18}/> Session Report Generated</div>
          </div>
          <div className="grid-4">
            <div>
              <div className="stat-label">Fluency Score</div>
              <div className="stat-value text-gradient">{sessionReport.fluencyScore}%</div>
            </div>
            <div>
              <div className="stat-label">Total Stutters</div>
              <div className="stat-value">{sessionReport.totalStutters}</div>
            </div>
            <div>
              <div className="stat-label">Avg BPM</div>
              <div className="stat-value">{sessionReport.avgBpm}</div>
            </div>
            <div>
              <div className="stat-label">Avg GSR</div>
              <div className="stat-value">{sessionReport.avgGsr}</div>
            </div>
          </div>
          <p className="mt-4 text-muted text-sm text-center">
            Report has been saved to Analytics history.
          </p>
        </div>
      )}
    </div>
  );
}
