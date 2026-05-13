import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, Send, CheckCircle, X, ChevronLeft, ChevronRight, Layout, Eye } from "lucide-react";
import { useForm, ValidationError } from "@formspree/react";
import { PortalLayout } from "@/components/portal/portal-layout";

const LAYOUTS = [
  {
    id: "sidebar",
    label: "Sidebar Classic",
    desc: "Left rail + cards. The brand-default baseline direction.",
    color: "#B24C40",
    emoji: "1",
  },
  {
    id: "commandbar",
    label: "Command Bar",
    desc: "Top nav, dense lists, and a ⌘K quick-action palette feel.",
    color: "#D4A020",
    emoji: "2",
  },
  {
    id: "focus",
    label: "Focus Mode",
    desc: "Sparse, editorial, one-thing-at-a-time. Clean and calm.",
    color: "#6B8FB0",
    emoji: "3",
  },
  {
    id: "dock",
    label: "Studio Dock",
    desc: "Icon dock + filmstrip rhythm. Cinematic agency energy.",
    color: "#5EA67A",
    emoji: "4",
  },
  {
    id: "split",
    label: "Split Workspace",
    desc: "Master/detail, list-heavy, Linear-style power layout.",
    color: "#A78BFA",
    emoji: "5",
  },
];

export default function BetaReview() {
  // null = grid view; string = open that layout in fullscreen iframe
  const [openLayout, setOpenLayout] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedFav, setSelectedFav] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, handleFormSubmit] = useForm("mwvywyjw");

  const activeLayout = LAYOUTS.find(l => l.id === openLayout) ?? LAYOUTS[0];
  const activeIdx = LAYOUTS.findIndex(l => l.id === openLayout);

  // Sync layout with iframe via postMessage
  useEffect(() => {
    if (!openLayout) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const send = () => {
      iframe.contentWindow?.postMessage({ type: "SET_LAYOUT", layout: openLayout }, "*");
    };
    iframe.addEventListener("load", send);
    send();
    return () => iframe.removeEventListener("load", send);
  }, [openLayout]);

  const prev = () => {
    if (activeIdx <= 0) return;
    setOpenLayout(LAYOUTS[activeIdx - 1].id);
  };
  const next = () => {
    if (activeIdx >= LAYOUTS.length - 1) return;
    setOpenLayout(LAYOUTS[activeIdx + 1].id);
  };

  return (
    <PortalLayout>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Portal Design Review</h1>
            <p className="text-muted-foreground text-sm mt-1">
              5 layout directions built for Awaken Creative. Click any card to explore it live, then share your feedback.
            </p>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
            style={{
              background: "rgba(178,76,64,0.15)",
              border: "1px solid rgba(178,76,64,0.35)",
              color: "#C46557",
            }}
          >
            <Send size={13} />
            Share Feedback
          </button>
        </div>
      </div>

      {/* Layout cards grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      >
        {LAYOUTS.map((layout, i) => (
          <motion.div
            key={layout.id}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setOpenLayout(layout.id)}
              className="w-full text-left rounded-xl overflow-hidden group"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                transition: "border-color 200ms, box-shadow 200ms",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = layout.color + "60";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${layout.color}30, 0 8px 32px ${layout.color}15`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Preview thumbnail area */}
              <div
                className="relative w-full"
                style={{
                  aspectRatio: "16/9",
                  background: `linear-gradient(135deg, ${layout.color}18 0%, ${layout.color}08 100%)`,
                  borderBottom: "1px solid hsl(var(--border))",
                }}
              >
                {/* Abstract layout preview lines */}
                <div className="absolute inset-0 p-4 flex gap-3">
                  {layout.id === "sidebar" && (
                    <>
                      <div className="w-12 h-full rounded" style={{ background: `${layout.color}25` }} />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-3 w-3/4 rounded" style={{ background: `${layout.color}20` }} />
                        <div className="flex gap-2 flex-1">
                          <div className="flex-1 rounded" style={{ background: `${layout.color}15` }} />
                          <div className="flex-1 rounded" style={{ background: `${layout.color}10` }} />
                        </div>
                      </div>
                    </>
                  )}
                  {layout.id === "commandbar" && (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 w-full rounded" style={{ background: `${layout.color}25` }} />
                      <div className="flex gap-2 flex-1">
                        <div className="flex-1 flex flex-col gap-1">
                          {[1,2,3,4].map(n => <div key={n} className="h-2 rounded" style={{ background: `${layout.color}${n * 5 + 10}` }} />)}
                        </div>
                        <div className="w-2/3 rounded" style={{ background: `${layout.color}15` }} />
                      </div>
                    </div>
                  )}
                  {layout.id === "focus" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <div className="h-2 w-1/2 rounded" style={{ background: `${layout.color}30` }} />
                      <div className="h-16 w-5/6 rounded" style={{ background: `${layout.color}15` }} />
                      <div className="h-2 w-1/3 rounded" style={{ background: `${layout.color}20` }} />
                    </div>
                  )}
                  {layout.id === "dock" && (
                    <>
                      <div className="flex flex-col gap-1 justify-center">
                        {[1,2,3,4,5].map(n => <div key={n} className="w-6 h-6 rounded-lg" style={{ background: `${layout.color}${n % 2 === 0 ? 30 : 18}` }} />)}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-2 w-2/3 rounded" style={{ background: `${layout.color}20` }} />
                        <div className="flex-1 flex gap-1">
                          {[1,2,3].map(n => <div key={n} className="flex-1 rounded" style={{ background: `${layout.color}${n * 6 + 8}` }} />)}
                        </div>
                      </div>
                    </>
                  )}
                  {layout.id === "split" && (
                    <div className="flex-1 flex gap-3">
                      <div className="w-2/5 flex flex-col gap-1">
                        {[1,2,3,4,5].map(n => <div key={n} className="flex-1 rounded" style={{ background: `${layout.color}${n === 2 ? 30 : 14}` }} />)}
                      </div>
                      <div className="w-3/5 rounded" style={{ background: `${layout.color}15` }} />
                    </div>
                  )}
                </div>

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: `${layout.color}18`, backdropFilter: "blur(2px)" }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: layout.color, color: "#fff" }}
                  >
                    <Eye size={14} />
                    Preview
                  </div>
                </div>

                {/* Number badge */}
                <div
                  className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: layout.color, color: "#fff" }}
                >
                  {i + 1}
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">{layout.label}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: layout.color, boxShadow: `0 0 6px ${layout.color}` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{layout.desc}</p>
              </div>
            </button>
          </motion.div>
        ))}

        {/* Feedback card */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full h-full min-h-[180px] rounded-xl flex flex-col items-center justify-center gap-3 group"
            style={{
              background: "rgba(178,76,64,0.05)",
              border: "1px dashed rgba(178,76,64,0.3)",
              transition: "border-color 200ms, background 200ms",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(178,76,64,0.6)";
              (e.currentTarget as HTMLElement).style.background = "rgba(178,76,64,0.1)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(178,76,64,0.3)";
              (e.currentTarget as HTMLElement).style.background = "rgba(178,76,64,0.05)";
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(178,76,64,0.15)" }}
            >
              <Send size={16} style={{ color: "#C46557" }} />
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm" style={{ color: "#C46557" }}>Share Your Feedback</div>
              <div className="text-xs text-muted-foreground mt-0.5">Tell Luke what you think</div>
            </div>
          </button>
        </motion.div>
      </motion.div>

      {/* Fullscreen iframe overlay */}
      <AnimatePresence>
        {openLayout && (
          <motion.div
            key="iframe-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "#0a0a0a",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Slim top bar */}
            <div
              style={{
                height: 44,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                background: "#111",
                borderBottom: "0.5px solid rgba(239,220,198,0.1)",
                gap: 12,
              }}
            >
              {/* Left: layout name + dot nav */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: activeLayout.color,
                    boxShadow: `0 0 6px ${activeLayout.color}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: activeLayout.color, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em" }}>
                  {activeLayout.label.toUpperCase()}
                </span>
                <span style={{ color: "rgba(239,220,198,0.3)", fontSize: 11 }}>{activeLayout.desc}</span>
              </div>

              {/* Center: dot pagination */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={prev}
                  disabled={activeIdx <= 0}
                  style={{ background: "none", border: "none", color: "rgba(239,220,198,0.4)", cursor: activeIdx > 0 ? "pointer" : "default", padding: 4, opacity: activeIdx > 0 ? 1 : 0.3 }}
                >
                  <ChevronLeft size={14} />
                </button>
                <div style={{ display: "flex", gap: 5 }}>
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setOpenLayout(l.id)}
                      style={{
                        width: openLayout === l.id ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: openLayout === l.id ? l.color : "rgba(239,220,198,0.15)",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "all 200ms ease",
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={next}
                  disabled={activeIdx >= LAYOUTS.length - 1}
                  style={{ background: "none", border: "none", color: "rgba(239,220,198,0.4)", cursor: activeIdx < LAYOUTS.length - 1 ? "pointer" : "default", padding: 4, opacity: activeIdx < LAYOUTS.length - 1 ? 1 : 0.3 }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Right: actions */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setShowFeedback(true)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: "0.5px solid rgba(178,76,64,0.4)",
                    background: "rgba(178,76,64,0.12)",
                    color: "#C46557",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Send size={11} />
                  Feedback
                </button>
                <button
                  onClick={() => setOpenLayout(null)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "0.5px solid rgba(239,220,198,0.15)",
                    background: "transparent",
                    color: "rgba(239,220,198,0.6)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                >
                  <X size={12} />
                  Back to Grid
                </button>
              </div>
            </div>

            {/* iframe */}
            <iframe
              ref={iframeRef}
              src="/design-review/index.html"
              style={{ flex: 1, border: "none", display: "block", width: "100%" }}
              title="Design Review"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            key="feedback-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowFeedback(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(8px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 14,
                width: "100%",
                maxWidth: 520,
                overflow: "hidden",
                boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              }}
            >
              {/* Header */}
              <div style={{
                padding: "18px 24px",
                borderBottom: "1px solid hsl(var(--border))",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div className="font-bold text-sm text-foreground">Share Your Feedback</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Tell Luke what you think. No wrong answers.</div>
                </div>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 18, lineHeight: 1 }}
                >✕</button>
              </div>

              {/* Body */}
              <div style={{ padding: 24 }}>
                {state.succeeded ? (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <CheckCircle size={40} color="#5EA67A" style={{ margin: "0 auto 12px" }} />
                    <div className="font-semibold text-foreground" style={{ fontSize: 15, marginBottom: 6 }}>Feedback received!</div>
                    <div className="text-muted-foreground text-sm">Luke will review it shortly. Thanks, Caleb!</div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <input type="hidden" name="_subject" value="Beta Feedback — Duo Portal Design Review" />

                    {/* Favourite layout */}
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }} className="text-muted-foreground mb-2 block">
                        Favourite layout
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {LAYOUTS.map(l => (
                          <label key={l.id} style={{ cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="favourite_layout"
                              value={l.label}
                              checked={selectedFav === l.id}
                              onChange={() => setSelectedFav(l.id)}
                              style={{ display: "none" }}
                            />
                            <span style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: `1px solid ${selectedFav === l.id ? l.color : "hsl(var(--border))"}`,
                              background: selectedFav === l.id ? `${l.color}18` : "transparent",
                              color: selectedFav === l.id ? l.color : "hsl(var(--muted-foreground))",
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              transition: "all 120ms ease",
                              userSelect: "none",
                            }}>
                              {l.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      <ValidationError field="favourite_layout" errors={state.errors} />
                    </div>

                    {/* What stood out */}
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }} className="text-muted-foreground mb-1.5 block">
                        What stood out?
                      </label>
                      <textarea
                        name="what_stood_out"
                        rows={3}
                        placeholder="Anything you liked, disliked, or want changed..."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                          fontFamily: "inherit",
                          fontSize: 13,
                          outline: "none",
                          resize: "vertical",
                          minHeight: 80,
                          boxSizing: "border-box",
                        }}
                      />
                      <ValidationError field="what_stood_out" errors={state.errors} />
                    </div>

                    {/* Overall feel */}
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }} className="text-muted-foreground mb-1.5 block">
                        Overall feel for Awaken Creative?
                      </label>
                      <select
                        name="overall_feel"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                          fontFamily: "inherit",
                          fontSize: 13,
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">Select one...</option>
                        <option value="This is exactly it">This is exactly it</option>
                        <option value="Close, needs tweaks">Close, needs tweaks</option>
                        <option value="Interesting but not quite">Interesting but not quite</option>
                        <option value="Not the right direction">Not the right direction</option>
                      </select>
                    </div>

                    {/* Name */}
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }} className="text-muted-foreground mb-1.5 block">
                        Your name
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                          fontFamily: "inherit",
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={state.submitting}
                      style={{
                        padding: "11px 20px",
                        borderRadius: 8,
                        background: "#B24C40",
                        border: "none",
                        color: "#fff",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: state.submitting ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        opacity: state.submitting ? 0.6 : 1,
                        letterSpacing: "0.02em",
                      }}
                    >
                      <Send size={13} />
                      {state.submitting ? "Sending..." : "Send Feedback to Luke"}
                    </button>
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
