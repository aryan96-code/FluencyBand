import React from 'react';
import { useSensorData } from '../hooks/useSensorData';
import { Line } from 'react-chartjs-2';
import { Heart, Activity, Mic as MicIcon, Move, Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { data, history, isConnected, consoleLogs } = useSensorData();

  const chartData = {
    labels: history.map(h => h.time),
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: history.map(h => h.bpm),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { min: 60, max: 120, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { display: false }
    },
    animation: { duration: 0 }
  };

  const getPredictionColor = (pred) => {
    switch(pred) {
      case 'NORMAL': return 'var(--success)';
      case 'PRE-STUTTER': return 'var(--warning)';
      case 'STUTTER': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2>Live AI Dashboard</h2>
        <div className={`status-badge ${isConnected ? 'status-success' : 'status-warning'}`}>
          <div className="status-dot"></div>
          {isConnected ? 'Backend Connected' : 'Simulated Data (Local)'}
          {isConnected ? <Wifi size={14}/> : <WifiOff size={14}/>}
        </div>
      </div>

      <div className="card mb-4" style={{ background: `linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.9)), linear-gradient(135deg, ${getPredictionColor(data.prediction)}, transparent)` }}>
        <div className="flex justify-between items-center">
          <div>
            <div className="stat-label">AI PREDICTION STATUS</div>
            <div className="stat-value" style={{ color: getPredictionColor(data.prediction) }}>
              {data.prediction}
            </div>
          </div>
          <div>
            {data.prediction === 'NORMAL' ? <CheckCircle2 size={48} color="var(--success)"/> : <AlertCircle size={48} color={getPredictionColor(data.prediction)} className="anim-pulse"/>}
          </div>
        </div>
      </div>

      <div className="grid-4 mb-4">
        <div className="stat-box">
          <Heart className="stat-icon" size={48} />
          <div className="stat-label">Heart Rate</div>
          <div className="flex items-end">
            <span className="stat-value">{data.bpm}</span>
            <span className="stat-unit">BPM</span>
          </div>
        </div>
        <div className="stat-box">
          <Activity className="stat-icon" size={48} />
          <div className="stat-label">GSR (Stress)</div>
          <div className="flex items-end">
            <span className="stat-value">{data.gsr}</span>
            <span className="stat-unit">Ω</span>
          </div>
        </div>
        <div className="stat-box">
          <MicIcon className="stat-icon" size={48} />
          <div className="stat-label">Audio Level</div>
          <div className="flex items-end">
            <span className="stat-value">{data.mic}</span>
            <span className="stat-unit">dB</span>
          </div>
        </div>
        <div className="stat-box">
          <Move className="stat-icon" size={48} />
          <div className="stat-label">Motion Factor</div>
          <div className="flex items-end">
            <span className="stat-value">{data.motion}</span>
            <span className="stat-unit">g</span>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title"><Activity size={18}/> Live Physiological Trend</div>
        </div>
        <div style={{ height: '200px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card mb-0">
          <div className="card-header">
            <div className="card-title">Real-Time Packet Console</div>
          </div>
          <div className="console">
            {consoleLogs.map((log, i) => (
              <p key={i}>{log}</p>
            ))}
          </div>
        </div>
        <div className="card mb-0 flex-col justify-between">
          <div>
            <div className="card-title mb-4">Smart Indicators</div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="stat-label">Stress Trend (GSR Base)</span>
                <span className="font-semibold text-sm">{data.gsr > 700 ? 'High' : 'Normal'}</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${Math.min((data.gsr / 1000) * 100, 100)}%`, background: data.gsr > 700 ? 'var(--warning)' : 'var(--primary)' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="stat-label">Motor Feedback Warning</span>
                <span className="font-semibold text-sm">{data.motion > 0.8 ? 'Elevated' : 'Stable'}</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${Math.min((data.motion / 2) * 100, 100)}%`, background: data.motion > 0.8 ? 'var(--danger)' : 'var(--primary-light)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
