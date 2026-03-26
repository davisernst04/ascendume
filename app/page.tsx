import { ArrowRight, Sparkles, FileText, Zap, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">ascendume</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-text-secondary hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-text-secondary hover:text-primary transition-colors">Pricing</a>
            <button className="px-4 py-2 text-sm text-text-secondary hover:text-primary transition-colors">
              Sign In
            </button>
            <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-8 bg-gradient-to-b from-background to-background-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light text-primary rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Resume Builder
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Build Your Perfect Resume in{" "}
            <span className="text-primary">Minutes</span>
          </h1>
          
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Ascendume uses advanced AI to craft professional, ATS-optimized resumes that get you noticed by recruiters and land more interviews.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
              Build My Resume
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-background-secondary text-text-primary rounded-lg text-lg font-semibold border border-border hover:bg-background-tertiary transition-colors flex items-center justify-center gap-2">
              View Examples
            </button>
          </div>
          
          <p className="text-sm text-text-muted mt-6">
            No credit card required · Free plan available
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Ascendume?</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Our AI-powered platform helps you create resumes that stand out from the competition.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Writing</h3>
              <p className="text-text-secondary">
                Our AI analyzes your experience and crafts compelling bullet points that highlight your achievements.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">ATS Optimization</h3>
              <p className="text-text-secondary">
                Every resume is optimized for Applicant Tracking Systems, ensuring your application gets seen by humans.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Templates</h3>
              <p className="text-text-secondary">
                Choose from professionally designed templates that are proven to catch recruiters attention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Create your professional resume in three simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Input Your Info</h3>
              <p className="text-text-secondary">
                Enter your work history, education, and skills. Our AI will handle the rest.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">AI Enhancement</h3>
              <p className="text-text-secondary">
                Our AI rewrites your bullet points to highlight achievements and use action verbs.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Download & Apply</h3>
              <p className="text-text-secondary">
                Export your resume as PDF and start applying to your dream jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Job Seekers</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              See what our users are saying about Ascendume.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="p-8 rounded-xl border border-border bg-card">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle key={i} className="w-5 h-5 text-success fill-success/20" />
                ))}
              </div>
              <p className="text-lg mb-6 italic">
                "I landed 3 interviews in my first week using Ascendume. The AI suggestions made my experience sound way more impressive."
              </p>
              <div>
                <p className="font-bold">Sarah Chen</p>
                <p className="text-text-secondary text-sm">Software Engineer at Tech Corp</p>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="p-8 rounded-xl border border-border bg-card">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle key={i} className="w-5 h-5 text-success fill-success/20" />
                ))}
              </div>
              <p className="text-lg mb-6 italic">
                "The ATS optimization actually works. I was getting no responses before, now I'm getting calls every week."
              </p>
              <div>
                <p className="font-bold">Marcus Johnson</p>
                <p className="text-text-secondary text-sm">Product Manager at StartupXYZ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-primary-foreground">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands of job seekers who have transformed their careers with Ascendume.
          </p>
          <button className="px-8 py-4 bg-background text-text-primary rounded-lg text-lg font-semibold hover:bg-background-secondary transition-colors shadow-lg flex items-center justify-center gap-2 mx-auto">
            Start Building for Free
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm mt-6 text-primary-foreground/75">
            Free plan includes 1 resume · No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-background-secondary border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold">ascendume</span>
            </div>
            <div className="flex gap-8 text-sm text-text-secondary">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
            <p className="text-sm text-text-muted">
              © 2026 Ascendume. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
