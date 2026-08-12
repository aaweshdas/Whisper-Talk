import { Link } from "react-router";
import { 
  MessageSquareIcon, 
  ShieldCheckIcon, 
  ZapIcon, 
  GlobeIcon, 
  VideoIcon, 
  ArrowRightIcon,
  SparklesIcon,
  LayersIcon,
  SmartphoneIcon,
  LockIcon,
  CheckCircle2Icon,
  TwitterIcon,
  GithubIcon,
  LinkedinIcon,
  MailIcon
} from "lucide-react";
import { useAuthStore } from "../lib/auth";

export function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-primary-500/30 selection:text-white relative overflow-hidden">
      
      {/* Background Image & Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/70 z-10" />
        <img 
          src="/bg.png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-60"
        />
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] z-10 mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-[120px] z-10 mix-blend-screen" />
      </div>

      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group-hover:scale-105 transition-transform">
                <img src="/logo.jpg" alt="Whisper Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Whisper</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#security" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Security</a>
              <a href="#about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">About</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden sm:block">
                Log in
              </Link>
              <Link to="/auth" className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                {isAuthenticated ? "Open Dashboard" : "Get Started"}
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1 flex flex-col">
          {/* Hero Section */}
          <section className="relative px-6 py-20 md:py-28 flex flex-col items-center text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm font-medium mb-8 backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer">
              <SparklesIcon className="w-4 h-4 text-primary-400" />
              <span>Introducing Whisper 2.0 with Glassmorphism UI</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight text-white mb-6 leading-[1.1] drop-shadow-2xl w-full">
              <span className="block mb-1 md:mb-2">The canvas for your mind.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-indigo-400 to-purple-400 block pb-2">The engine for your team.</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 max-w-3xl leading-relaxed drop-shadow-md font-light mx-auto">
              Whisper 2.0 isn't just a communication tool; it's a living workspace. Designed with ultra-low latency architecture, unbreakable cryptographic security, and a mesmerizing glass UI that simply gets out of your way.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
              <Link to={isAuthenticated ? "/chat" : "/auth"} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                Start chatting for free
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-lg flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-all">
                Explore the platform
              </a>
            </div>
          </section>

          {/* Stats / Social Proof */}
          <section className="border-y border-white/10 bg-black/20 backdrop-blur-md py-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
              <div>
                <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Uptime SLA</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">&lt;10ms</div>
                <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Message Latency</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">256-bit</div>
                <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">AES Encryption</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">4K</div>
                <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Video Quality</div>
              </div>
            </div>
          </section>

          {/* Core Features Grid */}
          <section id="features" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Master your workflow</h2>
                <p className="text-xl text-slate-400">A meticulously crafted suite of tools that adapt to how your team works, wrapped in a beautiful, distraction-free environment.</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                  icon={<ZapIcon className="w-7 h-7 text-amber-400" />}
                  title="Lightning Fast Sync"
                  desc="Messages, read receipts, and typing indicators are delivered instantly across all devices using optimized WebSockets."
                  glowColor="group-hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                />
                <FeatureCard 
                  icon={<VideoIcon className="w-7 h-7 text-primary-400" />}
                  title="Immersive Video"
                  desc="Switch from text to crystal-clear HD video calls with a single click. Powered by advanced WebRTC architecture."
                  glowColor="group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                />
                <FeatureCard 
                  icon={<LayersIcon className="w-7 h-7 text-purple-400" />}
                  title="Floating Panes UI"
                  desc="A revolutionary glassmorphism interface that lets you drag, resize, and focus on what matters most."
                  glowColor="group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                />
                <FeatureCard 
                  icon={<ShieldCheckIcon className="w-7 h-7 text-emerald-400" />}
                  title="Bank-Grade Security"
                  desc="Your data is encrypted at rest and in transit. Granular permissions and secure Google OAuth integration."
                  glowColor="group-hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]"
                />
                <FeatureCard 
                  icon={<GlobeIcon className="w-7 h-7 text-blue-400" />}
                  title="Global Edge Network"
                  desc="Hosted on distributed infrastructure to ensure fast, reliable connections no matter where your team is located."
                  glowColor="group-hover:shadow-[0_0_30px_rgba(96,165,250,0.2)]"
                />
                <FeatureCard 
                  icon={<SmartphoneIcon className="w-7 h-7 text-pink-400" />}
                  title="Cross-Platform"
                  desc="Seamlessly transition between your desktop, tablet, and mobile devices without losing context or history."
                  glowColor="group-hover:shadow-[0_0_30px_rgba(244,114,182,0.2)]"
                />
              </div>
            </div>
          </section>

          {/* Deep Dive Feature (Security) */}
          <section id="security" className="py-32 relative overflow-hidden bg-black/40 border-y border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black/0 to-black/0" />
            <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-white mb-4">
                  <LockIcon className="w-8 h-8" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">Privacy isn't an afterthought. <br/>It's our foundation.</h2>
                <p className="text-xl text-slate-400 leading-relaxed">
                  We believe your conversations belong to you. Whisper is built from the ground up with a privacy-first architecture that ensures your sensitive data remains entirely secure.
                </p>
                <ul className="space-y-4">
                  {[
                    "End-to-End Encryption for all direct messages",
                    "No tracking, no ads, no selling your data",
                    "SOC2 Type II and GDPR compliant infrastructure",
                    "Granular data retention policies"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2Icon className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full max-w-lg lg:max-w-none">
                <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-8 flex items-center justify-center relative overflow-hidden backdrop-blur-xl shadow-2xl">
                  {/* Abstract representation of security */}
                  <div className="absolute inset-0 bg-[url('/bg.png')] bg-cover opacity-20 mix-blend-overlay" />
                  <div className="relative w-full max-w-sm">
                    <div className="w-full h-16 bg-white/5 rounded-xl border border-white/10 mb-4 animate-pulse flex items-center px-4 gap-4">
                       <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                       <div className="h-2 w-32 bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="w-full h-16 bg-emerald-500/10 rounded-xl border border-emerald-500/30 mb-4 flex items-center px-4 gap-4 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-[shimmer_2s_infinite]" />
                       <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
                       <div className="text-sm font-medium text-emerald-400">Connection Secured</div>
                    </div>
                    <div className="w-full h-16 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 gap-4">
                       <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                       <div className="h-2 w-24 bg-slate-700 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="py-32 relative text-center px-6">
            <div className="max-w-4xl mx-auto bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-[3rem] p-12 md:p-20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/bg.png')] bg-cover opacity-10 mix-blend-overlay" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-primary-500/20 blur-[100px]" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready to transform how your team communicates?</h2>
                <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
                  Join thousands of forward-thinking teams who have already made the switch to Whisper.
                </p>
                <Link to="/auth" className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] gap-2">
                  Get Started for Free
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <p className="mt-6 text-sm text-slate-400">No credit card required. Setup takes less than a minute.</p>
              </div>
            </div>
          </section>
        </main>

        {/* Detailed Footer */}
        <footer className="relative bg-black/80 border-t border-white/10 backdrop-blur-2xl pt-24 pb-12 overflow-hidden mt-20">
          {/* Footer Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/10 blur-[120px] rounded-[100%] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-20">
              {/* Brand & Newsletter */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg">
                    <img src="/logo.jpg" alt="Whisper Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Whisper</span>
                </div>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed pr-4">
                  The beautiful, high-performance communication platform designed for the modern remote workforce. Connect with absolute clarity.
                </p>
                <div className="space-y-4">
                  <h4 className="text-white text-sm font-semibold">Subscribe to our newsletter</h4>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                      />
                    </div>
                    <button className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/20">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Links Columns */}
              <div className="lg:col-start-4">
                <h4 className="text-white font-semibold mb-6 tracking-wide">Product</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Features</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Integrations</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Security</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Changelog <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-500/20 text-primary-400">New</span></a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Pricing</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-6 tracking-wide">Company</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">About Us</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Careers</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Blog</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Contact Sales</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Partners</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-6 tracking-wide">Legal</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Cookie Policy</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Acceptable Use</a></li>
                  <li><a href="#" className="hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-300">Compliance</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <p className="text-slate-500 text-sm">
                  &copy; {new Date().getFullYear()} Whisper Inc. All rights reserved.
                </p>
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  All systems operational
                </div>
              </div>
              
              {/* Social Icons */}
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary-500 hover:border-primary-500 transition-all duration-300 group">
                  <TwitterIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all duration-300 group">
                  <LinkedinIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-all duration-300 group">
                  <GithubIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, glowColor }) {
  return (
    <div className={`group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-start hover:bg-white/10 transition-all duration-300 ${glowColor}`}>
      <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
