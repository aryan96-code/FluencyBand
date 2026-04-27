import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    avg_bpm INTEGER,
                    avg_gsr INTEGER,
                    stutters INTEGER,
                    stress INTEGER,
                    fluency_score REAL
                )''')
    c.execute('''CREATE TABLE IF NOT EXISTS word_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    word TEXT UNIQUE,
                    count INTEGER
                )''')
    c.execute('''CREATE TABLE IF NOT EXISTS therapy_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    module_name TEXT,
                    completion_score INTEGER,
                    last_performed TEXT
                )''')
    conn.commit()
    conn.close()

init_db()

# Active Session State
active_session = None

@app.route('/sensor', methods=['GET'])
def get_sensor_data():
    sim_bpm = 75 + random.randint(0, 15)
    sim_gsr = 500 + random.randint(0, 250)
    sim_mic = 25 + random.randint(0, 20)
    sim_motion = round(random.uniform(0.1, 1.2), 2)
    
    rand = random.random()
    if rand > 0.95:
        sim_pred = 'STUTTER'
    elif rand > 0.8:
        sim_pred = 'PRE-STUTTER'
    else:
        sim_pred = 'NORMAL'
        
    return jsonify({
        "bpm": sim_bpm,
        "gsr": sim_gsr,
        "mic": sim_mic,
        "motion": sim_motion,
        "prediction": sim_pred
    })

@app.route('/session/start', methods=['POST'])
def session_start():
    global active_session
    active_session = {
        "samples": 0,
        "stutters": 0,
        "stress": 0,
        "total_bpm": 0,
        "total_gsr": 0,
        "total_mic": 0,
        "total_motion": 0
    }
    return jsonify({"status": "Session started"}), 200

@app.route('/session/update', methods=['POST'])
def session_update():
    global active_session
    if active_session is None:
        return jsonify({"error": "No active session"}), 400
        
    data = request.json
    active_session['samples'] += 1
    active_session['total_bpm'] += data.get('bpm', 0)
    active_session['total_gsr'] += data.get('gsr', 0)
    active_session['total_mic'] += data.get('mic', 0)
    active_session['total_motion'] += data.get('motion', 0)
    
    pred = data.get('prediction', 'NORMAL')
    if pred == 'STUTTER':
        active_session['stutters'] += 1
    elif pred == 'PRE-STUTTER':
        active_session['stress'] += 1
        
    return jsonify({"status": "Updated"}), 200

@app.route('/session/end', methods=['POST'])
def session_end():
    global active_session
    if active_session is None or active_session['samples'] == 0:
        active_session = None
        return jsonify({"error": "Invalid session"}), 400
        
    samples = active_session['samples']
    avg_bpm = int(active_session['total_bpm'] / samples)
    avg_gsr = int(active_session['total_gsr'] / samples)
    stutters = active_session['stutters']
    stress = active_session['stress']
    
    # AI Fluency Score Logic
    score = 100 - (stutters * 5) - (stress * 2)
    fluency_score = max(0, min(100, score))
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT INTO sessions (timestamp, avg_bpm, avg_gsr, stutters, stress, fluency_score) 
                 VALUES (?, ?, ?, ?, ?, ?)''', (timestamp, avg_bpm, avg_gsr, stutters, stress, fluency_score))
    conn.commit()
    conn.close()
    
    report = {
        "date": timestamp,
        "avgBpm": avg_bpm,
        "avgGsr": avg_gsr,
        "totalStutters": stutters,
        "totalStress": stress,
        "fluencyScore": fluency_score
    }
    
    active_session = None
    return jsonify(report), 200

@app.route('/reports', methods=['GET'])
def get_reports():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM sessions ORDER BY id DESC')
    rows = c.fetchall()
    conn.close()
    
    reports = []
    for r in rows:
        reports.append({
            "id": r["id"],
            "date": r["timestamp"],
            "avgBpm": r["avg_bpm"],
            "avgGsr": r["avg_gsr"],
            "totalStutters": r["stutters"],
            "totalStress": r["stress"],
            "fluencyScore": r["fluency_score"]
        })
    return jsonify(reports), 200

@app.route('/words/add', methods=['POST'])
def add_word():
    data = request.json
    word = data.get('word', '').strip().lower()
    if not word:
        return jsonify({"error": "No word provided"}), 400
        
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT count FROM word_history WHERE word = ?', (word,))
    row = c.fetchone()
    if row:
        c.execute('UPDATE word_history SET count = count + 1 WHERE word = ?', (word,))
    else:
        c.execute('INSERT INTO word_history (word, count) VALUES (?, 1)', (word,))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "Word added"}), 200

@app.route('/words/top', methods=['GET'])
def get_top_words():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT word, count FROM word_history ORDER BY count DESC LIMIT 10')
    rows = c.fetchall()
    conn.close()
    
    words = {r["word"]: r["count"] for r in rows}
    return jsonify(words), 200

@app.route('/recommendation', methods=['GET'])
def get_recommendation():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM sessions ORDER BY id DESC LIMIT 1')
    latest = c.fetchone()
    conn.close()
    
    suggestions = []
    if latest:
        stutters = latest["stutters"]
        stress = latest["stress"]
        
        if stutters > 3:
            suggestions.append({
                "text": "Frequent hesitation detected in speech.",
                "therapy": "Difficult Word Repetition",
                "therapy_id": 3
            })
        if stress > 5 or latest["avg_gsr"] > 600:
            suggestions.append({
                "text": "Stress spikes before speaking observed. Practice breathing exercises to improve fluency.",
                "therapy": "Breathing Regulation",
                "therapy_id": 1
            })
            
    if not suggestions:
        suggestions.append({
            "text": "Your speech is generally fluent. Keep practicing to maintain confidence.",
            "therapy": "Continuous Fluency Test",
            "therapy_id": 5
        })
        
    return jsonify(suggestions), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
