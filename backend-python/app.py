from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
import os
import sys
import threading
import time
import urllib.request
import random
import re

# Import our sentiment module
sys.path.insert(0, os.path.dirname(__file__))
from sentiment import analyze_sentiment

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Correctly locate scripts folder
# Priorities: 1. Local scripts folder (backend-python/scripts), 2. Parent scripts folder (../scripts)
local_scripts = os.path.join(BASE_DIR, 'scripts')
parent_scripts = os.path.join(BASE_DIR, '..', 'scripts')

if os.path.exists(local_scripts):
    SCRIPTS_DIR = local_scripts
elif os.path.exists(parent_scripts):
    SCRIPTS_DIR = parent_scripts
else:
    # Default to local if nothing found yet
    SCRIPTS_DIR = local_scripts

# Use local folder for DB if no persistent disk is available (Render Free)
DB_PATH = os.environ.get('DB_PATH', os.path.join(BASE_DIR, 'student_sentiment.db'))


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    print(f"[DB] Initializing database at {DB_PATH}...")
    print(f"[DB] Scripts directory: {SCRIPTS_DIR}")
    
    # Check if scripts exist
    if not os.path.exists(SCRIPTS_DIR):
        print(f"[DB] ERROR: Scripts directory NOT FOUND at {SCRIPTS_DIR}")
        # Try fallback to local scripts folder if running from within backend-python
        fallback_scripts = os.path.join(BASE_DIR, 'scripts')
        if os.path.exists(fallback_scripts):
            global SCRIPTS_DIR
            SCRIPTS_DIR = fallback_scripts
            print(f"[DB] Found fallback scripts at {SCRIPTS_DIR}")
    
    try:
        conn = get_db()
        c = conn.cursor()

        c.execute("""CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER,
            student_name TEXT,
            content TEXT NOT NULL,
            sentiment TEXT,
            score REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(course_id) REFERENCES courses(id)
        )""")

        # Seed courses
        count = c.execute("SELECT COUNT(*) FROM courses").fetchone()[0]
        if count == 0:
            courses_path = os.path.join(SCRIPTS_DIR, 'courses.json')
            if os.path.exists(courses_path):
                with open(courses_path, 'r', encoding='utf-8') as f:
                    courses = json.load(f)
                for course in courses:
                    c.execute("INSERT INTO courses (code, name) VALUES (?, ?)",
                            (course['code'], course['name']))
                print(f"[DB] Inserted {len(courses)} courses.")
            else:
                print(f"[DB] WARNING: {courses_path} NOT FOUND.")

        # Seed students
        count = c.execute("SELECT COUNT(*) FROM students").fetchone()[0]
        if count == 0:
            students_path = os.path.join(SCRIPTS_DIR, 'students.json')
            if os.path.exists(students_path):
                with open(students_path, 'r', encoding='utf-8') as f:
                    students = json.load(f)
                
                # Clean and filter students
                students = [s for s in students if s['name'] and not s['name'][0].isdigit()]
                random.shuffle(students)
                
                for s in students:
                    try:
                        c.execute("INSERT OR IGNORE INTO students (name, email) VALUES (?, ?)",
                                (s['name'], s['email']))
                    except Exception:
                        pass
                print(f"[DB] Inserted {len(students)} clean students.")

        # Seed 200 random feedbacks
        fb_count = c.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
        if fb_count == 0:
            sample_comments = [
                ("C'est un excellent cours, très bien structuré !", "positive"),
                ("Le professeur explique très clairement.", "positive"),
                ("J'adore ce module, très enrichissant !", "positive"),
                ("Contenu très intéressant et motivant.", "positive"),
                ("Super cours, logique et facile à suivre.", "positive"),
                ("Un peu difficile à suivre parfois.", "negative"),
                ("Pas assez de travaux pratiques.", "negative"),
                ("Les maths sont trop compliquées pour moi.", "negative"),
                ("Le cours manque d'exercices corrigés.", "negative"),
                ("Trop de théorie, pas assez de pratique.", "negative"),
                ("Cours correct, ni trop facile ni trop dur.", "neutral"),
                ("Contenu standard, rien d'exceptionnel.", "neutral"),
                ("Acceptable, peut mieux faire.", "neutral"),
            ]
            
            rows = c.execute("SELECT id FROM courses").fetchall()
            c_ids = [r['id'] for r in rows]
            
            rows = c.execute("SELECT name FROM students").fetchall()
            s_names = [r['name'] for r in rows]
            
            if c_ids and s_names:
                for _ in range(min(200, len(s_names))):
                    course_id = random.choice(c_ids)
                    student_name = random.choice(s_names)
                    comment, sentiment = random.choice(sample_comments)
                    _, score = analyze_sentiment(comment)
                    
                    c.execute(
                        "INSERT INTO feedback (course_id, student_name, content, sentiment, score) VALUES (?, ?, ?, ?, ?)",
                        (course_id, student_name, comment, sentiment, score)
                    )
                print(f"[DB] Seeded 200 random feedbacks.")

        conn.commit()
        conn.close()
        print("--- DB INIT SUCCESS ---")
    except Exception as e:
        print(f"--- DB INIT FATAL ERROR: {e} ---")



@app.route('/api/ping')
def ping():
    return 'pong', 200


@app.route('/api/courses')
def get_courses():
    conn = get_db()
    courses = conn.execute("SELECT id, code, name FROM courses").fetchall()
    conn.close()
    return jsonify([dict(c) for c in courses])


@app.route('/api/feedback', methods=['POST'])
def post_feedback():
    data = request.get_json()
    course_id = data.get('course_id')
    student_name = data.get('student_name', 'Anonyme')
    content = data.get('content', '')

    sentiment, score = analyze_sentiment(content)

    conn = get_db()
    conn.execute(
        "INSERT INTO feedback (course_id, student_name, content, sentiment, score) VALUES (?, ?, ?, ?, ?)",
        (course_id, student_name, content, sentiment, score)
    )
    conn.commit()
    conn.close()

    return jsonify({'sentiment': sentiment, 'score': score})


@app.route('/api/feedback/<int:course_id>')
def get_feedbacks(course_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT student_name, content, sentiment FROM feedback WHERE course_id = ? ORDER BY id DESC LIMIT 50",
        (course_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/stats/<int:course_id>')
def get_stats(course_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT sentiment, COUNT(*) as count FROM feedback WHERE course_id = ? GROUP BY sentiment",
        (course_id,)
    ).fetchall()
    conn.close()
    stats = {'positive': 0, 'neutral': 0, 'negative': 0}
    for row in rows:
        s = row['sentiment']
        if s in stats:
            stats[s] = row['count']
    return jsonify(stats)


@app.route('/api/analysis/<int:course_id>')
def get_analysis(course_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT content, sentiment FROM feedback WHERE course_id = ?",
        (course_id,)
    ).fetchall()
    conn.close()

    if not rows:
        return jsonify({
            'summary': "Pas encore assez de feedbacks pour une analyse approfondie.",
            'keywords': [],
            'trends': "Stable"
        })

    all_content = " ".join([row['content'].lower() for row in rows])
    
    # Simple keyword extraction
    from sentiment import POSITIVE_WORDS, NEGATIVE_WORDS
    
    pos_found = {}
    neg_found = {}
    
    words = re.findall(r'\w+', all_content)
    for w in words:
        if w in POSITIVE_WORDS:
            pos_found[w] = pos_found.get(w, 0) + 1
        elif w in NEGATIVE_WORDS:
            neg_found[w] = neg_found.get(w, 0) + 1
            
    # Get top 3 of each
    top_pos = [w[0] for w in sorted(pos_found.items(), key=lambda x: x[1], reverse=True)[:3]]
    top_neg = [w[0] for w in sorted(neg_found.items(), key=lambda x: x[1], reverse=True)[:3]]
    
    sentiment_counts = {'positive': 0, 'neutral': 0, 'negative': 0}
    for r in rows:
        sentiment_counts[r['sentiment']] = sentiment_counts.get(r['sentiment'], 0) + 1
        
    total = len(rows)
    pos_pct = (sentiment_counts['positive'] / total) * 100
    
    # Natural phrasing logic
    def join_keywords(words):
        if not words: return ""
        if len(words) == 1: return words[0]
        return ", ".join(words[:-1]) + " et " + words[-1]

    pos_context = f"les aspects tels que {join_keywords(top_pos)}" if top_pos else "la qualité globale du cours"
    neg_context = f"des points comme {join_keywords(top_neg)}" if top_neg else "quelques aspects techniques"

    if pos_pct > 75:
        summary = f"Ce cours est un franc succès ! Les étudiants sont particulièrement enthousiastes concernant {pos_context}. L'approche pédagogique semble parfaitement adaptée."
    elif pos_pct > 50:
        summary = f"Le bilan est globalement positif. Bien que {pos_context} soit apprécié, certains étudiants signalent {neg_context}. Un ajustement sur ces points pourrait encore améliorer l'expérience."
    elif pos_pct > 30:
        summary = f"L'opinion est mitigée. Si certains apprécient {pos_context}, une part significative de la classe exprime des réserves sur {neg_context}. Une attention particulière à ces critiques est recommandée."
    else:
        summary = f"Attention : le niveau de satisfaction est préoccupant. Les retours pointent majoritairement vers des difficultés majeures concernant {neg_context}. Une révision en profondeur de la méthode ou du support semble nécessaire."

    return jsonify({
        'summary': summary,
        'keywords': top_pos + top_neg,
        'pos_keywords': top_pos,
        'neg_keywords': top_neg,
        'total_feedbacks': total
    })


def auto_ping():
    """Keep the server alive (useful for Render free tier)."""
    public_url = os.environ.get('PUBLIC_URL', 'http://localhost:8080')
    while True:
        time.sleep(600)  # every 10 minutes
        try:
            urllib.request.urlopen(f"{public_url}/api/ping", timeout=10)
            print(f"[AutoPing] Pinged {public_url}/api/ping")
        except Exception as e:
            print(f"[AutoPing] Failed: {e}")


if __name__ == '__main__':
    print("[Student Pulse] Initializing database...")
    init_db()
    print("[Student Pulse] Database ready!")

    # Start auto-ping thread
    ping_thread = threading.Thread(target=auto_ping, daemon=True)
    ping_thread.start()

    port = int(os.environ.get('PORT', 8080))
    print(f"[Student Pulse] Server running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
