import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Library,
  Search,
  Upload,
  School,
  Building2,
  ShieldCheck,
  Sparkles,
  Lock,
  FileUp,
  BookOpen,
  GraduationCap,
  Info,
  ChevronRight,
  Plus,
  ArrowRight,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/spoude-library")({
  head: () => ({ meta: [{ title: "Spoude Library — Discover & Share" }] }),
  component: SpoudeLibrary,
});

function SpoudeLibrary() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-12 animate-fade-up max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <header className="relative overflow-hidden rounded-[40px] bg-primary px-8 py-16 text-primary-foreground shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-96 w-96 rounded-full bg-white/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-96 w-96 rounded-full bg-primary-soft/20 blur-[100px]" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} /> Global Knowledge Base
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Spoude Library
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed max-w-xl">
            Explore thousands of student-shared notes, past exams, and academic resources. Knowledge
            is better when shared.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <div className="relative w-full max-w-md group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/50 group-focus-within:text-white transition-colors"
                strokeWidth={1.5}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, subjects, unis..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md transition-all"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white text-primary hover:bg-white/90 shadow-xl font-bold transition-all active:scale-[0.98]">
                  <Upload className="mr-2 h-5 w-5" strokeWidth={2} /> Upload to Library
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[32px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Share with the world</DialogTitle>
                  <DialogDescription className="text-base pt-2">
                    Upload your materials to the global bookshelf. All uploads are verified by AI
                    for quality.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="p-8 rounded-[24px] border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/40 transition-all">
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileUp className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold">Drop your PDF here</p>
                    <p className="text-xs text-muted-foreground mt-1">Maximum file size: 50MB</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-sidebar-accent/50 border border-border">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <div className="text-xs">
                        <span className="font-semibold block">AI Content Verification</span>
                        <span className="text-muted-foreground">
                          We ensure your content is academic and high quality.
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-12 rounded-xl text-base font-bold">
                    Start Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Sections */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Feed */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" strokeWidth={1.5} /> Global Bookshelf
              </h2>
              <div className="flex gap-2">
                {["Recent", "Popular", "Notes"].map((t) => (
                  <button
                    key={t}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-secondary hover:bg-primary-soft transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="group p-5 rounded-3xl border border-border bg-card hover:shadow-2xl hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3">
                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base truncate">Intro to Quantum Physics</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        Massachusetts Institute of Technology
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                          VERIFIED
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                          12.4k Views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full py-8 text-primary font-bold hover:bg-primary/5 rounded-3xl"
            >
              Load more from global shelf
            </Button>
          </section>

          {/* AI Verification Promo */}
          <section className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-500 to-primary text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <Sparkles className="h-24 w-24 text-white/10" />
            </div>
            <div className="relative z-10 max-w-lg space-y-4">
              <h3 className="text-2xl font-bold">Advanced AI Verification</h3>
              <p className="text-white/80">
                Every document uploaded to Spoude Library passes through our proprietary neural
                network to verify academic integrity, formatting, and content value.
              </p>
              <div className="pt-2 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-primary bg-white/20 backdrop-blur-sm"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">Joined by 20,000+ students</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          {/* Institution Portal */}
          <section className="p-6 rounded-[32px] border border-border bg-card space-y-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <School className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Institutions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Universities and Schools can create official accounts to share curated materials
                with their students.
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full h-12 rounded-xl font-bold">
                  Register your Institution
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-[32px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Institution Portal</DialogTitle>
                  <DialogDescription className="pt-2">
                    Use your business email to set up your school's smart dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Institution Name
                    </label>
                    <Input placeholder="e.g. Oxford University" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Business Email
                    </label>
                    <Input type="email" placeholder="admin@ox.ac.uk" className="h-12 rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 text-xs">
                    <Info className="h-4 w-4 text-primary shrink-0" />
                    <span>Verification takes 24-48 hours after submission.</span>
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold mt-2">
                    Submit Application
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>Features</span>
              </div>
              <ul className="mt-4 space-y-3">
                <FeatureItem icon={Users} label="Student Management" />
                <FeatureItem icon={ShieldCheck} label="Private Library" />
                <FeatureItem icon={FileUp} label="Bulk CSV Upload" />
              </ul>
            </div>
          </section>

          {/* Sell Books - Coming Soon */}
          <section className="p-6 rounded-[32px] border border-border bg-card relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Plus className="h-5 w-5" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 uppercase tracking-widest">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-lg font-bold">Sell Your Materials</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Turn your hard work into earnings. Soon you'll be able to set prices for your
                premium notes.
              </p>
              <Button variant="outline" disabled className="w-full rounded-xl border-border">
                Get Notified
              </Button>
            </div>
          </section>

          {/* Student Verification - Under Development */}
          <section className="p-6 rounded-[32px] border border-border bg-card space-y-4">
            <h3 className="text-lg font-bold">Student Verification</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Institutions can verify their students via Matric number upload for private access.
            </p>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-not-allowed">
                    <Button
                      variant="secondary"
                      className="w-full rounded-xl opacity-50 pointer-events-none flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" /> Upload Student CSV
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Under Development — Coming in V2</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </section>
        </div>
      </div>

      {/* Legal Section */}
      <footer className="pt-12 border-t border-border">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Library Legal & Terms
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By uploading to the Spoude Library, you agree to our Content Guidelines. You must own
              the copyright to all shared materials. Spoude does not tolerate plagiarism or copyright
              infringement.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/privacy" className="text-xs font-bold text-primary hover:underline">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs font-bold text-primary hover:underline">
                Terms of Service
              </Link>
              <Link to="/disclaimer" className="text-xs font-bold text-primary hover:underline">
                Copyright Info
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Need Help?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Have questions about how to share or sell your materials? Our support team is here to
              help you navigate the global library.
            </p>
            <Button variant="outline" className="rounded-xl px-6">
              Contact Support
            </Button>
          </div>
        </div>
        <div className="mt-12 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Spoude. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm font-medium">
      <div className="h-2 w-2 rounded-full bg-primary/40" />
      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      {label}
    </li>
  );
}
