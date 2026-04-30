"use client";

import { useEffect, useState } from "react";
import { getCourses, getStats, submitFeedback, getFeedbacks, getAnalysis, Course, Stats, FeedbackOutput, Analysis } from "@/lib/api";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { 
  GraduationCap, MessageSquare, Users, 
  Send, ChevronRight, BarChart3, Info, User,
  Menu, X, Search, Sparkles, TrendingUp, MessageSquarePlus
} from 'lucide-react';

const COLORS = ['#10b981', '#6366f1', '#ef4444']; // Positive, Neutral, Negative

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackOutput[]>([]);
  const [studentName, setStudentName] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const data = await getCourses();
        setCourses(data);
        if (data.length > 0) {
          handleCourseSelect(data[0]);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setIsMenuOpen(false);
    setLoading(true);
    try {
      const [statsData, feedbacksData, analysisData] = await Promise.all([
        getStats(course.id),
        getFeedbacks(course.id),
        getAnalysis(course.id)
      ]);
      setStats(statsData);
      setFeedbacks(feedbacksData);
      setAnalysis(analysisData);
    } catch (error) {
      console.error("Failed to load course details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !feedbackContent.trim() || !studentName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await submitFeedback(selectedCourse.id, studentName, feedbackContent);
      setFeedbackContent("");
      // Refresh data
      const [statsData, feedbacksData, analysisData] = await Promise.all([
        getStats(selectedCourse.id),
        getFeedbacks(selectedCourse.id),
        getAnalysis(selectedCourse.id)
      ]);
      setStats(statsData);
      setFeedbacks(feedbacksData);
      setAnalysis(analysisData);
      alert("Merci pour votre feedback !");
    } catch (error) {
      alert("Erreur lors de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = stats ? [
    { name: 'Positif', value: stats.positive },
    { name: 'Neutre', value: stats.neutral },
    { name: 'Négatif', value: stats.negative },
  ] : [];

  const highlightText = (text: string, posWords: string[], negWords: string[]) => {
    if (!posWords.length && !negWords.length) return text;
    
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      const cleanPart = part.toLowerCase().replace(/[^\w]/g, '');
      if (posWords.includes(cleanPart)) {
        return <span key={i} className="text-emerald-400 font-bold underline decoration-emerald-500/30">{part}</span>;
      }
      if (negWords.includes(cleanPart)) {
        return <span key={i} className="text-red-400 font-bold underline decoration-red-500/30">{part}</span>;
      }
      return part;
    });
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 animate-pulse">Initialisation du système...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <GraduationCap className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white">Student Pulse</span>
        </div>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 z-50
        w-[85vw] md:w-80 bg-slate-900/90 md:bg-slate-900/50 
        border-r border-slate-800 p-6 flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="hidden md:flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Student Pulse
          </h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Rechercher une UE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        <nav className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Unités d'Enseignement</p>
          {filteredCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => handleCourseSelect(course)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                selectedCourse?.id === course.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] opacity-70 font-mono tracking-wider">{course.code}</span>
                <span className="text-sm font-medium truncate">{course.name}</span>
              </div>
              <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${selectedCourse?.id === course.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`} />
            </button>
          ))}
          {filteredCourses.length === 0 && (
            <p className="text-slate-600 text-center py-4 text-xs">Aucun résultat trouvé</p>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">FS</div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">Faculté des Sciences</span>
              <span className="text-[10px] text-slate-500 truncate">Université de Yaoundé I</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 md:mb-12 gap-6">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-500/20">Dashboard Live</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Analyse Académique</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Suivi en temps réel pour <span className="text-indigo-400 font-semibold border-b border-indigo-400/30 pb-0.5">{selectedCourse?.name}</span>
            </p>
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto">
             <div className="flex-1 lg:flex-none bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 flex items-center gap-4 hover:border-slate-700 transition-colors shadow-2xl shadow-black/50">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <Users className="text-indigo-400 w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inscrits</p>
                  <p className="text-xl font-black text-white">4 595</p>
                </div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {/* Stats Section */}
          <section className="col-span-1 xl:col-span-2 space-y-6 md:space-y-8">
            
            {/* AI Summary Card */}
            {analysis && (
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl animate-in fade-in slide-in-from-top duration-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                    <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" /> 
                    Insight AI <span className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest ml-2">Analyse Temps Réel</span>
                  </h3>
                  <TrendingUp className="text-slate-500 w-4 h-4" />
                </div>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-medium italic">
                  "{analysis.summary}"
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.pos_keywords.map((w, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">#{w}</span>
                  ))}
                  {analysis.neg_keywords.map((w, i) => (
                    <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">#{w}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 md:p-10 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-indigo-600/10 transition-colors duration-700"></div>
              
              <h3 className="text-xl font-bold flex items-center gap-3 mb-8 text-white">
                <div className="p-2 bg-indigo-600/20 rounded-lg"><BarChart3 className="text-indigo-400 w-5 h-5" /></div>
                Distribution des Sentiments
              </h3>
              
              <div className="h-[320px] w-full">
                {stats && (stats.positive > 0 || stats.neutral > 0 || stats.negative > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                        itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={40}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-medium text-slate-400 ml-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 animate-in fade-in duration-1000">
                    <Info className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-sm font-medium">Aucune donnée pour cette UE</p>
                  </div>
                )}
              </div>
            </div>

            {/* Feedbacks List */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 md:p-10 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                  <div className="p-2 bg-indigo-600/20 rounded-lg"><MessageSquare className="text-indigo-400 w-5 h-5" /></div>
                  Feedbacks Récents
                </h3>
                <span className="text-[10px] bg-slate-800 px-3 py-1.5 rounded-full font-bold text-slate-400 border border-slate-700 uppercase tracking-widest">
                  {feedbacks.length} messages
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {feedbacks.length > 0 ? feedbacks.map((f, i) => (
                  <div key={i} className="bg-slate-950/50 border border-slate-800/50 p-6 rounded-3xl flex flex-col gap-4 hover:border-indigo-500/30 transition-all hover:translate-y-[-2px] group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm tracking-tight group-hover:text-indigo-300 transition-colors">
                            {f.student_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium italic">Étudiant</span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg uppercase font-black tracking-tighter border ${
                        f.sentiment === "positive" ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" :
                        f.sentiment === "negative" ? "bg-red-500/5 text-red-500 border-red-500/20" :
                        "bg-indigo-500/5 text-indigo-500 border-indigo-500/20"
                      }`}>
                        {f.sentiment}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-1 -top-1 text-2xl text-indigo-500/10 font-serif">"</span>
                      <p className="text-slate-400 text-sm leading-relaxed relative z-10 pl-2">
                        {highlightText(f.content, analysis?.pos_keywords || [], analysis?.neg_keywords || [])}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-16 flex flex-col items-center gap-4 text-slate-600">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm font-medium italic">Soyez le premier à donner votre avis !</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Form Section */}
          <section id="feedback-form" className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 lg:p-10 backdrop-blur-xl flex flex-col h-fit xl:sticky xl:top-10 shadow-3xl shadow-indigo-600/5">
            <div className="mb-8">
              <h3 className="text-2xl font-bold flex items-center gap-3 text-white mb-2">
                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/40"><Send className="text-white w-5 h-5" /></div>
                Partager votre Avis
              </h3>
              <p className="text-slate-500 text-xs font-medium">Contribué à l'amélioration de vos cours</p>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Votre Identité</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Message Constructif</label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Points forts, points faibles, suggestions..."
                  className="w-full h-44 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all resize-none shadow-inner leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !feedbackContent.trim() || !studentName.trim()}
                className="group relative w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-5 rounded-2xl transition-all duration-300 overflow-hidden shadow-2xl shadow-indigo-600/20 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-3">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Analyse IA en cours...
                    </>
                  ) : (
                    <>Envoyer l'avis <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-10 p-5 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-start gap-4 animate-in slide-in-from-bottom duration-1000">
              <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                <Info className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[10px] text-indigo-300/80 leading-relaxed font-medium italic">
                Vos retours sont précieux. Ils permettent aux responsables académiques d'ajuster les programmes pour garantir votre succès.
              </p>
            </div>
          </section>
        </div>

        <footer className="mt-20 py-10 border-t border-slate-900 flex flex-col items-center gap-4">
          <div className="flex gap-6 opacity-30">
            <div className="w-10 h-1 border-t-2 border-slate-500"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
            <div className="w-10 h-1 border-t-2 border-slate-500"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Système National de Monitoring</p>
            <p className="text-slate-500 text-[9px] font-medium tracking-wider">© 2025/2026 Faculté des Sciences - Université de Yaoundé I</p>
          </div>
        </footer>

        {/* Floating Action Button for Mobile */}
        <button 
          onClick={() => document.getElementById('feedback-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-6 right-6 lg:hidden z-50 p-4 rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all duration-300 group overflow-hidden"
          title="Partager votre avis"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-500 opacity-100 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-center">
            <MessageSquarePlus className="w-6 h-6 animate-pulse" />
          </div>
        </button>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #312e81;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}
