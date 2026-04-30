"use client";

import Link from "next/link";
import { 
  GraduationCap, ShieldCheck, Cpu, 
  ChevronLeft, Info, Lock, Eye, 
  MessageSquare, BarChart3, Database
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Abstract Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm mb-12 transition-all hover:-translate-x-1 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Retour au Dashboard
        </Link>

        {/* Header Section */}
        <header className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Student Pulse</h1>
          </div>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl font-medium italic">
            "Donner une voix aux étudiants pour bâtir l'excellence académique de demain."
          </p>
        </header>

        <div className="space-y-16">
          {/* Mission Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Info className="w-6 h-6 text-indigo-400" />
              À propos de la plateforme
            </h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-6 leading-relaxed">
              <p>
                <strong>Student Pulse</strong> est un écosystème intelligent conçu spécifiquement pour la <strong>Faculté des Sciences de l'Université de Yaoundé I</strong>. 
                Il permet de capturer, traiter et visualiser le ressenti des étudiants sur les Unités d'Enseignement (UE) en temps réel.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-white">Feedback Continu</h3>
                  <p className="text-sm text-slate-500">Permet aux étudiants d'exprimer leurs avis sur les cours de manière structurée et constructive.</p>
                </div>
                <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-white">Pilotage Académique</h3>
                  <p className="text-sm text-slate-500">Offre aux responsables une vision claire des points forts et des axes d'amélioration.</p>
                </div>
              </div>
            </div>
          </section>

          {/* AI Tech Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Cpu className="w-6 h-6 text-purple-400" />
              L'Analyse par Intelligence Artificielle
            </h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-6">
              <p className="leading-relaxed">
                Contrairement aux sondages traditionnels, Student Pulse utilise des algorithmes de <strong>Traitement du Langage Naturel (NLP)</strong> pour analyser la tonalité des messages.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-indigo-500/20 rounded-md"><Database className="w-4 h-4 text-indigo-400" /></div>
                  <p className="text-sm text-slate-400"><strong>Extraction de Mots-Clés :</strong> L'IA identifie automatiquement les thèmes récurrents (ex: pédagogie, support de cours, horaires).</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-indigo-500/20 rounded-md"><ShieldCheck className="w-4 h-4 text-indigo-400" /></div>
                  <p className="text-sm text-slate-400"><strong>Score de Sentiment :</strong> Chaque avis reçoit un score précis (Positif, Neutre, Négatif) pour générer des statistiques globales fiables.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Legal Section / Disclaimer */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Lock className="w-6 h-6 text-red-400" />
              Consentement et Confidentialité
            </h2>
            <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 backdrop-blur-xl space-y-6 border-l-4 border-l-red-500">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-[10px]">
                <Eye className="w-3 h-3" /> Note Importante / Disclaimer
              </div>
              <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
                <p>
                  En utilisant la plateforme Student Pulse et en soumettant un feedback, l'utilisateur reconnaît et accepte les conditions suivantes :
                </p>
                <ul className="list-disc pl-5 space-y-3">
                  <li>
                    <strong>Finalité :</strong> Les données collectées sont utilisées exclusivement à des fins d'amélioration de la qualité de l'enseignement au sein de la Faculté des Sciences.
                  </li>
                  <li>
                    <strong>Analyse IA :</strong> L'utilisateur consent à ce que ses commentaires soient traités par un moteur d'Intelligence Artificielle pour en extraire des statistiques anonymisées.
                  </li>
                  <li>
                    <strong>Identité :</strong> Bien que le nom soit requis pour assurer l'intégrité du système, les rapports globaux présentés aux autorités académiques se concentrent sur les tendances collectives et non individuelles.
                  </li>
                  <li>
                    <strong>Responsabilité :</strong> L'utilisateur s'engage à fournir des commentaires respectueux, constructifs et exempts de tout propos injurieux ou diffamatoire.
                  </li>
                </ul>
                <p className="pt-4 font-bold text-slate-300">
                  L'utilisation continue de ce service vaut pour consentement exprès au traitement de vos données selon les termes susmentionnés.
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 pt-10 border-t border-slate-900 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
               <GraduationCap className="w-4 h-4 text-slate-500" />
             </div>
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Université de Yaoundé I</p>
          </div>
          <Link 
            href="/" 
            className="px-8 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-full text-sm font-bold border border-indigo-500/20 transition-all"
          >
            Commencer l'Analyse
          </Link>
        </footer>
      </main>
    </div>
  );
}
