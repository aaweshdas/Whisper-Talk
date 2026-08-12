import { Link } from "react-router";
import { 
  MessageSquareIcon, 
  ShieldCheckIcon, 
  ZapIcon, 
  GlobeIcon, 
  VideoIcon, 
  ArrowRightIcon 
} from "lucide-react";
import { useAuthStore } from "../lib/auth";

export function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <MessageSquareIcon className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Whisper</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Log in
            </Link>
            <Link to="/auth" className="btn-primary text-sm px-4 py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative px-6 py-24 md:py-32 lg:py-40 flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium mb-8 border border-primary-100 dark:border-primary-800/30">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Whisper 2.0 is now live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Communication, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500">simplified.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed">
            The enterprise-grade platform for real-time messaging, crystal clear video calls, and seamless collaboration. Built for modern teams.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link to={isAuthenticated ? "/chat" : "/auth"} className="btn-primary w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center gap-2">
              Start chatting now
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-secondary w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center">
              Explore features
            </a>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Everything you need to work together</h2>
              <p className="text-slate-600 dark:text-slate-400">Powerful features designed to keep your team connected, productive, and secure.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<ZapIcon className="w-6 h-6 text-amber-500" />}
                title="Real-time Sync"
                desc="Messages are delivered instantly across all your devices with sub-millisecond latency."
              />
              <FeatureCard 
                icon={<VideoIcon className="w-6 h-6 text-primary-500" />}
                title="HD Video Calls"
                desc="Crystal clear one-on-one video calls powered by WebRTC with screen sharing support."
              />
              <FeatureCard 
                icon={<ShieldCheckIcon className="w-6 h-6 text-emerald-500" />}
                title="Enterprise Security"
                desc="End-to-end encryption ensures your conversations stay private and secure."
              />
              <FeatureCard 
                icon={<GlobeIcon className="w-6 h-6 text-blue-500" />}
                title="Global Scale"
                desc="Distributed infrastructure means fast, reliable connections no matter where you are."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Whisper Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="card-standard p-6 flex flex-col items-start hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
