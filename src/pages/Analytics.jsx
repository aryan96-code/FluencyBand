import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Sparkles, TrendingUp, History, Zap } from 'lucide-react';

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, recRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/reports'),
          fetch('http://127.0.0.1:8000/recommendation')
        ]);
        
        if (reportsRes.ok) {
          const reports = await reportsRes.json();
          setHistory(reports);
        }
        if (recRes.ok) {
          const recs = await recRes.json();
          setSuggestions(recs.map(r => r.text));
        }
      } catch (e) {
        console.error("Could not fetch analytics from backend", e);
      }
    };
    
    fetchData();
  }, []);

  const sortedHistory = [...history].reverse(); // oldest to newest for charts

  const fluencyChartData = {
    labels: sortedHistory.map((_, i) => `Sess ${i+1}`),
    datasets: [{
      label: 'Fluency Score (%)',
      data: sortedHistory.map(h => h.fluencyScore),
      borderColor: 'var(--primary)',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const stressChartData = {
    labels: sortedHistory.map((_, i) => `Sess ${i+1}`),
    datasets: [
      {
        label: 'Stress Peaks',
        data: sortedHistory.map(h => h.totalStress),
        backgroundColor: 'var(--warning)',
      },
      {
        label: 'Stutters',
        data: sortedHistory.map(h => h.totalStutters),
        backgroundColor: 'var(--danger)',
      }
    ]
  };

  return (
    <div className="fade-in">
      <h2>Advanced AI Report Analytics</h2>

      {suggestions.length > 0 && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(14,165,233,0.1))', borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <div className="card-title text-gradient"><Sparkles size={18} color="var(--primary)"/> AI Improvement Suggestions</div>
          </div>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-main)' }}>
            {suggestions.map((s, i) => (
              <li key={i} className="mb-2">{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={18}/> Fluency Evolution</div>
          </div>
          <div style={{ height: '200px' }}>
            <Line data={fluencyChartData} options={{ maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }} />
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Zap size={18}/> Stress vs Stutter</div>
          </div>
          <div style={{ height: '200px' }}>
            <Bar data={stressChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <div className="card-title"><History size={18}/> Session History</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px' }}>Date</th>
                <th style={{ padding: '10px' }}>Score</th>
                <th style={{ padding: '10px' }}>Stutters</th>
                <th style={{ padding: '10px' }}>Stress Peaks</th>
                <th style={{ padding: '10px' }}>Avg BPM</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{h.date}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: h.fluencyScore > 90 ? 'var(--success)' : 'var(--warning)' }}>{h.fluencyScore}%</td>
                  <td style={{ padding: '10px' }}>{h.totalStutters}</td>
                  <td style={{ padding: '10px' }}>{h.totalStress}</td>
                  <td style={{ padding: '10px' }}>{h.avgBpm}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>No sessions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
