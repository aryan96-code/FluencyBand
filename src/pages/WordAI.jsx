import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Mic, AlertCircle, Sparkles } from 'lucide-react';

export default function WordAI() {
  const [words, setWords] = useState({});
  const [inputWord, setInputWord] = useState('');

  const fetchWords = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/words/top');
      if (res.ok) {
        const data = await res.json();
        setWords(data);
      }
    } catch (e) {
      console.error("Error fetching words:", e);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const addWord = async (e) => {
    e.preventDefault();
    if (!inputWord.trim()) return;
    
    const word = inputWord.trim().toLowerCase();
    
    try {
      await fetch('http://127.0.0.1:8000/words/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
      });
      setInputWord('');
      fetchWords(); // Refresh the list
    } catch (e) {
      console.error("Error adding word:", e);
    }
  };

  const sortedWords = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const getAIRecommendations = () => {
    if (sortedWords.length === 0) return ["Start adding words to get recommendations."];
    
    const topWord = sortedWords[0][0];
    return [
      `Practice breaking down "${topWord}" into syllables: ${topWord.split('').join('-')}.`,
      "Focus on taking a breath before words starting with consonants.",
      "Slow down your speaking rate by 10% when approaching difficult vocabulary."
    ];
  };

  return (
    <div className="fade-in">
      <h2>Word AI Analysis</h2>
      <p className="text-muted mb-4">Track difficult words where stuttering or hesitation occurred.</p>

      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">Add Difficult Word</div>
        </div>
        <form onSubmit={addWord} className="input-group">
          <input 
            type="text" 
            className="input-text" 
            placeholder="Type word here..." 
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
          />
          <button type="button" className="btn btn-outline" title="Voice Input (Mock)"><Mic size={18}/></button>
          <button type="submit" className="btn btn-primary"><Plus size={18}/> Add</button>
        </form>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><AlertCircle size={18}/> Top Problematic Words</div>
          </div>
          {sortedWords.length > 0 ? (
            <div className="flex-col gap-2">
              {sortedWords.map(([w, count], i) => (
                <div key={w} className="flex justify-between items-center" style={{ padding: '10px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-muted font-mono" style={{ width: '20px' }}>{i+1}.</span>
                    <span className="font-semibold">{w}</span>
                  </div>
                  <span className="status-badge status-warning">{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No words tracked yet.</p>
          )}
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(14,165,233,0.1))', borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <div className="card-title text-gradient"><Sparkles size={18} color="var(--primary)"/> AI Recommendations</div>
          </div>
          <div className="flex-col gap-4">
            {getAIRecommendations().map((rec, i) => (
              <div key={i} style={{ padding: '10px', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.9rem' }}>
                {rec}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
