// layout-commandbar.jsx
// Direction 2: COMMAND BAR
// Top horizontal nav, prominent global search/command-palette feel.
// Dense list-based content, monospace accents (IDs, timestamps, status codes).
// "Power-user dossier" mode. Same brand colors but tighter, more operational.

const { useState: useStateCB, useEffect: useEffectCB } = React;

const CommandBarLayout = ({ nav }) => {
  const c = CLIENTS.find(x => x.id === nav.clientId);
  const [paletteOpen, setPaletteOpen] = useStateCB(false);

  useEffectCB(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <CBTopBar nav={nav} onOpenPalette={() => setPaletteOpen(true)} />
      <main style={{ padding: 'var(--pad-xl)', maxWidth: 1480, margin: '0 auto' }}>
        {nav.view === 'dashboard' && <CBDashboard nav={nav} />}
        {nav.view === 'clients'   && <CBClients nav={nav} />}
        {nav.view === 'client'    && <CBClientDetail nav={nav} client={c} />}
        {nav.view === 'inbox'     && <CBInbox nav={nav} />}
        {nav.view === 'approvals' && <CBApprovals nav={nav} />}
        {nav.view === 'reports'   && <CBReports nav={nav} />}
        {nav.view === 'files'     && <FilesTab nav={nav} />}
        {nav.view === 'activity'  && <CBActivity nav={nav} />}
      </main>
      {paletteOpen && <CommandPalette nav={nav} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Top bar — wide, two-row: brand+nav | search+filters
// ────────────────────────────────────────────────────────────

const CBTopBar = ({ nav, onOpenPalette }) => {
  const items = [
    { id: 'dashboard',  label: 'Dashboard',   view: 'dashboard' },
    { id: 'clients',    label: 'Clients',     view: 'clients' },
    { id: 'approvals',  label: 'Approvals',   view: 'approvals', count: nav.deliverables.filter(d => d.status === 'pending').length },
    { id: 'inbox',      label: 'Inbox',       view: 'inbox',     count: CLIENTS.reduce((a, b) => a + b.unread, 0) },
    { id: 'reports',    label: 'Reports',     view: 'reports' },
    { id: 'activity',   label: 'Activity',    view: 'activity' },
  ];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '0.5px solid var(--line)',
    }}>
      {/* Row 1: brand · nav · user */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 28,
        padding: '14px var(--pad-xl)',
        borderBottom: '0.5px solid var(--line)',
      }}>
        <AwakenLockup size={26} gap={10} />
        <span style={{ width: 1, height: 18, background: 'var(--line-bright)' }} />
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Duo Portal — Agency
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn--ghost btn--sm"><Icon name="plus" size={13} /> New project</button>
          <button className="btn btn--icon btn--quiet"><Icon name="bell" size={15} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: '0.5px solid var(--line)' }}>
            <div className="avatar" style={{ background: 'var(--rust)', color: '#fff' }}>JC</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 600 }}>Jordan Cole</span>
              <span style={{ fontSize: 10, color: 'var(--fg-faint)' }}>Awaken Creative</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: nav · search · workspace */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 var(--pad-xl)', height: 44,
      }}>
        {items.map(it => {
          const active = nav.view === it.view;
          return (
            <button key={it.id} onClick={() => nav.setView(it.view)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 14px', height: '100%',
              border: 0, borderBottom: active ? '2px solid var(--rust)' : '2px solid transparent',
              background: 'transparent',
              color: active ? 'var(--cream)' : 'var(--fg-dim)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              {it.label}
              {typeof it.count === 'number' && it.count > 0 && (
                <span className="mono tabular" style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 3,
                  background: 'var(--bg-3)', color: 'var(--rust-soft)',
                  fontWeight: 600,
                }}>{it.count}</span>
              )}
            </button>
          );
        })}

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onOpenPalette} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 12px 6px 10px',
            background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)',
            borderRadius: 6, cursor: 'pointer',
            color: 'var(--fg-faint)', fontFamily: 'inherit', fontSize: 12,
            minWidth: 320,
          }}>
            <Icon name="search" size={13} />
            <span style={{ flex: 1, textAlign: 'left' }}>Jump to client, deliverable, file…</span>
            <span className="mono" style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 3,
              background: 'var(--bg-3)', border: '0.5px solid var(--line-strong)',
              color: 'var(--fg-mute)',
            }}>⌘K</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// ────────────────────────────────────────────────────────────
//   Command palette
// ────────────────────────────────────────────────────────────

const CommandPalette = ({ nav, onClose }) => {
  const [q, setQ] = useStateCB('');
  const allItems = [
    ...CLIENTS.map(c => ({ kind: 'Client', label: c.name, sub: c.project, action: () => { nav.goToClient(c.id); onClose(); } })),
    ...nav.deliverables.filter(d => d.status === 'pending').map(d => ({ kind: 'Approve', label: d.name, sub: d.description.slice(0, 60), action: () => { nav.openApproval(d); onClose(); } })),
    { kind: 'View', label: 'Dashboard', sub: 'Agency command center', action: () => { nav.setView('dashboard'); onClose(); } },
    { kind: 'View', label: 'Inbox',     sub: 'All client threads',    action: () => { nav.setView('inbox'); onClose(); } },
    { kind: 'View', label: 'Approvals queue', sub: 'Pending deliverables', action: () => { nav.setView('approvals'); onClose(); } },
    { kind: 'View', label: 'Reports',   sub: 'Scheduled monthly + ad-hoc', action: () => { nav.setView('reports'); onClose(); } },
  ];
  const filtered = q ? allItems.filter(i => (i.label + ' ' + i.sub).toLowerCase().includes(q.toLowerCase())) : allItems;
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: 110 }}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '0.5px solid var(--line)',
        }}>
          <Icon name="search" size={16} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Search clients, approvals, or jump to…"
                 style={{
                   flex: 1, background: 'transparent', border: 0, outline: 'none',
                   color: 'var(--cream)', fontSize: 15, fontFamily: 'inherit',
                 }} />
          <span className="mono" style={{
            fontSize: 10, color: 'var(--fg-mute)',
            padding: '2px 7px', borderRadius: 3, border: '0.5px solid var(--line-strong)',
          }}>ESC</span>
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--fg-faint)', fontSize: 13 }}>No matches.</div>
          )}
          {filtered.slice(0, 8).map((it, i) => (
            <button key={i} onClick={it.action} style={{
              width: '100%', display: 'flex', gap: 12, alignItems: 'center',
              padding: '10px 12px', border: 0, background: i === 0 ? 'var(--bg-3)' : 'transparent',
              borderRadius: 6, cursor: 'pointer', color: 'var(--cream)',
              textAlign: 'left', fontFamily: 'inherit',
            }}>
              <span className="mono" style={{
                fontSize: 9.5, padding: '2px 7px', borderRadius: 3,
                background: 'var(--bg-2)', color: 'var(--rust-soft)',
                fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                minWidth: 56, textAlign: 'center',
              }}>{it.kind}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--cream)' }}>{it.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.sub}</div>
              </div>
              <Icon name="arrowR" size={12} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   CB Dashboard — three-column dense, list-heavy
// ────────────────────────────────────────────────────────────

const CBDashboard = ({ nav }) => {
  return (
    <div className="fade-in-up">
      {/* Compact header strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 32, marginBottom: 28,
        paddingBottom: 20, borderBottom: '0.5px solid var(--line)',
      }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.16em' }}>
            WED · MAY 13 · 14:22 PT
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: '0.02em',
            margin: '6px 0 0', color: 'var(--cream)',
          }}>COMMAND CENTER</h1>
        </div>
        <div style={{ display: 'flex', gap: 22, marginLeft: 'auto' }}>
          <CBStat label="Active clients" value={CLIENTS.filter(c => c.progress < 100).length} sub={`${CLIENTS.length} total`} />
          <CBStat label="Pending approvals" value={nav.deliverables.filter(d => d.status === 'pending').length} sub="2 high priority" accent="rust" />
          <CBStat label="Waiting on client" value={WAITING_ON_CLIENT.length} sub="avg 3d" accent="gold" />
          <CBStat label="Reports due" value={REPORTS_DUE.length} sub="next May 14" />
          <CBStat label="MRR" value="$14.4k" sub="+$2.4k MoM" mono />
        </div>
      </div>

      {/* 3-col grid: action items | client board | activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr', gap: 'var(--pad-lg)' }}>
        {/* Action items */}
        <CBPanel title="ACTION_ITEMS" sub="needs you · today">
          {ACTION_ITEMS.map((a, i) => (
            <div key={a.id} className="clickable" style={{
              padding: '10px 14px',
              borderBottom: i < ACTION_ITEMS.length - 1 ? '0.5px solid var(--line)' : 'none',
              display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
            }}>
              <span className="mono" style={{
                fontSize: 9.5, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.06em',
                background: a.priority === 'high' ? 'rgba(178,76,64,0.18)' :
                            a.priority === 'medium' ? 'rgba(212,160,32,0.18)' : 'var(--bg-3)',
                color: a.priority === 'high' ? 'var(--rust-soft)' :
                       a.priority === 'medium' ? 'var(--gold-soft)' : 'var(--fg-faint)',
                textTransform: 'uppercase', fontWeight: 700,
              }}>{a.priority[0]}</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--cream)' }}>{a.label}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 2, letterSpacing: '0.04em' }}>
                  {a.client.toUpperCase()} · DUE {a.due.toUpperCase()}
                </div>
              </div>
              <Icon name="arrowR" size={13} />
            </div>
          ))}
        </CBPanel>

        {/* Client board */}
        <CBPanel title="CLIENTS" sub={`${CLIENTS.length} active`} action="View all">
          {CLIENTS.map((c, i) => (
            <button key={c.id} onClick={() => nav.goToClient(c.id)} style={{
              width: '100%', border: 0, background: 'transparent', cursor: 'pointer',
              padding: '10px 14px',
              display: 'grid', gridTemplateColumns: '24px 1fr 56px 80px 16px',
              gap: 10, alignItems: 'center', textAlign: 'left',
              borderBottom: i < CLIENTS.length - 1 ? '0.5px solid var(--line)' : 'none',
              transition: 'background 100ms ease',
            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: c.flag === 'action' ? 'var(--rust)' :
                            c.flag === 'waiting' ? 'var(--gold)' :
                            c.flag === 'onboarding' ? 'var(--info)' :
                            c.flag === 'on-track' ? 'var(--ok)' : 'var(--fg-mute)',
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>{c.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-faint)', letterSpacing: '0.04em', marginTop: 1 }}>
                  {c.phase.toUpperCase()} · {c.activity}
                </div>
              </div>
              <div className="mono tabular" style={{ fontSize: 11, color: 'var(--cream)', textAlign: 'right' }}>{c.progress}%</div>
              <div className="progress" style={{ height: 3 }}><i style={{ width: `${c.progress}%` }} /></div>
              <Icon name="chevR" size={12} />
            </button>
          ))}
        </CBPanel>

        {/* Activity stream */}
        <CBPanel title="ACTIVITY" sub="last 24h">
          {ACTIVITY.slice(0, 6).map((a, i) => (
            <div key={a.id} style={{
              padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
              borderBottom: i < 5 ? '0.5px solid var(--line)' : 'none',
            }}>
              <span className="mono" style={{
                fontSize: 9.5, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.04em',
                background: 'var(--bg-3)', color: 'var(--fg-dim)',
                textTransform: 'uppercase', fontWeight: 600, flexShrink: 0,
                minWidth: 50, textAlign: 'center',
              }}>{a.kind.slice(0, 7)}</span>
              <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45 }}>
                <div><span style={{ color: 'var(--cream)' }}>{a.who}</span> <span style={{ color: 'var(--fg-dim)' }}>{a.action}</span></div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 2, letterSpacing: '0.04em' }}>{a.when.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </CBPanel>

        {/* Lower row */}
        <CBPanel title="WAITING_ON_CLIENT" sub={`${WAITING_ON_CLIENT.length} items`}>
          {WAITING_ON_CLIENT.map((w, i) => (
            <div key={w.id} style={{
              padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 60px 70px', gap: 10,
              alignItems: 'center', borderBottom: i < WAITING_ON_CLIENT.length - 1 ? '0.5px solid var(--line)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--cream)' }}>{w.label}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 2, letterSpacing: '0.04em' }}>
                  {w.client.toUpperCase()}
                </div>
              </div>
              <span className="mono tabular" style={{ fontSize: 11, color: 'var(--gold-soft)' }}>+{w.age}</span>
              <button className="btn btn--sm btn--ghost" style={{ padding: '4px 8px', fontSize: 11 }}>Nudge</button>
            </div>
          ))}
        </CBPanel>

        <CBPanel title="UPCOMING_MILESTONES" sub="next 14 days" action="Calendar">
          {UPCOMING_MILESTONES.map((m, i) => (
            <div key={m.id} style={{
              padding: '10px 14px', display: 'grid', gridTemplateColumns: '60px 1fr', gap: 12,
              alignItems: 'center', borderBottom: i < UPCOMING_MILESTONES.length - 1 ? '0.5px solid var(--line)' : 'none',
            }}>
              <div className="mono" style={{
                fontSize: 11, color: 'var(--cream)', letterSpacing: '0.04em',
                background: 'var(--bg-3)', padding: '4px 8px', borderRadius: 3,
                textAlign: 'center', fontWeight: 600,
              }}>{m.date.toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--cream)' }}>{m.label}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 2, letterSpacing: '0.04em' }}>{m.client.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </CBPanel>

        <CBPanel title="REPORTS_DUE" sub={`${REPORTS_DUE.length} pending`}>
          {REPORTS_DUE.map((r, i) => (
            <div key={r.id} style={{
              padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 10,
              alignItems: 'center', borderBottom: i < REPORTS_DUE.length - 1 ? '0.5px solid var(--line)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--cream)' }}>{r.kind}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 2, letterSpacing: '0.04em' }}>{r.client.toUpperCase()}</div>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--gold-soft)' }}>{r.due}</span>
              <button className="btn btn--sm btn--ghost" style={{ padding: '4px 8px', fontSize: 11 }}>Build</button>
            </div>
          ))}
        </CBPanel>
      </div>
    </div>
  );
};

const CBStat = ({ label, value, sub, accent, mono }) => {
  const color = accent === 'rust' ? 'var(--rust-soft)' : accent === 'gold' ? 'var(--gold-soft)' : 'var(--cream)';
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--fg-faint)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)', fontSize: mono ? 22 : 28, color, marginTop: 4, lineHeight: 1, fontWeight: mono ? 600 : 400, letterSpacing: '0.02em' }}>{value}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 4, letterSpacing: '0.04em' }}>{sub}</div>
    </div>
  );
};

const CBPanel = ({ title, sub, action, children }) => (
  <div style={{
    background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6,
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderBottom: '0.5px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--cream)', fontWeight: 600, letterSpacing: '0.08em' }}>{title}</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', letterSpacing: '0.04em' }}>// {sub}</span>
      </div>
      {action && <button className="btn btn--quiet btn--sm" style={{ padding: '2px 6px', fontSize: 11 }}>{action}</button>}
    </div>
    <div>{children}</div>
  </div>
);

// ────────────────────────────────────────────────────────────
//   CB Clients — single dense table
// ────────────────────────────────────────────────────────────

const CBClients = ({ nav }) => {
  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.16em' }}>CLIENTS.ACTIVE</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: '0.02em', margin: '6px 0 0', color: 'var(--cream)' }}>{CLIENTS.length} engagements</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost btn--sm"><Icon name="download" size={13} /> Export</button>
          <button className="btn btn--ghost btn--sm"><Icon name="filter" size={13} /> Filter</button>
          <button className="btn btn--primary btn--sm"><Icon name="plus" size={13} /> Add</button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6, overflow: 'hidden' }}>
        <div className="mono" style={{
          display: 'grid', gridTemplateColumns: '32px 240px 1fr 110px 100px 60px 70px 90px 100px 28px',
          gap: 12, padding: '10px 14px', background: 'var(--bg-2)',
          fontSize: 10, color: 'var(--fg-faint)', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          borderBottom: '0.5px solid var(--line-strong)',
        }}>
          <div>id</div>
          <div>client</div>
          <div>project</div>
          <div>phase</div>
          <div>progress</div>
          <div>appr</div>
          <div>wait</div>
          <div>status</div>
          <div>activity</div>
          <div />
        </div>
        {CLIENTS.map((c, i) => (
          <div key={c.id} className="clickable" onClick={() => nav.goToClient(c.id)} style={{
            display: 'grid', gridTemplateColumns: '32px 240px 1fr 110px 100px 60px 70px 90px 100px 28px',
            gap: 12, padding: '12px 14px', alignItems: 'center',
            borderBottom: i < CLIENTS.length - 1 ? '0.5px solid var(--line)' : 'none',
          }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-mute)', letterSpacing: '0.04em' }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="avatar avatar--sm" style={{ background: 'var(--bg-3)' }}>{c.initials}</span>
              <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>{c.name}</span>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--fg-dim)' }}>{c.project}</span>
            <PhaseChip name={c.phase} active />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="progress" style={{ height: 3, flex: 1 }}><i style={{ width: `${c.progress}%` }} /></div>
              <span className="mono tabular" style={{ fontSize: 10.5, color: 'var(--fg-faint)', minWidth: 28, textAlign: 'right' }}>{c.progress}%</span>
            </div>
            <span className="mono tabular" style={{ fontSize: 12, color: c.pendingApprovals > 0 ? 'var(--rust-soft)' : 'var(--fg-mute)' }}>{c.pendingApprovals || '·'}</span>
            <span className="mono tabular" style={{ fontSize: 12, color: c.awaitingClient > 0 ? 'var(--gold-soft)' : 'var(--fg-mute)' }}>{c.awaitingClient || '·'}</span>
            <StatusBadge status={c.flag} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{c.activity}</span>
            <Icon name="chevR" size={12} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   CB Client Detail — dossier layout
// ────────────────────────────────────────────────────────────

const CBClientDetail = ({ nav, client }) => {
  const tabs = [
    'overview', 'milestones', 'deliverables', 'checklist', 'intake',
    'messages', 'contracts', 'invoices', 'files', 'analytics',
  ];
  return (
    <div className="fade-in-up">
      {/* Dossier header */}
      <div style={{
        background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6,
        padding: 'var(--pad-lg)', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <span className="avatar avatar--xl" style={{ background: 'var(--bg-3)', borderRadius: 6 }}>{client.initials}</span>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-faint)', letterSpacing: '0.16em' }}>
              ENGAGEMENT.{client.id.toUpperCase()} · {client.industry.toUpperCase()}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: '0.02em', margin: '6px 0 0', color: 'var(--cream)' }}>{client.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--fg-dim)', marginTop: 8 }}>{client.project}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--ghost btn--sm"><Icon name="chat" size={13} /> Message</button>
            <button className="btn btn--ghost btn--sm"><Icon name="eye" size={13} /> View as client</button>
          </div>
        </div>

        {/* KV strip */}
        <div className="mono" style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14,
          marginTop: 22, paddingTop: 18, borderTop: '0.5px solid var(--line)',
          fontSize: 11.5,
        }}>
          <CBKV label="START"     value={client.startedAt} />
          <CBKV label="TARGET"    value={client.targetLaunch} accent="cream" />
          <CBKV label="PHASE"     value={client.phase} />
          <CBKV label="PROGRESS"  value={`${client.progress}%`} accent="cream" />
          <CBKV label="APPROVALS" value={client.pendingApprovals} accent={client.pendingApprovals > 0 ? 'rust' : null} />
          <CBKV label="WAITING"   value={client.awaitingClient} accent={client.awaitingClient > 0 ? 'gold' : null} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 20,
        background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6,
        padding: 4,
      }}>
        {tabs.map(t => {
          const active = nav.clientTab === t;
          return (
            <button key={t} onClick={() => nav.setClientTab(t)} style={{
              padding: '8px 14px', border: 0,
              background: active ? 'var(--bg-3)' : 'transparent',
              color: active ? 'var(--cream)' : 'var(--fg-dim)',
              borderRadius: 4, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 500,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{t}</button>
          );
        })}
      </div>

      {/* Tab content — most reuse sidebar layout components */}
      {nav.clientTab === 'overview'     && <OverviewTab nav={nav} client={client} />}
      {nav.clientTab === 'milestones'   && <MilestonesTab nav={nav} />}
      {nav.clientTab === 'deliverables' && <DeliverablesTab nav={nav} />}
      {nav.clientTab === 'checklist'    && <ChecklistTab nav={nav} />}
      {nav.clientTab === 'intake'       && <IntakeForm />}
      {nav.clientTab === 'messages'     && (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6, padding: 18 }}>
          <MessageThread messages={MESSAGES} />
        </div>
      )}
      {nav.clientTab === 'contracts'    && <ContractsTab nav={nav} />}
      {nav.clientTab === 'invoices'     && <InvoicesTab nav={nav} />}
      {nav.clientTab === 'files'        && <FilesTab nav={nav} />}
      {nav.clientTab === 'analytics'    && <AnalyticsTab nav={nav} />}
    </div>
  );
};

const CBKV = ({ label, value, accent }) => {
  const color = accent === 'rust' ? 'var(--rust-soft)' : accent === 'gold' ? 'var(--gold-soft)' : accent === 'cream' ? 'var(--cream)' : 'var(--fg-dim)';
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-faint)', letterSpacing: '0.12em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color, marginTop: 4, fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Other CB views — reuse with denser shell
// ────────────────────────────────────────────────────────────

const CBInbox = ({ nav }) => (
  <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6, alignSelf: 'start' }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--cream)', padding: '10px 14px', borderBottom: '0.5px solid var(--line)', letterSpacing: '0.08em' }}>THREADS</div>
      {CLIENTS.map((c, i) => (
        <button key={c.id} onClick={() => nav.goToClient(c.id, 'messages')} style={{
          width: '100%', display: 'flex', gap: 10, padding: '10px 14px',
          border: 0, background: c.id === 'brookside' ? 'var(--bg-2)' : 'transparent',
          cursor: 'pointer', textAlign: 'left',
          borderBottom: i < CLIENTS.length - 1 ? '0.5px solid var(--line)' : 'none',
        }}>
          <span className="avatar avatar--sm">{c.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 500 }}>{c.name}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)' }}>{c.activity}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-dim)', marginTop: 2 }}>{c.contact.name}</div>
          </div>
          {c.unread > 0 && <span style={{ background: 'var(--rust)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, alignSelf: 'center' }}>{c.unread}</span>}
        </button>
      ))}
    </div>
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6, padding: 20 }}>
      <MessageThread messages={MESSAGES} height={580} />
    </div>
  </div>
);

const CBApprovals = ({ nav }) => {
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.16em' }}>APPROVALS.QUEUE</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, margin: '6px 0 0', color: 'var(--cream)', letterSpacing: '0.02em' }}>{pending.length} pending</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {pending.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} />)}
      </div>
    </div>
  );
};

const CBReports = ({ nav }) => (
  <div className="fade-in-up">
    <div style={{ marginBottom: 20 }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.16em' }}>REPORTS.SCHEDULED</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, margin: '6px 0 0', color: 'var(--cream)', letterSpacing: '0.02em' }}>{REPORTS_DUE.length} due</h1>
    </div>
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6 }}>
      {REPORTS_DUE.map((r, i) => (
        <div key={r.id} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 100px 110px',
          gap: 14, padding: '14px 18px', alignItems: 'center',
          borderBottom: i < REPORTS_DUE.length - 1 ? '0.5px solid var(--line)' : 'none',
        }}>
          <div style={{ fontSize: 13, color: 'var(--cream)' }}>{r.kind}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.04em' }}>{r.client.toUpperCase()}</div>
          <span className="mono" style={{ fontSize: 12, color: 'var(--gold-soft)' }}>{r.due}</span>
          <button className="btn btn--ghost btn--sm">Build <Icon name="arrowR" size={13} /></button>
        </div>
      ))}
    </div>
  </div>
);

const CBActivity = ({ nav }) => (
  <div className="fade-in-up">
    <div style={{ marginBottom: 20 }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.16em' }}>ACTIVITY.LOG</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, margin: '6px 0 0', color: 'var(--cream)', letterSpacing: '0.02em' }}>All events</h1>
    </div>
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6 }}>
      {ACTIVITY.concat(ACTIVITY).map((a, i, arr) => (
        <div key={i} style={{
          padding: '12px 18px', display: 'grid', gridTemplateColumns: '90px 70px 1fr',
          gap: 14, alignItems: 'center',
          borderBottom: i < arr.length - 1 ? '0.5px solid var(--line)' : 'none',
        }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-faint)', letterSpacing: '0.04em' }}>{a.when.toUpperCase()}</span>
          <span className="mono" style={{
            fontSize: 9.5, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.04em',
            background: 'var(--bg-3)', color: 'var(--fg-dim)',
            textTransform: 'uppercase', fontWeight: 600, textAlign: 'center',
          }}>{a.kind}</span>
          <div style={{ fontSize: 12.5 }}>
            <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{a.who}</span>
            <span style={{ color: 'var(--fg-dim)' }}> {a.action}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, { CommandBarLayout });
