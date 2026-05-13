import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  MessageSquare,
  FileCheck,
  FolderOpen,
  Upload,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Rocket,
  Clock,
  FileSignature,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "duo-tutorial-seen-v1";

interface Step {
  id: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  title: string;
  subtitle: string;
  body: string;
  bullets: { icon: React.ElementType; color: string; text: string }[];
  tip?: string;
}

const steps: Step[] = [
  {
    id: 0,
    icon: Rocket,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    label: "Welcome",
    title: "Welcome to your DUO Client Portal",
    subtitle: "Your project, fully transparent — in one place.",
    body: "This portal is where everything happens between you and Luke. Quotes, documents, messages, file uploads — it's all here. You don't need to chase emails or wonder what's next. This 2-minute walkthrough will show you exactly how everything works.",
    bullets: [
      { icon: Clock, color: "text-blue-400", text: "Takes about 2 minutes to read through" },
      { icon: CheckCircle2, color: "text-green-400", text: "You'll know exactly what to do at every stage" },
      { icon: Sparkles, color: "text-yellow-400", text: "This guide won't show again — but you can reopen it anytime" },
    ],
  },
  {
    id: 1,
    icon: LayoutDashboard,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    label: "Dashboard",
    title: "Your Dashboard — start here every time",
    subtitle: "Everything you need to know at a glance.",
    body: "The Dashboard is the first thing you see when you log in. It shows where your project stands right now, what phase you're in, and most importantly — your 'Next Step' card. That card tells you exactly what action is needed from you. If there's something that needs your attention, it'll be right there waiting.",
    bullets: [
      { icon: ArrowRight, color: "text-blue-400", text: "The 'Next Step' card is your most important guide — check it first" },
      { icon: CheckCircle2, color: "text-green-400", text: "The progress timeline shows all 7 phases from onboarding to launch" },
      { icon: AlertCircle, color: "text-yellow-400", text: "Any pending payments or documents that need signing show up here automatically" },
      { icon: Clock, color: "text-muted-foreground", text: "The dashboard refreshes every 10 seconds — no need to manually reload" },
    ],
    tip: "Your project moves through 7 phases: Onboarding → Questionnaire → Agreement → Design → Development → Review → Complete. The dashboard always shows which phase you're in.",
  },
  {
    id: 2,
    icon: MessageSquare,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
    label: "Messages",
    title: "Messages — your direct line to Luke",
    subtitle: "Ask anything, anytime.",
    body: "The Messages section is a private chat between you and Luke. Use it for questions, concerns, updates, or anything on your mind about the project. Luke typically responds within a few hours during business hours. The more detail you give, the faster things move — include links, references, or examples whenever you can.",
    bullets: [
      { icon: CheckCircle2, color: "text-green-400", text: "Best for: questions, general feedback, concerns, updates" },
      { icon: AlertCircle, color: "text-yellow-400", text: "For website revision requests during review: use the Dashboard's review panel instead" },
      { icon: Sparkles, color: "text-indigo-400", text: "You'll see a badge on the Messages icon when Luke sends you something new" },
      { icon: Clock, color: "text-muted-foreground", text: "Response time: usually within a few hours, Monday–Friday" },
    ],
    tip: "Be specific! Instead of 'I don't like the header', try 'Can we make the header text larger and the background a darker shade of blue?'",
  },
  {
    id: 3,
    icon: FileCheck,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    label: "Quotes",
    title: "Quotes — approve your project scope",
    subtitle: "Review pricing and scope before anything begins.",
    body: "Before any work starts, Luke sends you a formal quote outlining exactly what's included, the price, and the timeline. You'll review every line item and either approve it or ask questions. Once you approve, the project officially moves forward. If anything looks off, message Luke before approving — changes to scope after approval may affect pricing.",
    bullets: [
      { icon: FileCheck, color: "text-emerald-400", text: "The quote includes line items, total price, and project scope" },
      { icon: AlertCircle, color: "text-yellow-400", text: "Read everything carefully before hitting Approve — it's a commitment" },
      { icon: MessageSquare, color: "text-indigo-400", text: "Questions about the quote? Message Luke before approving" },
      { icon: CheckCircle2, color: "text-green-400", text: "Approving a quote unlocks the next phase of your project" },
    ],
    tip: "You'll get a notification (and badge on the Quotes icon) the moment a new quote is ready for you.",
  },
  {
    id: 4,
    icon: FolderOpen,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    label: "Documents",
    title: "Documents — contracts and files to sign",
    subtitle: "Everything official lives here.",
    body: "The Documents section holds all the important paperwork for your project — the Terms of Service, contracts, design mockups, and anything else Luke sends you. Some documents require your signature. You sign directly in the portal by typing your name — it's legally binding. After signing, you can download a PDF copy for your records.",
    bullets: [
      { icon: FileSignature, color: "text-orange-400", text: "Documents with a 'Needs Signature' badge must be signed to continue" },
      { icon: CheckCircle2, color: "text-green-400", text: "Sign by typing your full name in the signature field — done in seconds" },
      { icon: FolderOpen, color: "text-orange-400", text: "Download signed copies anytime for your own records" },
      { icon: Clock, color: "text-muted-foreground", text: "New documents will appear here as your project progresses through each phase" },
    ],
    tip: "Your Dashboard's 'Next Step' card will alert you when a document needs signing — you won't miss it.",
  },
  {
    id: 5,
    icon: Upload,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
    label: "Uploads",
    title: "Uploads — send us what we need",
    subtitle: "Logos, photos, content — all in one place.",
    body: "During your project, Luke will need files from you: your logo, brand colors, photos, copy (written content), or anything specific to your business. The Uploads section is where you drop those files. You can categorize them and add descriptions so nothing gets mixed up. The sooner you upload what's needed, the faster your project moves forward.",
    bullets: [
      { icon: Upload, color: "text-purple-400", text: "Accepted files: images (PNG, JPG, SVG), PDFs, Word docs, ZIP archives" },
      { icon: CheckCircle2, color: "text-green-400", text: "Categorize uploads (Logo/Branding, Images, Content, etc.) to stay organized" },
      { icon: AlertCircle, color: "text-yellow-400", text: "Missing files are the #1 reason projects get delayed — upload early" },
      { icon: Sparkles, color: "text-purple-400", text: "Add a description to each file so Luke knows exactly what it is and where to use it" },
    ],
    tip: "Not sure what files to upload yet? Just message Luke — he'll tell you exactly what's needed and when.",
  },
  {
    id: 6,
    icon: Sparkles,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
    label: "You're set!",
    title: "You're all set — let's build something great",
    subtitle: "Luke is with you every step of the way.",
    body: "That's everything you need to know to navigate your portal confidently. Your only job right now is to check your Dashboard for the next step and respond promptly when Luke needs something from you. The faster you respond, the faster your project moves. If you're ever confused about anything, just send a message.",
    bullets: [
      { icon: LayoutDashboard, color: "text-blue-400", text: "Start on your Dashboard — your 'Next Step' card tells you what to do right now" },
      { icon: MessageSquare, color: "text-indigo-400", text: "Questions anytime → Messages" },
      { icon: AlertCircle, color: "text-yellow-400", text: "Watch for badges on nav icons — they mean something needs your attention" },
      { icon: Rocket, color: "text-green-400", text: "You can re-open this guide anytime from your Dashboard" },
    ],
  },
];

interface TutorialModalProps {
  userId: string;
  onClose?: () => void;
}

export function TutorialModal({ userId, onClose }: TutorialModalProps) {
  const storageKey = `${STORAGE_KEY}-${userId}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) setOpen(true);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
    onClose?.();
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(145deg, hsl(222 47% 10%) 0%, hsl(222 47% 8%) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, hsl(217 91% 60%), hsl(262 83% 65%))" }} />

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 pt-5 pb-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? "20px" : "6px",
                    height: "6px",
                    backgroundColor: i === step ? "hsl(217 91% 60%)" : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className="px-8 pt-6 pb-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                {/* Icon + label */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-11 h-11 rounded-xl ${current.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${current.iconColor}`} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {isFirst ? "Getting Started" : isLast ? "All Done" : `Step ${step} of ${steps.length - 2}`}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground mb-1 leading-snug">
                  {current.title}
                </h2>
                <p className="text-sm text-primary mb-4">{current.subtitle}</p>

                {/* Body */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {current.body}
                </p>

                {/* Bullets */}
                <ul className="space-y-2.5 mb-5">
                  {current.bullets.map((b, i) => {
                    const BIcon = b.icon;
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <BIcon className={`w-4 h-4 mt-0.5 shrink-0 ${b.color}`} />
                        <span className="text-sm text-muted-foreground leading-snug">{b.text}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* Tip */}
                {current.tip && (
                  <div
                    className="rounded-lg px-4 py-3 text-sm text-muted-foreground leading-relaxed"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="font-medium text-foreground">Tip: </span>{current.tip}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-8 py-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={isFirst}
                className="gap-1.5 text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <button
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                Skip guide
              </button>

              <Button size="sm" onClick={next} className="gap-1.5">
                {isLast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    {isFirst ? "Let's go" : "Next"}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for manually reopening the tutorial
export function useReopenTutorial(userId: string) {
  const storageKey = `${STORAGE_KEY}-${userId}`;
  return () => {
    localStorage.removeItem(storageKey);
    window.location.reload();
  };
}
