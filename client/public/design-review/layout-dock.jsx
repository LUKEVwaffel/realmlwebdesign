// layout-dock.jsx
// Direction 4: STUDIO DOCK
// Thin icon-only dock + secondary project rail. Filmstrip metaphor for
// milestones. Mix of cards and lists. Cinematic feel: letterbox-style
// section headers, larger imagery.

const DockLayout = ({ nav }) => {
  const c = CLIENTS.find(x => x.id === nav.clientId);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 280px 1fr', minHeight: '100vh', background: 'var(--bg-0)' }}>
      <Dock nav={nav} />
      <ProjectRail nav={nav} />
      <main style={{ minWidth: 0, overflowX: 'hidden' }}>
        {nav.view === 'dashboard' && <DockDashboard nav={nav} />}
        {nav.view === 'clients'   && <DockClients nav={nav} />}
        {nav.view === 'client'    && <DockClient nav={nav} client={c} />}
        {nav.view === 'inbox'     && <DockInbox nav={nav} />}
        {nav.view === 'approvals' && <DockApprovals nav={nav} />}
        {nav.view === 'reports'   && <DockReports nav={nav} />}
        {nav.view === 'files'     && <DockGenericPage title="Files" eyebrow="All projects"><FileGrid files={FILES} /></DockGenericPage>}
        {nav.view === 'activity'  && <DockActivity nav={nav} />}
      </main>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Dock
// ────────────────────────────────────────────────────────────

const Dock = ({ nav }) => {
  const items = [
    { id: 'dashboard', icon: 'home',     view: 'dashboard' },
    { id: 'clients',   icon: 'clients',  view: 'clients' },
    { id: 'approvals', icon: 'check',    view: 'approvals',
      badge: nav.deliverables.filter(d => d.status === 'pending').length },
    { id: 'inbox',     icon: 'inbox',    view: 'inbox',
      badge: CLIENTS.reduce((a, b) => a + b.unread, 0) },
    { id: 'files',     icon: 'folder',   view: 'files' },
    { id: 'reports',   icon: 'bar',      view: 'reports' },
    { id: 'activity',  icon: 'activity', view: 'activity' },
  ];
  return (
    <aside style={{
      position: 'sticky', top: 0, height: '100vh',
      background: 'var(--bg-1)',
      borderRight: '0.5px solid var(--line)',
      padding: '18px 0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      <button onClick={() => nav.setView('dashboard')} style={{
        background: 'none', border: 0, padding: 0, cursor: 'pointer', marginBottom: 12,
      }}><AwakenMark size={28} /></button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {items.map(it => {
          const active = nav.view === it.view ||
                         (it.id === 'clients' && nav.view === 'client');
          return (
            <button key={it.id} onClick={() => nav.setView(it.view)} style={{
              width: 38, height: 38, borderRadius: 8, padding: 0, position: 'relative',
              background: active ? 'var(--bg-3)' : 'transparent',
              border: 0, cursor: 'pointer',
              color: active ? 'var(--cream)' : 'var(--fg-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={it.icon} size={17} />
              {active && <span style={{ position: 'absolute', left: -10, top: 10, bottom: 10, width: 2, background: 'var(--rust)', borderRadius: 1 }} />}
              {it.badge > 0 && (
                <span style={{
                  position: 'absolute', top: 3, right: 3,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--rust)', border: '1.5px solid var(--bg-1)',
                }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <button className="btn btn--icon btn--quiet"><Icon name="bell" size={16} /></button>
        <button className="btn btn--icon btn--quiet"><Icon name="settings" size={16} /></button>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--rust)', color: '#fff',
                       display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>JC</div>
      </div>
    </aside>
  );
};

// ────────────────────────────────────────────────────────────
//   Project rail
// ────────────────────────────────────────────────────────────

const ProjectRail = ({ nav }) => {
  const heading = ({
    dashboard: 'Engagements', clients: 'Engagements', client: 'Engagements',
    inbox: 'Threads', approvals: 'Pending review', reports: 'Reports',
    files: 'Recent files', activity: 'Activity',
  })[nav.view] || 'Engagements';

  return (
    <aside style={{
      borderRight: '0.5px solid var(--line)', background: 'var(--bg-1)',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      <div style={{
        background: 'var(--bg-0)', borderBottom: '0.5px solid var(--line)',
        padding: '20px 22px', position: 'sticky', top: 0, zIndex: 2,
      }}>
        <div className="eyebrow eyebrow--rust">Awaken · Studio</div>
        <h2 className="h-display" style={{ fontSize: 22, marginTop: 4 }}>{heading}</h2>
      </div>

      <div style={{ padding: 10 }}>
        {CLIENTS.map(c => {
          const active = nav.view === 'client' && nav.clientId === c.id;
          return (
            <button key={c.id}
                    onClick={() => nav.view === 'inbox'
                      ? nav.goToClient(c.id, 'messages')
                      : nav.goToClient(c.id)}
                    style={{
                      width: '100%', display: 'flex', gap: 12, padding: 12,
                      border: 0, background: active ? 'var(--bg-3)' : 'transparent',
                      borderRadius: 8, cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                    }}>
              <div style={{
                width: 56, height: 56, borderRadius: 6,
                background: 'linear-gradient(135deg, var(--bg-3) 0%, var(--bg-2) 100%)',
                border: '0.5px solid var(--line-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--cream)', flexShrink: 0, position: 'relative',
                fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.04em',
              }}>
                {c.initials}
                {c.flag === 'action' && (
                  <span style={{
                    position: 'absolute', bottom: -3, right: -3,
                    width: 12, height: 12, borderRadius: '50%',
                    background: 'var(--rust)', border: '1.5px solid var(--bg-1)',
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  {c.unread > 0 && <span style={{ background: 'var(--rust)', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>{c.unread}</span>}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 2, letterSpacing: '0.04em' }}>
                  {c.phase.toUpperCase()} · {c.progress}%
                </div>
                <div className="progress" style={{ height: 2, marginTop: 6 }}>
                  <i style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

// ────────────────────────────────────────────────────────────
//   Letterboxed header (used by every Dock page)
// ────────────────────────────────────────────────────────────

const Letterbox = ({ eyebrow, title, sub, actions, large = true }) => (
  <div style={{
    position: 'relative', padding: '44px 36px 32px',
    borderBottom: '0.5px solid var(--line)',
    background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%)',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: 'var(--bg-0)', opacity: 0.6 }} />
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, background: 'var(--bg-0)', opacity: 0.6 }} />
    <div style={{ position: 'relative' }}>
      {eyebrow && <div className="eyebrow eyebrow--rust">{eyebrow}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginTop: 8, flexWrap: 'wrap' }}>
        <h1 className="h-display" style={{ fontSize: large ? 44 : 32, lineHeight: 1, letterSpacing: '0.02em', flex: '1 1 auto', minWidth: 0 }}>{title}</h1>
        {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
      </div>
      {sub && <p style={{ color: 'var(--fg-dim)', fontSize: 14, marginTop: 14, maxWidth: 620, lineHeight: 1.55 }}>{sub}</p>}
    </div>
  </div>
);

const DockGenericPage = ({ title, eyebrow, sub, actions, children }) => (
  <div className="fade-in-up">
    <Letterbox eyebrow={eyebrow} title={title} sub={sub} actions={actions} />
    <div style={{ padding: 36 }}>{children}</div>
  </div>
);

// ────────────────────────────────────────────────────────────
//   Dock Dashboard — filmstrip rhythm
// ────────────────────────────────────────────────────────────

const DockDashboard = ({ nav }) => (
  <div className="fade-in-up">
    <Letterbox
      eyebrow="Wed · 13 May · Studio open"
      title="Today's call sheet"
      sub="Three things waiting on you. Two clients on the team. One shoot day this week."
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost"><Icon name="calendar" size={14} /> Week</button>
          <button className="btn btn--primary"><Icon name="plus" size={14} /> New project</button>
        </div>
      }
    />

    {/* Stat strip */}
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      borderBottom: '0.5px solid var(--line)',
    }}>
      <DockStat label="On your plate" value={ACTION_ITEMS.length} sub="2 high priority" accent="rust" />
      <DockStat label="On client's plate" value={WAITING_ON_CLIENT.length} sub="avg 3d old" accent="gold" />
      <DockStat label="This week" value={UPCOMING_MILESTONES.length} sub="2 launches" />
      <DockStat label="Reports" value={REPORTS_DUE.length} sub="next May 14" />
    </div>

    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Action items as "shots" */}
      <section>
        <SectionTitle title="Needs you" sub="In order of urgency" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {ACTION_ITEMS.map((a, i) => (
            <div key={a.id} className="clickable" style={{
              padding: 18, borderRadius: 8,
              background: 'var(--bg-1)',
              border: '0.5px solid ' + (a.priority === 'high' ? 'rgba(178,76,64,0.34)' : 'var(--line-strong)'),
              display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden',
            }}>
              {a.priority === 'high' && (
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: 'var(--rust)',
                }} />
              )}
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', letterSpacing: '0.12em' }}>
                SHOT {String(i + 1).padStart(3, '0')} · {a.priority.toUpperCase()}
              </div>
              <div style={{ fontSize: 14.5, color: 'var(--cream)', fontWeight: 500, lineHeight: 1.4 }}>{a.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>{a.client}</span>
                <span style={{ fontSize: 11.5, color: a.due === 'today' ? 'var(--rust-soft)' : 'var(--fg-dim)' }}>{a.due}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* "Filmstrip" — current project timeline preview */}
      <section>
        <SectionTitle title="Brookside Dental · timeline" sub="Currently in design phase" action={<button className="btn btn--quiet btn--sm" onClick={() => nav.goToClient('brookside', 'milestones')}>Open project <Icon name="arrowR" size={12} /></button>} />
        <Filmstrip phases={PHASES} />
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section>
          <SectionTitle title="Waiting on clients" small />
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 8 }}>
            {WAITING_ON_CLIENT.map((w, i) => (
              <div key={w.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 70px', gap: 12,
                padding: '12px 16px', alignItems: 'center',
                borderBottom: i < WAITING_ON_CLIENT.length - 1 ? '0.5px solid var(--line)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--cream)' }}>{w.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 2 }}>{w.client}</div>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--gold-soft)' }}>+{w.age}</span>
                <button className="btn btn--sm btn--ghost">Nudge</button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="Upcoming this week" small />
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 8 }}>
            {UPCOMING_MILESTONES.map((m, i) => (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '70px 1fr', gap: 12,
                padding: '12px 16px', alignItems: 'center',
                borderBottom: i < UPCOMING_MILESTONES.length - 1 ? '0.5px solid var(--line)' : 'none',
              }}>
                <span className="mono" style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--cream)',
                  background: 'var(--bg-3)', padding: '4px 8px', borderRadius: 3,
                  textAlign: 'center', letterSpacing: '0.04em',
                }}>{m.date}</span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--cream)' }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 2 }}>{m.client}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  </div>
);

const DockStat = ({ label, value, sub, accent }) => {
  const color = accent === 'rust' ? 'var(--rust-soft)' : accent === 'gold' ? 'var(--gold-soft)' : 'var(--cream)';
  return (
    <div style={{ padding: '24px 30px', borderRight: '0.5px solid var(--line)' }}>
      <div className="eyebrow">{label}</div>
      <div className="h-display" style={{ fontSize: 48, color, marginTop: 6 }}>{value}</div>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 8, letterSpacing: '0.06em' }}>{sub}</div>
    </div>
  );
};

const SectionTitle = ({ title, sub, action, small }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: 16, gap: 16,
  }}>
    <div>
      <h2 className="h-display" style={{ fontSize: small ? 22 : 30, letterSpacing: '0.02em' }}>{title}</h2>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--fg-faint)', marginTop: 4 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

// ────────────────────────────────────────────────────────────
//   Filmstrip — horizontal phase frames
// ────────────────────────────────────────────────────────────

const Filmstrip = ({ phases }) => (
  <div style={{
    display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12,
  }}>
    {phases.map((p, i) => {
      const isActive = p.status === 'active';
      const isComplete = p.status === 'complete';
      return (
        <div key={p.id} style={{
          flex: '0 0 280px',
          background: 'var(--bg-1)',
          border: '0.5px solid ' + (isActive ? 'rgba(212,160,32,0.40)' : 'var(--line-strong)'),
          borderRadius: 8, overflow: 'hidden',
          position: 'relative',
          opacity: p.status === 'upcoming' ? 0.55 : 1,
        }}>
          {/* film perforation strip */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '6px 10px',
            background: 'var(--bg-0)',
            borderBottom: '0.5px solid var(--line)',
          }}>
            {[0,1,2,3,4,5,6].map(n => (
              <span key={n} style={{
                width: 6, height: 4, borderRadius: 1,
                background: 'var(--bg-3)',
              }} />
            ))}
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', letterSpacing: '0.12em' }}>PHASE {String(i + 1).padStart(2, '0')}</div>
              <StatusBadge status={p.status} />
            </div>
            <h4 className="h-display" style={{
              fontSize: 26, lineHeight: 1, letterSpacing: '0.02em',
              color: isComplete ? 'var(--fg-dim)' : 'var(--cream)',
            }}>{p.name}</h4>
            <div style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{p.summary}</div>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {p.milestones.map(m => (
                <div key={m.id} style={{
                  display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5,
                  color: m.status === 'upcoming' ? 'var(--fg-faint)' : 'var(--fg-dim)',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    border: '1.5px solid ' + (m.status === 'complete' ? 'var(--ok)' : m.status === 'active' ? 'var(--gold)' : 'var(--line-bright)'),
                    background: m.status === 'complete' ? 'var(--ok)' : 'transparent',
                  }} />
                  <span style={{ flex: 1 }}>{m.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)' }}>{m.date}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '6px 10px',
            background: 'var(--bg-0)',
            borderTop: '0.5px solid var(--line)',
          }}>
            {[0,1,2,3,4,5,6].map(n => (
              <span key={n} style={{ width: 6, height: 4, borderRadius: 1, background: 'var(--bg-3)' }} />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

// ────────────────────────────────────────────────────────────
//   Other Dock views
// ────────────────────────────────────────────────────────────

const DockClients = ({ nav }) => (
  <DockGenericPage eyebrow="Engagements" title={`${CLIENTS.length} clients`} sub="Filtered by active. Click any row to open project deep-dive.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
      {CLIENTS.map(c => (
        <button key={c.id} onClick={() => nav.goToClient(c.id)} className="clickable" style={{
          width: '100%', textAlign: 'left', padding: 18, border: '0.5px solid var(--line-strong)',
          background: 'var(--bg-1)', borderRadius: 8, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 6,
              background: 'linear-gradient(135deg, var(--bg-3) 0%, var(--bg-2) 100%)',
              border: '0.5px solid var(--line-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cream)', fontFamily: 'var(--font-display)', fontSize: 18,
            }}>{c.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>{c.industry}</div>
            </div>
            <StatusBadge status={c.flag} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-dim)', lineHeight: 1.5 }}>{c.project}</div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-faint)', marginBottom: 6 }}>
              <span>{c.phase}</span>
              <span className="mono tabular">{c.progress}%</span>
            </div>
            <div className="progress"><i style={{ width: `${c.progress}%` }} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '0.5px solid var(--line)', marginTop: 4 }}>
            <div className="avatar-stack">
              {c.assigned.slice(0, 3).map(id => {
                const s = STAFF.find(x => x.id === id);
                return <span key={id} className="avatar avatar--sm" title={s.name}>{s.initials}</span>;
              })}
            </div>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-faint)' }}>{c.activity}</span>
          </div>
        </button>
      ))}
    </div>
  </DockGenericPage>
);

const DockClient = ({ nav, client }) => {
  const tabs = [
    { id: 'overview',     label: 'Overview',     icon: 'home' },
    { id: 'milestones',   label: 'Timeline',     icon: 'flag' },
    { id: 'deliverables', label: 'Deliverables', icon: 'image' },
    { id: 'checklist',    label: 'Checklist',    icon: 'check' },
    { id: 'intake',       label: 'Onboarding',   icon: 'book' },
    { id: 'messages',     label: 'Messages',     icon: 'chat' },
    { id: 'contracts',    label: 'Contracts',    icon: 'sign' },
    { id: 'invoices',     label: 'Invoices',     icon: 'money' },
    { id: 'files',        label: 'Files',        icon: 'folder' },
    { id: 'analytics',    label: 'Analytics',    icon: 'bar' },
  ];
  return (
    <div className="fade-in-up">
      <Letterbox
        eyebrow={`${client.industry} · started ${client.startedAt}`}
        title={client.name}
        sub={client.project}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--ghost btn--sm"><Icon name="chat" size={13} /> Message</button>
            <button className="btn btn--ghost btn--sm"><Icon name="eye" size={13} /> As client</button>
          </div>
        }
      />
      <div style={{
        padding: '0 36px', borderBottom: '0.5px solid var(--line)',
        display: 'flex', gap: 0, overflowX: 'auto', background: 'var(--bg-1)',
      }}>
        {tabs.map(t => {
          const active = nav.clientTab === t.id;
          return (
            <button key={t.id} onClick={() => nav.setClientTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 16px', border: 0, background: 'transparent',
              color: active ? 'var(--cream)' : 'var(--fg-dim)',
              borderBottom: active ? '2px solid var(--rust)' : '2px solid transparent',
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}>
              <Icon name={t.icon} size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 36 }}>
        {nav.clientTab === 'overview'     && <DockOverview nav={nav} client={client} />}
        {nav.clientTab === 'milestones'   && <DockTimeline nav={nav} />}
        {nav.clientTab === 'deliverables' && <DeliverablesTab nav={nav} />}
        {nav.clientTab === 'checklist'    && <ChecklistTab nav={nav} />}
        {nav.clientTab === 'intake'       && <IntakeForm />}
        {nav.clientTab === 'messages'     && <div className="card"><div className="card-bd"><MessageThread messages={MESSAGES} /></div></div>}
        {nav.clientTab === 'contracts'    && <ContractsTab nav={nav} />}
        {nav.clientTab === 'invoices'     && <InvoicesTab nav={nav} />}
        {nav.clientTab === 'files'        && <FilesTab nav={nav} />}
        {nav.clientTab === 'analytics'    && <AnalyticsTab nav={nav} />}
      </div>
    </div>
  );
};

const DockOverview = ({ nav, client }) => {
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Hero metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <DockKPI label="Phase" value={client.phase} />
        <DockKPI label="Progress" value={`${client.progress}%`} />
        <DockKPI label="Target launch" value={client.targetLaunch} />
        <DockKPI label="Team" value={`${client.assigned.length} on shoot`} />
      </div>

      {pending.length > 0 && (
        <section>
          <SectionTitle small title="Pending your review" sub={`${pending.length} deliverable${pending.length === 1 ? '' : 's'}`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {pending.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} />)}
          </div>
        </section>
      )}

      <section>
        <SectionTitle small title="Timeline preview" action={<button className="btn btn--quiet btn--sm" onClick={() => nav.setClientTab('milestones')}>See full timeline <Icon name="arrowR" size={12} /></button>} />
        <Filmstrip phases={PHASES} />
      </section>

      <section>
        <SectionTitle small title="Recent activity" />
        <div className="card">
          {ACTIVITY.slice(0, 5).map((a, i) => (
            <div key={a.id} style={{
              display: 'flex', gap: 14, padding: '14px 20px', alignItems: 'center',
              borderBottom: i < 4 ? '0.5px solid var(--line)' : 'none',
            }}>
              <span className="avatar avatar--sm">{a.who.split(' ').map(w => w[0]).join('').slice(0,2)}</span>
              <div style={{ flex: 1, fontSize: 13 }}>
                <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{a.who}</span>
                <span style={{ color: 'var(--fg-dim)' }}> {a.action}</span>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{a.when}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const DockKPI = ({ label, value }) => (
  <div style={{
    background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)',
    borderRadius: 8, padding: 18,
  }}>
    <div className="eyebrow">{label}</div>
    <div className="h-display" style={{ fontSize: 28, marginTop: 6, letterSpacing: '0.02em' }}>{value}</div>
  </div>
);

const DockTimeline = ({ nav }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <Filmstrip phases={PHASES} />
    <MilestonesTab nav={nav} />
  </div>
);

const DockInbox = ({ nav }) => (
  <DockGenericPage title="Inbox" eyebrow="Conversations" sub="One thread per client. Reply directly or open the project to add context.">
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-hd">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="avatar">BD</span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--cream)' }}>Brookside Dental</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>Dr. Elena Brookside · Mara Reyes</div>
          </div>
        </div>
      </div>
      <div className="card-bd"><MessageThread messages={MESSAGES} height={520} /></div>
    </div>
  </DockGenericPage>
);

const DockApprovals = ({ nav }) => {
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  return (
    <DockGenericPage
      title={`${pending.length} pending`}
      eyebrow="Approvals queue"
      sub="Cross-client. Approve on behalf of the client only when you've verbalized sign-off.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {pending.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} />)}
      </div>
    </DockGenericPage>
  );
};

const DockReports = ({ nav }) => (
  <DockGenericPage title="Reports" eyebrow="Scheduled" sub={`${REPORTS_DUE.length} reports waiting to be built and sent.`}>
    <div className="card">
      {REPORTS_DUE.map((r, i) => (
        <div key={r.id} style={{
          display: 'grid', gridTemplateColumns: '70px 1fr 1fr 110px', gap: 14,
          alignItems: 'center', padding: '14px 18px',
          borderBottom: i < REPORTS_DUE.length - 1 ? '0.5px solid var(--line)' : 'none',
        }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--cream)', background: 'var(--bg-3)', padding: '4px 8px', borderRadius: 3, textAlign: 'center' }}>{r.due}</span>
          <div style={{ fontSize: 13, color: 'var(--cream)' }}>{r.kind}</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-dim)' }}>{r.client}</div>
          <button className="btn btn--ghost btn--sm">Build <Icon name="arrowR" size={12} /></button>
        </div>
      ))}
    </div>
  </DockGenericPage>
);

const DockActivity = ({ nav }) => (
  <DockGenericPage title="Activity" eyebrow="Audit trail" sub="Every event across every client.">
    <div className="card">
      {ACTIVITY.map((a, i) => (
        <div key={a.id} style={{
          display: 'grid', gridTemplateColumns: '90px 1fr 70px', gap: 14,
          alignItems: 'center', padding: '12px 20px',
          borderBottom: i < ACTIVITY.length - 1 ? '0.5px solid var(--line)' : 'none',
        }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.04em' }}>{a.when}</span>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{a.who}</span>
            <span style={{ color: 'var(--fg-dim)' }}> {a.action}</span>
          </div>
          <span className="mono" style={{
            fontSize: 9.5, padding: '2px 6px', borderRadius: 2,
            background: 'var(--bg-3)', color: 'var(--fg-dim)',
            textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>{a.kind}</span>
        </div>
      ))}
    </div>
  </DockGenericPage>
);

Object.assign(window, { DockLayout });
