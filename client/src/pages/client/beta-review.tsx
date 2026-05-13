import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, X, ChevronLeft, ChevronRight, Eye, Sparkles } from "lucide-react";
import { useForm, ValidationError } from "@formspree/react";
import { PortalLayout } from "@/components/portal/portal-layout";

const LAYOUTS = [
  {
    id: "sidebar",
    label: "Sidebar Classic",
    tag: "Brand Default",
    desc: "The familiar left-rail layout. Clean cards, easy navigation, built for daily use.",
    color: "#B24C40",
  },
  {
    id: "commandbar",
    label: "Command Bar",
    tag: "Power User",
    desc: "Top nav with a ⌘K palette. Dense, fast, built for people who live in their tools.",
    color: "#D4A020",
  },
  {
    id: "focus",
    label: "Focus Mode",
    tag: "Editorial",
    desc: "One thing at a time. Minimal chrome, maximum clarity. Great for content-heavy flows.",
    color: "#6B8FB0",
  },
  {
    id: "dock",
    label: "Studio Dock",
    tag: "Creative",
    desc: "Icon dock + filmstrip rhythm. Feels like a creative suite, not a dashboard.",
    color: "#5EA67A",
  },
  {
    id: "split",
    label: "Split Workspace",
    tag: "Power Layout",
    desc: "Master/detail side-by-side. List-heavy, fast scanning, Linear-style efficiency.",
    color: "#A78BFA",
  },
];

// Abstract wireframe preview per layout
function LayoutPreview({ id, color }: { id: string; color: string }) {
  const c = color;
  if (id === "sidebar") return (
    <div className="absolute inset-0 p-5 flex gap-3">
      <div className="flex flex-col gap-2 w-10 shrink-0">
        <div className="h-6 w-6 rounded-md self-center mb-1" style={{ background: `${c}40` }} />
        {[1,2,3,4,5].map(n => <div key={n} className="h-2 rounded-sm" style={{ background: `${c}${n===2?'45':'25'}` }} />)}
      </div>
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="h-2 w-2/3 rounded-sm" style={{ background: `${c}35` }} />
        <div className="flex gap-2 flex-1">
          <div className="flex-1 rounded-lg" style={{ background: `${c}20` }} />
          <div className="flex-1 rounded-lg" style={{ background: `${c}15` }} />
        </div>
        <div className="flex gap-2 h-6">
          <div className="flex-1 rounded-md" style={{ background: `${c}18` }} />
          <div className="flex-1 rounded-md" style={{ background: `${c}12` }} />
          <div className="flex-1 rounded-md" style={{ background: `${c}18` }} />
        </div>
      </div>
    </div>
  );
  if (id === "commandbar") return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2">
      <div className="h-5 w-full rounded-md flex items-center px-2 gap-2" style={{ background: `${c}30` }}>
        <div className="h-1.5 w-16 rounded-sm" style={{ background: `${c}50` }} />
        <div className="ml-auto h-1.5 w-8 rounded-sm" style={{ background: `${c}35` }} />
        <div className="h-1.5 w-8 rounded-sm" style={{ background: `${c}35` }} />
      </div>
      <div className="flex gap-2 flex-1">
        <div className="w-28 flex flex-col gap-1">
          {[1,2,3,4,5,6].map(n => <div key={n} className="h-3 rounded-sm" style={{ background: `${c}${n===2?'35':'18'}` }} />)}
        </div>
        <div className="flex-1 rounded-lg" style={{ background: `${c}15` }} />
      </div>
    </div>
  );
  if (id === "focus") return (
    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-3">
      <div className="h-1.5 w-16 rounded-sm" style={{ background: `${c}35` }} />
      <div className="h-1.5 w-24 rounded-sm" style={{ background: `${c}25` }} />
      <div className="w-full rounded-xl flex-1 max-h-16" style={{ background: `${c}18` }} />
      <div className="flex gap-2 w-full">
        <div className="flex-1 h-6 rounded-lg" style={{ background: `${c}20` }} />
        <div className="flex-1 h-6 rounded-lg" style={{ background: `${c}12` }} />
      </div>
    </div>
  );
  if (id === "dock") return (
    <div className="absolute inset-0 p-5 flex gap-3">
      <div className="flex flex-col gap-2 items-center justify-center w-7 shrink-0">
        {[1,2,3,4,5].map(n => <div key={n} className="w-5 h-5 rounded-lg" style={{ background: `${c}${n===2?'50':n===3?'35':'22'}` }} />)}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-2 w-1/2 rounded-sm" style={{ background: `${c}30` }} />
        <div className="flex gap-2 flex-1">
          {[1,2,3].map(n => <div key={n} className="flex-1 rounded-lg" style={{ background: `${c}${n===1?'25':'18'}` }} />)}
        </div>
      </div>
    </div>
  );
  if (id === "split") return (
    <div className="absolute inset-0 p-5 flex gap-3">
      <div className="w-2/5 flex flex-col gap-1.5">
        {[1,2,3,4,5].map(n => (
          <div key={n} className="h-7 rounded-md flex items-center px-2 gap-1.5" style={{ background: `${c}${n===1?'35':'18'}` }}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: `${c}${n===1?'60':'35'}` }} />
            <div className="flex-1 h-1.5 rounded-sm" style={{ background: `${c}${n===1?'50':'25'}` }} />
          </div>
        ))}
      </div>
      <div className="w-3/5 rounded-xl" style={{ background: `${c}20` }} />
    </div>
  );
  return null;
}

export default function BetaReview() {
  const [openLayout, setOpenLayout] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedFav, setSelectedFav] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, handleFormSubmit] = useForm("mwvywyjw");

  const activeLayout = LAYOUTS.find(l => l.id === openLayout) ?? LAYOUTS[0];
  const activeIdx = LAYOUTS.findIndex(l => l.id === openLayout);

  useEffect(() => {
    if (!openLayout) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const send = () => iframe.contentWindow?.postMessage({ type: "SET_LAYOUT", layout: openLayout }, "*");
    iframe.addEventListener("load", send);
    send();
    return () => iframe.removeEventListener("load", send);
  }, [openLayout]);

  const prev = () => activeIdx > 0 && setOpenLayout(LAYOUTS[activeIdx - 1].id);
  const next = () => activeIdx < LAYOUTS.length - 1 && setOpenLayout(LAYOUTS[activeIdx + 1].id);

  return (
    <PortalLayout>
      {/* Hero section */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(178,76,64,0.12)", color: "#C46557", border: "1px solid rgba(178,76,64,0.2)" }}>
                Beta Preview
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
              Which direction feels like <em className="not-italic" style={{ color: "#C46557" }}>Awaken Creative?</em>
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
              Five complete portal directions, built just for you. Click any layout to explore it live — deliverable approvals, contracts, inbox, all of it works. Then let me know what you think.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFeedback(true)}
            className="shrink-0 hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#B24C40", color: "#fff" }}
          >
            <Send size={13} />
            Share Feedback
          </motion.button>
        </div>
      </div>

      {/* Layout cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {LAYOUTS.map((layout, i) => (
          <motion.div
            key={layout.id}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <motion.button
              onClick={() => setOpenLayout(layout.id)}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18 }}
              className="w-full text-left rounded-2xl overflow-hidden group"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              {/* Preview */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  aspectRatio: "16/9",
                  background: `linear-gradient(145deg, ${layout.color}12 0%, ${layout.color}06 100%)`,
                  borderBottom: "1px solid hsl(var(--border))",
                }}
              >
                <LayoutPreview id={layout.id} color={layout.color} />

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{ background: `${layout.color}22`, backdropFilter: "blur(3px)" }}
                >
                  <div
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
                    style={{ background: layout.color, color: "#fff" }}
                  >
                    <Eye size={14} />
                    Explore Live
                  </div>
                </div>

                {/* Number chip */}
                <div
                  className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                  style={{ background: layout.color, color: "#fff" }}
                >
                  {i + 1}
                </div>

                {/* Tag chip */}
                <div
                  className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: `${layout.color}22`, color: layout.color, border: `1px solid ${layout.color}30` }}
                >
                  {layout.tag}
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-sm text-foreground">{layout.label}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: layout.color, boxShadow: `0 0 5px ${layout.color}` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{layout.desc}</p>
              </div>
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="mt-8 rounded-2xl p-6 flex items-center justify-between gap-4"
        style={{ background: "rgba(178,76,64,0.06)", border: "1px solid rgba(178,76,64,0.15)" }}
      >
        <div>
          <div className="font-semibold text-sm text-foreground mb-0.5">Explored them all?</div>
          <div className="text-xs text-muted-foreground">Takes 2 minutes. Your feedback shapes what gets built.</div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowFeedback(true)}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#B24C40", color: "#fff" }}
        >
          <Sparkles size={13} />
          Share Your Thoughts
        </motion.button>
      </motion.div>

      {/* Fullscreen iframe overlay */}
      <AnimatePresence>
        {openLayout && (
          <motion.div
            key="iframe-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0a0a0a", display: "flex", flexDirection: "column" }}
          >
            {/* Top bar */}
            <div style={{ height: 46, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: "#111", borderBottom: "0.5px solid rgba(239,220,198,0.1)", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: activeLayout.color, boxShadow: `0 0 6px ${activeLayout.color}`, flexShrink: 0 }} />
                <span style={{ color: activeLayout.color, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em" }}>{activeLayout.label.toUpperCase()}</span>
                <span style={{ color: "rgba(239,220,198,0.35)", fontSize: 11 }}>{activeLayout.tag}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={prev} disabled={activeIdx <= 0} style={{ background: "none", border: "none", color: "rgba(239,220,198,0.4)", cursor: activeIdx > 0 ? "pointer" : "default", padding: 4, opacity: activeIdx > 0 ? 1 : 0.3 }}><ChevronLeft size={14} /></button>
                <div style={{ display: "flex", gap: 5 }}>
                  {LAYOUTS.map(l => (
                    <button key={l.id} onClick={() => setOpenLayout(l.id)} style={{ width: openLayout === l.id ? 18 : 6, height: 6, borderRadius: 3, background: openLayout === l.id ? l.color : "rgba(239,220,198,0.15)", border: "none", cursor: "pointer", padding: 0, transition: "all 200ms ease" }} />
                  ))}
                </div>
                <button onClick={next} disabled={activeIdx >= LAYOUTS.length - 1} style={{ background: "none", border: "none", color: "rgba(239,220,198,0.4)", cursor: activeIdx < LAYOUTS.length - 1 ? "pointer" : "default", padding: 4, opacity: activeIdx < LAYOUTS.length - 1 ? 1 : 0.3 }}><ChevronRight size={14} /></button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowFeedback(true)} style={{ padding: "5px 12px", borderRadius: 6, border: "0.5px solid rgba(178,76,64,0.4)", background: "rgba(178,76,64,0.12)", color: "#C46557", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                  <Send size={11} />Feedback
                </button>
                <button onClick={() => setOpenLayout(null)} style={{ padding: "5px 10px", borderRadius: 6, border: "0.5px solid rgba(239,220,198,0.15)", background: "transparent", color: "rgba(239,220,198,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                  <X size={12} />Back
                </button>
              </div>
            </div>
            <iframe ref={iframeRef} src="/design-review/index.html" style={{ flex: 1, border: "none", display: "block", width: "100%" }} title="Design Review" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback modal — conversational */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            key="feedback-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowFeedback(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 18, width: "100%", maxWidth: 540, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.4)" }}
            >
              {/* Header */}
              <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="text-base font-bold text-foreground mb-0.5">Hey, tell me what you think 👋</div>
                  <div className="text-xs text-muted-foreground">No wrong answers — this is your portal, not mine.</div>
                </div>
                <button onClick={() => setShowFeedback(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "hsl(var(--muted-foreground))", fontSize: 18, lineHeight: 1, marginTop: -2 }}>✕</button>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 26px" }}>
                {state.succeeded ? (
                  <div style={{ textAlign: "center", padding: "28px 0" }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                      <CheckCircle size={44} color="#5EA67A" style={{ margin: "0 auto 14px" }} />
                    </motion.div>
                    <div className="font-bold text-foreground" style={{ fontSize: 16, marginBottom: 6 }}>Got it, thanks Caleb!</div>
                    <div className="text-muted-foreground text-sm">I'll review it and follow up shortly.</div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <input type="hidden" name="_subject" value="Beta Feedback — Duo Portal Design Review" />

                    {/* Q1 */}
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-1">Which layout caught your eye?</div>
                      <div className="text-xs text-muted-foreground mb-3">Pick the one that felt most like Awaken Creative.</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {LAYOUTS.map(l => (
                          <label key={l.id} style={{ cursor: "pointer" }}>
                            <input type="radio" name="favourite_layout" value={l.label} checked={selectedFav === l.id} onChange={() => setSelectedFav(l.id)} style={{ display: "none" }} />
                            <motion.span
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.97 }}
                              style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "7px 13px",
                                borderRadius: 10,
                                border: `1px solid ${selectedFav === l.id ? l.color : "hsl(var(--border))"}`,
                                background: selectedFav === l.id ? `${l.color}18` : "transparent",
                                color: selectedFav === l.id ? l.color : "hsl(var(--muted-foreground))",
                                fontSize: 12, fontWeight: 600,
                                transition: "all 140ms ease",
                                userSelect: "none" as const,
                                cursor: "pointer",
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                              {l.label}
                            </motion.span>
                          </label>
                        ))}
                      </div>
                      <ValidationError field="favourite_layout" errors={state.errors} />
                    </div>

                    {/* Q2 */}
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-1">What stood out — good or bad?</div>
                      <div className="text-xs text-muted-foreground mb-2">Anything you noticed, liked, or wanted to change.</div>
                      <textarea
                        name="what_stood_out"
                        rows={3}
                        placeholder="e.g. I liked the sidebar feel but the command bar seemed too cluttered..."
                        style={{ width: "100%", padding: "10px 13px", borderRadius: 10, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", fontFamily: "inherit", fontSize: 13, outline: "none", resize: "vertical", minHeight: 84, boxSizing: "border-box" }}
                      />
                      <ValidationError field="what_stood_out" errors={state.errors} />
                    </div>

                    {/* Q3 */}
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-1">Overall — does one of these feel right for Awaken?</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8 }}>
                        {[
                          { value: "Yes, this is it", emoji: "🎯" },
                          { value: "Close, needs tweaks", emoji: "🔧" },
                          { value: "Interesting but not quite", emoji: "🤔" },
                          { value: "Not the right direction", emoji: "↩️" },
                        ].map(opt => (
                          <label key={opt.value} style={{ cursor: "pointer" }}>
                            <input type="radio" name="overall_feel" value={opt.value} style={{ display: "none" }} />
                            <div
                              className="text-xs font-medium rounded-xl p-3 flex items-center gap-2 transition-all duration-150"
                              style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", cursor: "pointer" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#B24C40"; (e.currentTarget as HTMLElement).style.background = "rgba(178,76,64,0.08)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))"; (e.currentTarget as HTMLElement).style.background = "hsl(var(--background))"; }}
                            >
                              <span>{opt.emoji}</span>
                              {opt.value}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Q4 */}
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-2">Your name</div>
                      <input type="text" name="name" placeholder="e.g. Caleb" style={{ width: "100%", padding: "10px 13px", borderRadius: 10, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={state.submitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ padding: "12px 20px", borderRadius: 12, background: "#B24C40", border: "none", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: state.submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: state.submitting ? 0.6 : 1, letterSpacing: "0.02em" }}
                    >
                      <Send size={13} />
                      {state.submitting ? "Sending..." : "Send it to Luke"}
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PortalLayout>
  );
}
