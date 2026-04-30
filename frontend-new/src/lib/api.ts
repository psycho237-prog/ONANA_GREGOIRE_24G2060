const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Analysis {
  summary: string;
  keywords: string[];
  pos_keywords: string[];
  neg_keywords: string[];
  total_feedbacks: number;
}

export async function getAnalysis(courseId: number): Promise<Analysis> {
  const res = await fetch(`${API_BASE_URL}/api/analysis/${courseId}`);
  return res.json();
}

export interface Course {
  id: number;
  code: string;
  name: string;
}

export interface SentimentResult {
  sentiment: string;
  score: number;
}

export interface Stats {
  positive: number;
  neutral: number;
  negative: number;
}

export interface FeedbackOutput {
  student_name: string;
  content: string;
  sentiment: string;
}

export async function getCourses(): Promise<Course[]> {
  const res = await fetch(`${API_BASE_URL}/api/courses`);
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function submitFeedback(courseId: number, studentName: string, content: string): Promise<SentimentResult> {
  const res = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId, student_name: studentName, content }),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
}

export async function getStats(courseId: number): Promise<Stats> {
  const res = await fetch(`${API_BASE_URL}/api/stats/${courseId}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function getFeedbacks(courseId: number): Promise<FeedbackOutput[]> {
  const res = await fetch(`${API_BASE_URL}/api/feedback/${courseId}`);
  if (!res.ok) throw new Error('Failed to fetch feedbacks');
  return res.json();
}
