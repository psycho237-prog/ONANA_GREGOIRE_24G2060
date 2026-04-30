use axum::{
    routing::{get, post},
    extract::{Path, State},
    Json, Router,
};
use tower_http::services::ServeDir;
use tower_http::cors::CorsLayer;
use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::sync::{Arc, Mutex};
use std::process::Command;
use tokio::time::{self, Duration};

#[derive(Serialize, Deserialize, Clone)]
struct Course {
    id: i32,
    code: String,
    name: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct Student {
    name: String,
    email: String,
}

#[derive(Deserialize)]
struct FeedbackInput {
    course_id: i32,
    student_name: String,
    content: String,
}

#[derive(Serialize)]
struct FeedbackOutput {
    student_name: String,
    content: String,
    sentiment: String,
}

#[derive(Serialize)]
struct SentimentResult {
    sentiment: String,
    score: f64,
}

#[derive(Serialize)]
struct Stats {
    positive: i32,
    neutral: i32,
    negative: i32,
}

struct AppState {
    db: Arc<Mutex<Connection>>,
}

#[tokio::main]
async fn main() {
    // Initialize DB
    let conn = Connection::open("student_sentiment.db").expect("Failed to open database");
    init_db(&conn);

    let shared_state = Arc::new(AppState {
        db: Arc::new(Mutex::new(conn)),
    });

    // Auto-ping background task (std HTTP without reqwest)
    let public_url = std::env::var("PUBLIC_URL")
        .unwrap_or_else(|_| "http://localhost:8080".to_string());
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(600)); // 10 min
        loop {
            interval.tick().await;
            println!("[AutoPing] Pinging {}/api/ping ...", public_url);
            let ping_url = format!("{}/api/ping", public_url);
            // Use a blocking thread for the simple TCP ping
            let _ = tokio::task::spawn_blocking(move || {
                let url = ping_url.trim_start_matches("http://")
                    .trim_start_matches("https://");
                let host_port = if url.contains(':') {
                    url.to_string()
                } else {
                    format!("{}:80", url.split('/').next().unwrap_or(url))
                };
                std::net::TcpStream::connect(host_port)
            }).await;
        }
    });

    let static_dir = std::env::var("STATIC_DIR").unwrap_or_else(|_| "public".to_string());

    let app = Router::new()
        .route("/api/courses", get(get_courses))
        .route("/api/feedback", post(submit_feedback))
        .route("/api/feedback/:course_id", get(get_feedbacks))
        .route("/api/stats/:course_id", get(get_stats))
        .route("/api/ping", get(|| async { "pong" }))
        .fallback_service(ServeDir::new(static_dir))
        .layer(CorsLayer::permissive())
        .with_state(shared_state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_addr = format!("0.0.0.0:{}", port);
    println!("[Student Pulse] Server running on http://{}", bind_addr);

    let listener = tokio::net::TcpListener::bind(&bind_addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

fn init_db(conn: &Connection) {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL
        )",
        [],
    ).unwrap();

    conn.execute(
        "CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER,
            student_name TEXT,
            content TEXT NOT NULL,
            sentiment TEXT,
            score REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(course_id) REFERENCES courses(id)
        )",
        [],
    ).unwrap();

    conn.execute(
        "CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
        )",
        [],
    ).unwrap();

    // Seed courses
    let count_courses: i32 = conn.query_row("SELECT COUNT(*) FROM courses", [], |r| r.get(0)).unwrap();
    if count_courses == 0 {
        let courses_path = "../scripts/courses.json";
        let courses_json = std::fs::read_to_string(courses_path).expect("courses.json not found");
        let courses: Vec<serde_json::Value> = serde_json::from_str(&courses_json).unwrap();
        for c in &courses {
            conn.execute(
                "INSERT INTO courses (code, name) VALUES (?, ?)",
                params![c["code"].as_str().unwrap(), c["name"].as_str().unwrap()],
            ).unwrap();
        }
        println!("[DB] Inserted {} courses.", courses.len());
    }

    // Seed students + initial feedbacks
    let count_students: i32 = conn.query_row("SELECT COUNT(*) FROM students", [], |r| r.get(0)).unwrap();
    if count_students == 0 {
        if let Ok(students_json) = std::fs::read_to_string("../scripts/students.json") {
            let students: Vec<Student> = serde_json::from_str(&students_json).unwrap();
            for s in &students {
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO students (name, email) VALUES (?, ?)",
                    params![s.name, s.email],
                );
            }
            println!("[DB] Inserted {} students.", students.len());

            // Seed 200 initial feedbacks with realistic comments
            let sample = [
                ("C'est un excellent cours, très bien structuré !", "positive", 0.8),
                ("Le professeur explique très clairement.", "positive", 0.7),
                ("J'adore ce module, très enrichissant !", "positive", 0.9),
                ("Contenu très intéressant et motivant.", "positive", 0.7),
                ("Super cours, logique et facile à suivre.", "positive", 0.8),
                ("Un peu difficile à suivre parfois.", "negative", -0.5),
                ("Pas assez de travaux pratiques.", "negative", -0.6),
                ("Les maths sont trop compliquées pour moi.", "negative", -0.7),
                ("Le cours manque d'exercices corrigés.", "negative", -0.5),
                ("Trop de théorie, pas assez de pratique.", "negative", -0.6),
                ("Cours correct, ni trop facile ni trop dur.", "neutral", 0.0),
                ("Contenu standard, rien d'exceptionnel.", "neutral", 0.0),
                ("Acceptable, peut mieux faire.", "neutral", 0.1),
            ];

            let num_courses: i32 = conn.query_row("SELECT COUNT(*) FROM courses", [], |r| r.get(0)).unwrap();
            for i in 0..std::cmp::min(200, students.len()) {
                let s = &students[i];
                let course_id = (i as i32 % num_courses) + 1;
                let (comment, sentiment, score) = sample[i % sample.len()];
                conn.execute(
                    "INSERT INTO feedback (course_id, student_name, content, sentiment, score) VALUES (?, ?, ?, ?, ?)",
                    params![course_id, s.name, comment, sentiment, score],
                ).unwrap();
            }
            println!("[DB] Seeded 200 initial feedbacks.");
        }
    }
}

async fn get_courses(State(state): State<Arc<AppState>>) -> Json<Vec<Course>> {
    let db = state.db.lock().unwrap();
    let mut stmt = db.prepare("SELECT id, code, name FROM courses").unwrap();
    let courses: Vec<Course> = stmt.query_map([], |row| {
        Ok(Course { id: row.get(0)?, code: row.get(1)?, name: row.get(2)? })
    }).unwrap().map(|c| c.unwrap()).collect();
    Json(courses)
}

async fn submit_feedback(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<FeedbackInput>,
) -> Json<SentimentResult> {
    // Call Python script for sentiment analysis
    let content = payload.content.clone();
    let output = tokio::task::spawn_blocking(move || {
        Command::new("python3")
            .arg("../backend-python/sentiment.py")
            .arg(&content)
            .output()
    }).await.unwrap();

    let (sentiment, score) = match output {
        Ok(out) => {
            let result_str = String::from_utf8_lossy(&out.stdout);
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&result_str) {
                let s = v["sentiment"].as_str().unwrap_or("neutral").to_string();
                let sc = v["score"].as_f64().unwrap_or(0.0);
                (s, sc)
            } else {
                ("neutral".to_string(), 0.0)
            }
        }
        Err(_) => ("neutral".to_string(), 0.0),
    };

    let db = state.db.lock().unwrap();
    db.execute(
        "INSERT INTO feedback (course_id, student_name, content, sentiment, score) VALUES (?, ?, ?, ?, ?)",
        params![payload.course_id, payload.student_name, payload.content, sentiment, score],
    ).unwrap();

    Json(SentimentResult { sentiment, score })
}

async fn get_feedbacks(
    State(state): State<Arc<AppState>>,
    Path(course_id): Path<i32>,
) -> Json<Vec<FeedbackOutput>> {
    let db = state.db.lock().unwrap();
    let mut stmt = db.prepare(
        "SELECT student_name, content, sentiment FROM feedback WHERE course_id = ? ORDER BY id DESC LIMIT 50"
    ).unwrap();
    let feedbacks: Vec<FeedbackOutput> = stmt.query_map(params![course_id], |row| {
        Ok(FeedbackOutput {
            student_name: row.get(0)?,
            content: row.get(1)?,
            sentiment: row.get(2)?,
        })
    }).unwrap().map(|f| f.unwrap()).collect();
    Json(feedbacks)
}

async fn get_stats(
    State(state): State<Arc<AppState>>,
    Path(course_id): Path<i32>,
) -> Json<Stats> {
    let db = state.db.lock().unwrap();
    let mut stats = Stats { positive: 0, neutral: 0, negative: 0 };
    let mut stmt = db.prepare(
        "SELECT sentiment, COUNT(*) FROM feedback WHERE course_id = ? GROUP BY sentiment"
    ).unwrap();
    let mut rows = stmt.query(params![course_id]).unwrap();
    while let Some(row) = rows.next().unwrap() {
        let sentiment: String = row.get(0).unwrap();
        let count: i32 = row.get(1).unwrap();
        match sentiment.as_str() {
            "positive" => stats.positive = count,
            "neutral"  => stats.neutral  = count,
            "negative" => stats.negative = count,
            _ => (),
        }
    }
    Json(stats)
}
