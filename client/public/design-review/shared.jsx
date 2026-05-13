// shared.jsx — shared screen components used across all layouts.
// Each layout decides where to MOUNT these (which nav slot, density, etc.)
// but the building blocks themselves are identical.

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────────────────
//   Tiny icon set (line, currentColor) — kept simple, no SVG portraiture.
// ─────────────────────────────────────────────────────────────────────────

const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const paths = {
    home:     'M3 11 L12 3 L21 11 V21 H14 V14 H10 V21 H3 Z',
    clients:  'M7 8 a3 3 0 1 1 0.01 0 M17 8 a3 3 0 1 1 0.01 0 M2 20 c0-3 2-5 5-5 s5 2 5 5 M12 20 c0-3 2-5 5-5 s5 2 5 5',
    folder:   'M3 6 H10 L12 8 H21 V19 H3 Z',
    file:     'M6 3 H14 L19 8 V21 H6 Z M14 3 V8 H19',
    inbox:    'M3 13 L7 13 L9 16 H15 L17 13 L21 13 M3 13 V19 H21 V13 M3 13 L6 5 H18 L21 13',
    bell:     'M6 16 V11 a6 6 0 0 1 12 0 V16 L20 18 H4 Z M10 21 H14',
    search:   'M11 11 m-7 0 a7 7 0 1 1 14 0 a7 7 0 1 1 -14 0 M17 17 L21 21',
    plus:     'M12 5 V19 M5 12 H19',
    minus:    'M5 12 H19',
    check:    'M5 12 L10 17 L20 6',
    x:        'M6 6 L18 18 M18 6 L6 18',
    chevR:    'M9 6 L15 12 L9 18',
    chevL:    'M15 6 L9 12 L15 18',
    chevD:    'M6 9 L12 15 L18 9',
    chevU:    'M6 15 L12 9 L18 15',
    arrowR:   'M5 12 H19 M13 6 L19 12 L13 18',
    arrowL:   'M19 12 H5 M11 6 L5 12 L11 18',
    upload:   'M12 16 V4 M6 10 L12 4 L18 10 M4 20 H20',
    download: 'M12 4 V16 M6 10 L12 16 L18 10 M4 20 H20',
    paperclip:'M21 11 L11 21 a5 5 0 0 1 -7 -7 L14 4 a3.5 3.5 0 0 1 5 5 L9 19 a2 2 0 0 1 -3 -3 L15 7',
    send:     'M3 12 L21 4 L13 21 L11 13 Z M11 13 L3 12',
    settings: 'M12 9 a3 3 0 1 0 0.01 0 M19 12 a7 7 0 0 0 -.2 -1.7 l2-1.6 -2-3.4 -2.3 .9 a7 7 0 0 0 -3 -1.7 L13 2 H11 L10.5 4.5 a7 7 0 0 0 -3 1.7 l-2.3 -.9 -2 3.4 2 1.6 a7 7 0 0 0 0 3.4 l-2 1.6 2 3.4 2.3 -.9 a7 7 0 0 0 3 1.7 L11 22 h2 l.5 -2.5 a7 7 0 0 0 3 -1.7 l2.3 .9 2 -3.4 -2 -1.6 a7 7 0 0 0 .2 -1.7',
    logout:   'M16 17 L21 12 L16 7 M21 12 H9 M12 21 H5 a2 2 0 0 1 -2 -2 V5 a2 2 0 0 1 2 -2 H12',
    clock:    'M12 6 V12 L16 14 M12 22 a10 10 0 1 1 0.01 0',
    flag:     'M5 21 V4 M5 4 H17 L15 9 L17 14 H5',
    calendar: 'M3 8 H21 M7 3 V6 M17 3 V6 M3 6 H21 V20 H3 Z',
    pen:      'M16 3 L21 8 L9 20 L3 21 L4 15 Z',
    eye:      'M2 12 s4 -7 10 -7 s10 7 10 7 s-4 7 -10 7 s-10 -7 -10 -7 Z M12 15 a3 3 0 1 1 0.01 0',
    grid:     'M3 3 H10 V10 H3 Z M14 3 H21 V10 H14 Z M3 14 H10 V21 H3 Z M14 14 H21 V21 H14 Z',
    list:     'M3 6 H21 M3 12 H21 M3 18 H21',
    layout:   'M3 3 H21 V21 H3 Z M3 9 H21 M9 9 V21',
    bar:      'M4 20 V12 M10 20 V4 M16 20 V8 M22 20 H2',
    target:   'M12 2 a10 10 0 1 1 0.01 0 M12 6 a6 6 0 1 1 0.01 0 M12 10 a2 2 0 1 1 0.01 0',
    spark:    'M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z',
    book:     'M4 4 H11 a3 3 0 0 1 3 3 V21 a2 2 0 0 0 -2 -2 H4 Z M20 4 H13 a3 3 0 0 0 -3 3 V21 a2 2 0 0 1 2 -2 H20 Z',
    sign:     'M3 17 L7 13 L11 17 L21 7 M14 14 V20 H20',
    money:    'M3 7 H21 V17 H3 Z M12 9 a3 3 0 1 1 0.01 0 M6 7 V17 M18 7 V17',
    chat:     'M21 12 a8 8 0 0 1 -11 7 L3 21 L5 16 a8 8 0 1 1 16 -4 Z',
    activity: 'M22 12 H18 L15 21 L9 3 L6 12 H2',
    filter:   'M3 5 H21 L14 13 V20 L10 18 V13 Z',
    sun:      'M12 2 V4 M12 20 V22 M4 12 H2 M22 12 H20 M5 5 L6.5 6.5 M17.5 17.5 L19 19 M5 19 L6.5 17.5 M17.5 6.5 L19 5 M12 7 a5 5 0 1 1 0.01 0',
    image:    'M3 4 H21 V20 H3 Z M3 16 L9 10 L14 15 L17 12 L21 16 M16 8 a1.5 1.5 0 1 1 0.01 0',
    video:    'M3 5 H15 V19 H3 Z M15 9 L21 6 V18 L15 15',
    archive:  'M3 4 H21 V8 H3 Z M5 8 V20 H19 V8 M9 12 H15',
    doc:      'M6 3 H14 L19 8 V21 H6 Z M14 3 V8 H19 M9 13 H16 M9 16 H14',
  };
  const d = paths[name] || paths.x;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, display: 'inline-block' }}>
      <path d={d} />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//   Status badges, progress, helpers
// ─────────────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    'complete':           { cls: 'badge--ok',   label: 'Complete' },
    'active':             { cls: 'badge--gold', label: 'In Progress' },
    'upcoming':           { cls: 'badge--neutral', label: 'Upcoming' },
    'pending':            { cls: 'badge--warn', label: 'Pending Review' },
    'approved':           { cls: 'badge--ok',   label: 'Approved' },
    'changes-requested':  { cls: 'badge--err',  label: 'Changes Requested' },
    'awaiting':           { cls: 'badge--warn', label: 'Awaiting' },
    'submitted':          { cls: 'badge--info', label: 'Submitted' },
    'signed':             { cls: 'badge--ok',   label: 'Signed' },
    'paid':               { cls: 'badge--ok',   label: 'Paid' },
    'sent':               { cls: 'badge--info', label: 'Sent' },
    'connected':          { cls: 'badge--ok',   label: 'Connected' },
    'not-set':            { cls: 'badge--neutral', label: 'Not set' },
    'action':             { cls: 'badge--rust', label: 'Action needed' },
    'waiting':            { cls: 'badge--warn', label: 'Waiting on client' },
    'onboarding':         { cls: 'badge--info', label: 'Onboarding' },
    'on-track':           { cls: 'badge--ok',   label: 'On track' },
    'reporting':          { cls: 'badge--neutral', label: 'Reporting' },
  };
  const m = map[status] || map['upcoming'];
  return (
    <span className={`badge ${m.cls}`}>
      <span className="dot" /> {m.label}
    </span>
  );
};

const PhaseChip = ({ name, active }) => (
  <span style={{
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '4px 10px', borderRadius: 4,
    background: active ? 'rgba(212,160,32,0.10)' : 'transparent',
    color: active ? 'var(--gold-soft)' : 'var(--fg-faint)',
    border: '0.5px solid ' + (active ? 'rgba(212,160,32,0.30)' : 'var(--line)'),
  }}>{name}</span>
);

// ─────────────────────────────────────────────────────────────────────────
//   Toast stack — uses imperative window.toast(msg)
// ─────────────────────────────────────────────────────────────────────────

const ToastStack = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    window.toast = (msg, kind = 'ok') => {
      const id = Math.random().toString(36).slice(2);
      setToasts(t => [...t, { id, msg, kind }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
    };
  }, []);
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <Icon name={t.kind === 'ok' ? 'check' : 'flag'} size={14} />
          {t.msg}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//   Deliverable card — used in approvals queue
// ─────────────────────────────────────────────────────────────────────────

const DeliverableThumb = ({ label, h = 180, variant = 'A' }) => {
  // Visually distinct, realistic-feeling thumbnail without recreating actual UIs.
  const stripes = variant === 'A'
    ? 'linear-gradient(180deg, rgba(178,76,64,0.10) 0%, rgba(178,76,64,0.02) 100%)'
    : 'linear-gradient(180deg, rgba(212,160,32,0.08) 0%, rgba(212,160,32,0.02) 100%)';
  return (
    <div style={{
      height: h, borderRadius: 6, position: 'relative', overflow: 'hidden',
      background: 'var(--bg-2)',
      border: '0.5px solid var(--line-strong)',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: stripes }} />
      {/* Faux page layout */}
      <div style={{ position: 'absolute', inset: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: 38, height: 8, background: 'var(--cream)', opacity: 0.6, borderRadius: 1 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 16, height: 4, background: 'var(--cream)', opacity: 0.25, borderRadius: 1 }} />
            ))}
          </div>
        </div>
        <div style={{ flex: 1, background: variant === 'A' ? 'rgba(239,220,198,0.04)' : 'rgba(239,220,198,0.02)', borderRadius: 2,
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 8, gap: 4 }}>
          <div style={{ height: 12, width: '60%', background: 'var(--cream)', opacity: 0.85, borderRadius: 1 }} />
          <div style={{ height: 4, width: '78%', background: 'var(--cream)', opacity: 0.32, borderRadius: 1 }} />
          <div style={{ height: 4, width: '54%', background: 'var(--cream)', opacity: 0.32, borderRadius: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, height: 26, background: 'var(--rust)', borderRadius: 2, opacity: 0.7 }} />
          <div style={{ flex: 1, height: 26, background: 'transparent', border: '0.5px solid var(--cream)', opacity: 0.4, borderRadius: 2 }} />
        </div>
      </div>
      <div style={{
        position: 'absolute', top: 8, right: 8,
        fontFamily: 'var(--font-mono)', fontSize: 9, opacity: 0.4,
        color: 'var(--cream)', letterSpacing: '0.04em',
      }}>{label}</div>
    </div>
  );
};

const DeliverableCard = ({ deliverable, onOpen, compact = false }) => (
  <div className="card" style={{ cursor: 'pointer' }} onClick={() => onOpen(deliverable)}>
    <DeliverableThumb label={deliverable.thumb}
                       h={compact ? 120 : 180}
                       variant={deliverable.name.includes('B') ? 'B' : 'A'} />
    <div style={{ padding: compact ? 12 : 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, color: 'var(--cream)' }}>
          {deliverable.name}
        </div>
        <StatusBadge status={deliverable.status} />
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--fg-faint)' }}>
        <span>{deliverable.submittedBy}</span>
        <span>·</span>
        <span>{deliverable.submittedAt}</span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
//   Deliverable Approval Modal — the centerpiece flow
// ─────────────────────────────────────────────────────────────────────────

const ApprovalModal = ({ deliverable, onClose, onApprove, onRequest }) => {
  const [tab, setTab] = useState('preview'); // preview | revisions | comments
  const [requestMode, setRequestMode] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!deliverable) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 960 }}>
        <div className="modal-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icon name="image" size={18} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--cream)' }}>
                {deliverable.name}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>
                Brookside Dental · submitted {deliverable.submittedAt} by {deliverable.submittedBy}
              </div>
            </div>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose}><Icon name="x" /></button>
        </div>

        <div className="modal-bd" style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 420 }}>
            {/* preview */}
            <div style={{ padding: 24, background: 'var(--bg-0)', borderRight: '0.5px solid var(--line)' }}>
              <DeliverableThumb label={deliverable.thumb} h={420}
                                 variant={deliverable.name.includes('B') ? 'B' : 'A'} />
            </div>

            {/* details */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div className="eyebrow">Description</div>
                <p style={{ marginTop: 8, color: 'var(--fg-dim)', fontSize: 13.5, lineHeight: 1.55 }}>
                  {deliverable.description}
                </p>
              </div>

              <div>
                <div className="eyebrow">Revisions</div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {deliverable.revisions.map(r => (
                    <div key={r.v} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 6,
                      background: 'var(--bg-2)', fontSize: 12,
                    }}>
                      <span className="mono" style={{ color: 'var(--rust-soft)', fontWeight: 600 }}>{r.v}</span>
                      <span style={{ color: 'var(--fg-dim)' }}>{r.note}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--fg-faint)', fontSize: 11 }}>{r.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {requestMode && (
                <div className="fade-in">
                  <div className="eyebrow">Changes Requested</div>
                  <textarea className="input" style={{ marginTop: 8, minHeight: 100 }}
                            placeholder="What needs to change? Be specific — the team will pick up exactly what you write."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-ft">
          {requestMode ? (
            <>
              <button className="btn btn--quiet" onClick={() => { setRequestMode(false); setFeedback(''); }}>Cancel</button>
              <button className="btn btn--ghost" disabled={!feedback.trim()}
                      style={{ opacity: feedback.trim() ? 1 : 0.4 }}
                      onClick={() => { onRequest(deliverable, feedback); }}>
                <Icon name="send" size={14} /> Send to team
              </button>
            </>
          ) : (
            <>
              <button className="btn btn--quiet" onClick={onClose}>Close</button>
              <button className="btn btn--ghost" onClick={() => setRequestMode(true)}>
                <Icon name="pen" size={14} /> Request changes
              </button>
              <button className="btn btn--primary" onClick={() => onApprove(deliverable)}>
                <Icon name="check" size={14} /> Approve on client's behalf
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//   Contract signing modal
// ─────────────────────────────────────────────────────────────────────────

const ContractModal = ({ contract, onClose, onSign }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  if (!contract) return null;

  const canSign = name.trim() && email.includes('@') && agree;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icon name="sign" size={18} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{contract.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>
                Sent to client {contract.sentAt}
              </div>
            </div>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-bd">
          <div style={{
            background: 'var(--bg-2)', border: '0.5px solid var(--line)',
            borderRadius: 6, padding: 24, marginBottom: 18,
            fontFamily: 'var(--font-serif)', fontSize: 13, lineHeight: 1.75,
            color: 'var(--fg-dim)', minHeight: 180,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--cream)', letterSpacing: '0.04em', marginBottom: 10 }}>
              BRAND VIDEO ADDENDUM
            </div>
            <p style={{ margin: 0 }}>
              This addendum extends the Master Services Agreement dated March 18, 2026,
              to include the production of one (1) brand origin video, approximately 90
              seconds, including pre-production, one shoot day on-location at Brookside Dental,
              two rounds of revision, and final delivery in 4K master + web-optimized variants…
            </p>
            <p style={{ marginTop: 12, color: 'var(--fg-faint)', fontSize: 11.5, fontStyle: 'italic' }}>
              [contract continues — 3 more pages]
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="field-label">Full legal name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)}
                     placeholder="Dr. Elena Brookside" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)}
                     placeholder="elena@brooksidedental.com" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                   style={{ marginTop: 3, accentColor: 'var(--rust)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--fg-dim)', lineHeight: 1.55 }}>
              By typing my name above and clicking "Sign", I agree this constitutes
              an electronic signature with the same legal standing as a handwritten one.
            </span>
          </label>
        </div>
        <div className="modal-ft">
          <button className="btn btn--quiet" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" disabled={!canSign}
                  style={{ opacity: canSign ? 1 : 0.5 }}
                  onClick={() => onSign(contract, name)}>
            <Icon name="sign" size={14} /> Sign contract
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//   Reusable: KV grid for intake + about
// ─────────────────────────────────────────────────────────────────────────

const KVGrid = ({ entries, columns = 2 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '12px 24px',
  }}>
    {entries.map((e, i) => (
      <div key={i}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>{e.k}</div>
        <div style={{ color: 'var(--fg)', fontSize: 13.5 }}>{e.v}</div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
//   Intake Form — multi-section stepper
// ─────────────────────────────────────────────────────────────────────────

const IntakeForm = ({ density = 'regular' }) => {
  const [active, setActive] = useState(INTAKE_SECTIONS[0].id);
  const section = INTAKE_SECTIONS.find(s => s.id === active);
  const idx = INTAKE_SECTIONS.findIndex(s => s.id === active);
  const completed = INTAKE_SECTIONS.filter(s => s.complete).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
      {/* Steps */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Onboarding · {completed} of {INTAKE_SECTIONS.length} complete
        </div>
        <div className="progress" style={{ marginBottom: 18 }}>
          <i style={{ width: `${(completed / INTAKE_SECTIONS.length) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {INTAKE_SECTIONS.map((s, i) => (
            <button key={s.id}
                    onClick={() => setActive(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 6,
                      border: 'none',
                      background: active === s.id ? 'var(--bg-2)' : 'transparent',
                      color: active === s.id ? 'var(--cream)' : 'var(--fg-dim)',
                      textAlign: 'left', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 13,
                      borderLeft: active === s.id ? '2px solid var(--rust)' : '2px solid transparent',
                    }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600,
                background: s.complete ? 'var(--ok)' : 'var(--bg-3)',
                color: s.complete ? '#0a0a0a' : 'var(--fg-faint)',
                border: '0.5px solid ' + (s.complete ? 'var(--ok)' : 'var(--line-strong)'),
              }}>{s.complete ? '✓' : i + 1}</span>
              <span style={{ flex: 1 }}>{s.label}</span>
              {!s.complete && <span style={{ fontSize: 10, color: 'var(--warn)' }}>•</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Section {idx + 1}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.02em' }}>{section.label}</h3>
          </div>
          <StatusBadge status={section.complete ? 'complete' : 'awaiting'} />
        </div>
        <div className="card-bd">
          <KVGrid entries={section.fields} columns={section.id === 'notes' ? 1 : 2} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 8 }}>
            <button className="btn btn--quiet" disabled={idx === 0}
                    style={{ opacity: idx === 0 ? 0.4 : 1 }}
                    onClick={() => setActive(INTAKE_SECTIONS[idx - 1].id)}>
              <Icon name="arrowL" size={14} /> Previous
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost"><Icon name="pen" size={14} /> Edit section</button>
              <button className="btn btn--primary" disabled={idx === INTAKE_SECTIONS.length - 1}
                      style={{ opacity: idx === INTAKE_SECTIONS.length - 1 ? 0.5 : 1 }}
                      onClick={() => setActive(INTAKE_SECTIONS[idx + 1].id)}>
                Next <Icon name="arrowR" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//   Messages / Inbox thread
// ─────────────────────────────────────────────────────────────────────────

const MessageThread = ({ messages, density = 'regular', height = 480 }) => {
  const [draft, setDraft] = useState('');
  const [list, setList] = useState(messages);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollTo({ top: 99999 }); }, [list.length]);

  const send = () => {
    if (!draft.trim()) return;
    setList([...list, {
      id: 'm' + Date.now(), from: 'mr', author: 'Mara Reyes', side: 'agency',
      body: draft, time: 'just now', read: true,
    }]);
    setDraft('');
    window.toast?.('Message sent to Elena');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      <div ref={endRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {list.map(m => (
          <div key={m.id} style={{
            display: 'flex', gap: 10, alignSelf: m.side === 'agency' ? 'flex-end' : 'flex-start',
            maxWidth: '78%', flexDirection: m.side === 'agency' ? 'row-reverse' : 'row',
          }}>
            <div className="avatar avatar--sm" style={{
              background: m.side === 'agency' ? 'var(--rust)' : 'var(--bg-3)',
              color: m.side === 'agency' ? '#fff' : 'var(--cream)',
              border: 0,
            }}>
              {m.author.split(' ').map(w => w[0]).join('').slice(0,2)}
            </div>
            <div>
              <div style={{
                background: m.side === 'agency' ? 'var(--bg-3)' : 'var(--bg-2)',
                border: '0.5px solid var(--line-strong)',
                padding: '10px 14px', borderRadius: 10, fontSize: 13.5, lineHeight: 1.55,
                color: 'var(--fg)',
                borderTopRightRadius: m.side === 'agency' ? 2 : 10,
                borderTopLeftRadius:  m.side === 'agency' ? 10 : 2,
              }}>{m.body}</div>
              <div style={{
                fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 4,
                textAlign: m.side === 'agency' ? 'right' : 'left',
              }}>
                {m.author} · {m.time}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12, display: 'flex', gap: 8,
        padding: 12, background: 'var(--bg-2)', borderRadius: 8,
        border: '0.5px solid var(--line)',
      }}>
        <textarea className="input" rows={1}
                  value={draft} onChange={e => setDraft(e.target.value)}
                  placeholder="Reply to Elena…"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  style={{ resize: 'none', minHeight: 38, padding: '9px 10px',
                           background: 'transparent', border: 0, flex: 1 }} />
        <button className="btn btn--icon btn--quiet"><Icon name="paperclip" /></button>
        <button className="btn btn--primary btn--sm" onClick={send}>
          <Icon name="send" size={14} /> Send
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//   File grid
// ─────────────────────────────────────────────────────────────────────────

const FileGrid = ({ files, mode = 'grid' }) => {
  const kindIcon = k => ({ archive: 'archive', pdf: 'doc', design: 'image', doc: 'doc', video: 'video' })[k] || 'file';

  if (mode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {files.map((f, i) => (
          <div key={f.id} className="clickable" style={{
            display: 'grid', gridTemplateColumns: '24px 1fr 100px 110px 80px 32px',
            gap: 12, alignItems: 'center', padding: '10px 12px',
            borderBottom: i < files.length - 1 ? '0.5px solid var(--line)' : 'none',
            fontSize: 13,
          }}>
            <Icon name={kindIcon(f.kind)} size={15} />
            <span style={{ color: 'var(--cream)' }}>{f.name}</span>
            <span className="mono tabular" style={{ color: 'var(--fg-faint)', fontSize: 11.5 }}>{f.size}</span>
            <span style={{ color: 'var(--fg-dim)', fontSize: 12 }}>{f.by}</span>
            <span style={{ color: 'var(--fg-faint)', fontSize: 11.5 }}>{f.uploaded}</span>
            <Icon name="download" size={14} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
      {files.map(f => (
        <div key={f.id} className="card clickable" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            height: 80, borderRadius: 4,
            background: 'var(--bg-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-faint)',
          }}>
            <Icon name={kindIcon(f.kind)} size={24} stroke={1.4} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-faint)' }}>
            <span>{f.size}</span>
            <span>{f.uploaded}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//   Drop zone
// ─────────────────────────────────────────────────────────────────────────

const DropZone = ({ label = 'Drag files here or click to upload' }) => (
  <div className="img-placeholder" style={{
    height: 96, fontSize: 11.5, cursor: 'pointer',
    flexDirection: 'column', gap: 8,
  }}>
    <Icon name="upload" size={18} stroke={1.4} />
    <span>{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
//   Checklist row
// ─────────────────────────────────────────────────────────────────────────

const ChecklistRow = ({ item, onAction }) => {
  const icon = item.status === 'approved' ? 'check' :
               item.status === 'changes-requested' ? 'minus' :
               item.status === 'submitted' ? 'clock' : 'plus';
  const bg = item.status === 'approved' ? 'var(--ok)' :
             item.status === 'changes-requested' ? 'var(--err)' :
             item.status === 'submitted' ? 'var(--info)' : 'transparent';
  const fg = item.status === 'approved' || item.status === 'changes-requested' || item.status === 'submitted'
             ? '#0a0a0a' : 'var(--fg-faint)';
  const bd = item.status === 'awaiting' ? 'var(--line-bright)' : bg;

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 0', alignItems: 'flex-start',
      borderBottom: '0.5px solid var(--line)',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: bg, color: fg,
        border: `0.5px solid ${bd}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        <Icon name={icon} size={11} stroke={2.2} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, color: 'var(--cream)', fontWeight: 500 }}>{item.label}</div>
        {item.note && (
          <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginTop: 4, fontStyle: 'italic' }}>"{item.note}"</div>
        )}
        <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 4 }}>
          {item.status === 'awaiting' && `Requested ${item.requestedAt}`}
          {item.status === 'submitted' && `Submitted ${item.submittedAt} — pending review`}
          {item.status === 'approved' && `Approved ${item.submittedAt}`}
          {item.status === 'changes-requested' && `Changes requested ${item.requestedAt}`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {item.status === 'submitted' && (
          <>
            <button className="btn btn--sm btn--ghost" onClick={() => onAction(item, 'changes')}>Request changes</button>
            <button className="btn btn--sm btn--primary" onClick={() => onAction(item, 'approve')}>Approve</button>
          </>
        )}
        {item.status === 'awaiting' && (
          <button className="btn btn--sm btn--quiet"><Icon name="bell" size={13} /> Remind</button>
        )}
      </div>
    </div>
  );
};

// Export
Object.assign(window, {
  Icon, StatusBadge, PhaseChip, ToastStack, DeliverableThumb, DeliverableCard,
  ApprovalModal, ContractModal, KVGrid, IntakeForm, MessageThread, FileGrid,
  DropZone, ChecklistRow,
});
