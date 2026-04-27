import { useState, useEffect, useRef } from 'react';

export const useSensorData = () => {
  const [data, setData] = useState({
    bpm: 0,
    gsr: 0,
    mic: 0,
    motion: 0,
    prediction: 'NORMAL' // NORMAL, PRE-STUTTER, STUTTER
  });
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const MAX_HISTORY = 30; // 30 seconds of history for chart

  const addLog = (msg) => {
    setConsoleLogs(prev => {
      const newLogs = [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev];
      if (newLogs.length > 50) newLogs.pop();
      return newLogs;
    });
  };

  useEffect(() => {
    let interval;
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/sensor');
        if (response.ok) {
          const json = await response.json();
          setData(json);
          setIsConnected(true);
          
          setHistory(prev => {
            const newHistory = [...prev, { time: new Date().toLocaleTimeString(), ...json }];
            if (newHistory.length > MAX_HISTORY) newHistory.shift();
            return newHistory;
          });
          
          addLog(`RCV: BPM:${json.bpm} GSR:${json.gsr} PREDICT:${json.prediction}`);
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        setIsConnected(false);
        // Fallback to simulated data if backend is not actually running for UI demonstration purposes
        const simBpm = 75 + Math.floor(Math.random() * 15);
        const simGsr = 500 + Math.floor(Math.random() * 250);
        const simMic = 25 + Math.floor(Math.random() * 20);
        const simMotion = Math.random().toFixed(2);
        
        const rand = Math.random();
        let simPred = 'NORMAL';
        if (rand > 0.95) simPred = 'STUTTER';
        else if (rand > 0.8) simPred = 'PRE-STUTTER';

        const json = { bpm: simBpm, gsr: simGsr, mic: simMic, motion: parseFloat(simMotion), prediction: simPred };
        setData(json);
        setHistory(prev => {
          const newHistory = [...prev, { time: new Date().toLocaleTimeString(), ...json }];
          if (newHistory.length > MAX_HISTORY) newHistory.shift();
          return newHistory;
        });
        addLog(`(SIM) RCV: BPM:${json.bpm} GSR:${json.gsr} PREDICT:${json.prediction}`);
      }
    };

    fetchData(); // Initial fetch
    interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  return { data, history, isConnected, consoleLogs };
};
