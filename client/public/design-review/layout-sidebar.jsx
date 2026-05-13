// layout-sidebar.jsx
// Direction 1: SIDEBAR CLASSIC
// Left sidebar nav. Cards. Bebas headings + Montserrat body. The
// production-ready, "Awaken-brand-default" baseline. Looks like a polished
// SaaS but in Awaken's cinematic-dark dress.

const SidebarLayout = ({ nav }) => {
  const c = CLIENTS.find(x => x.id === nav.clientId);
  const items = [
    { id: 'dashboard',  label: 'Dashboard',  icon: 'home',     view: 'dashboard' },
    { id: 'clients',    label: 'Clients',    icon: 'clients',  view: 'clients', count: CLIENTS.length },
    { id: 'approvals',  label: 'Approvals',  icon: 'check',    view: 'approvals', accent: true,
      count: nav.deliverables.filter(d => d.status === 'pending').length },
    { id: 'inbox',      label: 'Inbox',      icon: 'inbox',    view: 'inbox',
      count: CLIENTS.reduce((a, b) => a + b.unread, 0) },
    { id: 'reports',    label: 'Reports',    icon: 'bar',      view: 'reports', count: REPORTS_DUE.length },
    { id: 'files',      label: 'Files',      icon: 'folder',   view: 'files' },
    { id: 'activity',   label: 'Activity',   icon: 'activity', view: 'activity' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '244px 1fr', minHeight: '100vh' }}>
      {/* ─── Sidebar ─── */}
      <aside style={{
        background: 'var(--bg-1)',
        borderRight: '0.5px solid var(--line)',
        padding: '22px 14px',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '0 8px 24px' }}>
          <AwakenLockup size={28} />
          <div style={{
            fontSize: 10, color: 'var(--fg-faint)', letterSpacing: '0.22em',
            textTransform: 'uppercase', marginTop: 14, paddingLeft: 2,
          }}>Agency · Duo Portal</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(it => {
            const active = nav.view === it.view;
            return (
              <button key={it.id}
                      onClick={() => nav.setView(it.view)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 10px', borderRadius: 6,
                        background: active ? 'var(--bg-3)' : 'transparent',
                        color: active ? 'var(--cream)' : 'var(--fg-dim)',
                        border: 'none', textAlign: 'left', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                        position: 'relative',
                      }}>
                {active && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 2, background: 'var(--rust)', borderRadius: 2 }} />}
                <Icon name={it.icon} size={15} />
                <span style={{ flex: 1 }}>{it.label}</span>
                {typeof it.count === 'number' && it.count > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    padding: '1px 6px', borderRadius: 999,
                    background: it.accent ? 'var(--rust)' : 'var(--bg-4)',
                    color: it.accent ? '#fff' : 'var(--fg-dim)',
                    border: it.accent ? 0 : '0.5px solid var(--line-strong)',
                  }}>{it.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pinned clients */}
        <div style={{ marginTop: 28 }}>
          <div className="eyebrow" style={{ padding: '0 10px 10px' }}>Pinned</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CLIENTS.slice(0, 3).map(cl => {
              const active = nav.view === 'client' && nav.clientId === cl.id;
              return (
                <button key={cl.id}
                        onClick={() => nav.goToClient(cl.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 10px', borderRadius: 6,
                          background: active ? 'var(--bg-3)' : 'transparent',
                          border: 'none', textAlign: 'left', cursor: 'pointer',
                          color: active ? 'var(--cream)' : 'var(--fg-dim)',
                          fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500,
                        }}>
                  <span className="avatar avatar--sm" style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line-strong)' }}>{cl.initials}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cl.name}</span>
                  {cl.flag === 'action' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rust)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer / user */}
        <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: '0.5px solid var(--line)',
                       display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar" style={{ background: 'var(--rust)', color: '#fff' }}>JC</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 600 }}>Jordan Cole</div>
            <div style={{ fontSize: 10.5, color: 'var(--fg-faint)' }}>Creative Director</div>
          </div>
          <button className="btn btn--icon btn--quiet"><Icon name="settings" size={15} /></button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main style={{ background: 'var(--bg-0)', minWidth: 0 }}>
        <SidebarTopBar nav={nav} client={c} />
        <div style={{ padding: 'var(--pad-xl)' }}>
          {nav.view === 'dashboard' && <DashboardView nav={nav} />}
          {nav.view === 'clients'   && <ClientsView nav={nav} />}
          {nav.view === 'client'    && <ClientDetailView nav={nav} client={c} />}
          {nav.view === 'inbox'     && <InboxView nav={nav} />}
          {nav.view === 'approvals' && <ApprovalsView nav={nav} />}
          {nav.view === 'reports'   && <ReportsView nav={nav} />}
          {nav.view === 'files'     && <AllFilesView nav={nav} />}
          {nav.view === 'activity'  && <ActivityView nav={nav} />}
        </div>
      </main>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Top bar (breadcrumb + search + bell + new project)
// ────────────────────────────────────────────────────────────

const SidebarTopBar = ({ nav, client }) => {
  const crumb = (() => {
    if (nav.view === 'client' && client) return [{ label: 'Clients', view: 'clients' }, { label: client.name }];
    return [{ label: { dashboard: 'Dashboard', clients: 'Clients', inbox: 'Inbox',
                       approvals: 'Approvals', reports: 'Reports', files: 'Files',
                       activity: 'Activity' }[nav.view] || 'Dashboard' }];
  })();

  return (
    <div style={{
      height: 60, padding: '0 var(--pad-xl)', borderBottom: '0.5px solid var(--line)',
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'var(--bg-0)', position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {crumb.map((c, i) => (
          <React.Fragment key={i}>
            {c.view ? (
              <button onClick={() => nav.setView(c.view)} style={{
                background: 'none', border: 0, padding: 0, color: 'var(--fg-faint)', cursor: 'pointer',
                fontSize: 13, fontFamily: 'inherit',
              }}>{c.label}</button>
            ) : (
              <span style={{ color: i === 0 ? 'var(--cream)' : 'var(--cream)', fontWeight: 500 }}>{c.label}</span>
            )}
            {i < crumb.length - 1 && <Icon name="chevR" size={12} stroke={1.4} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ flex: 1, maxWidth: 380, marginLeft: 24, position: 'relative' }}>
        <Icon name="search" size={14} />
        <input className="input" placeholder="Search clients, deliverables, files…"
               style={{
                 background: 'var(--bg-1)', paddingLeft: 32, fontSize: 12.5,
                 borderColor: 'var(--line)',
               }} />
        <div style={{ position: 'absolute', left: 10, top: 11, color: 'var(--fg-mute)' }}>
          <Icon name="search" size={14} />
        </div>
        <span className="mono" style={{
          position: 'absolute', right: 10, top: 9, fontSize: 10,
          color: 'var(--fg-mute)', background: 'var(--bg-3)',
          padding: '2px 6px', borderRadius: 3, border: '0.5px solid var(--line-strong)',
        }}>⌘K</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn btn--ghost btn--sm"><Icon name="plus" size={13} /> New project</button>
        <button className="btn btn--icon btn--quiet" style={{ position: 'relative' }}>
          <Icon name="bell" />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--rust)' }} />
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Dashboard — agency command center
// ────────────────────────────────────────────────────────────

const DashboardView = ({ nav }) => {
  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-lg)' }}>
      {/* Hero header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div className="eyebrow eyebrow--rust">Wednesday · May 13</div>
          <h1 className="h-display" style={{ fontSize: 56, marginTop: 6 }}>Good afternoon, Jordan.</h1>
          <p style={{ color: 'var(--fg-dim)', maxWidth: 560, marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
            Three things need you today. Two clients are waiting on your team.
            One report goes out tomorrow.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost"><Icon name="calendar" size={14} /> This week</button>
          <button className="btn btn--primary"><Icon name="plus" size={14} /> New project</button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Needs your action" value={ACTION_ITEMS.length} accent="rust" hint="2 high priority" />
        <StatCard label="Waiting on clients" value={WAITING_ON_CLIENT.length} accent="gold" hint="Avg age: 3 days" />
        <StatCard label="Milestones this week" value={UPCOMING_MILESTONES.length} accent="cream" hint="2 launches scheduled" />
        <StatCard label="Reports due" value={REPORTS_DUE.length} accent="cream" hint="Next: Cedarcraft · May 14" />
      </div>

      {/* Two-column work area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--pad-lg)' }}>
        {/* Action items + waiting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-lg)' }}>
          <div className="card">
            <div className="card-hd">
              <h3>Needs your action</h3>
              <button className="btn btn--quiet btn--sm">View all <Icon name="chevR" size={12} /></button>
            </div>
            <div>
              {ACTION_ITEMS.map((a, i) => (
                <div key={a.id} className="clickable" style={{
                  display: 'grid', gridTemplateColumns: '12px 1fr 100px 80px 16px',
                  gap: 14, alignItems: 'center', padding: '14px 18px',
                  borderBottom: i < ACTION_ITEMS.length - 1 ? '0.5px solid var(--line)' : 'none',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: a.priority === 'high' ? 'var(--rust)' :
                                a.priority === 'medium' ? 'var(--gold)' : 'var(--fg-mute)',
                  }} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>{a.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>{a.client}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.04em' }}>
                    {a.priority}
                  </span>
                  <span style={{ fontSize: 12, color: a.due === 'today' ? 'var(--rust-soft)' : 'var(--fg-faint)' }}>
                    {a.due}
                  </span>
                  <Icon name="chevR" size={13} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <h3>Waiting on clients</h3>
              <button className="btn btn--quiet btn--sm">Send reminders <Icon name="bell" size={12} /></button>
            </div>
            <div>
              {WAITING_ON_CLIENT.map((w, i) => (
                <div key={w.id} className="clickable" style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 90px',
                  gap: 14, alignItems: 'center', padding: '14px 18px',
                  borderBottom: i < WAITING_ON_CLIENT.length - 1 ? '0.5px solid var(--line)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>{w.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>{w.client}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--gold-soft)' }}>{w.age}</span>
                  <button className="btn btn--sm btn--ghost">Nudge</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-lg)' }}>
          <div className="card">
            <div className="card-hd"><h3>Upcoming this week</h3></div>
            <div style={{ padding: '4px 0' }}>
              {UPCOMING_MILESTONES.map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '12px 18px',
                  borderBottom: i < UPCOMING_MILESTONES.length - 1 ? '0.5px solid var(--line)' : 'none',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 22,
                    color: 'var(--cream)', lineHeight: 1, paddingTop: 1,
                    minWidth: 54, letterSpacing: '0.02em',
                  }}>{m.date.split(' ')[1]}<span style={{ fontSize: 10, color: 'var(--fg-faint)', marginLeft: 4, letterSpacing: '0.1em' }}>{m.date.split(' ')[0]}</span></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--cream)' }}>{m.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>{m.client}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><h3>Reports due</h3></div>
            <div>
              {REPORTS_DUE.map((r, i) => (
                <div key={r.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px',
                  gap: 12, alignItems: 'center', padding: '12px 18px',
                  borderBottom: i < REPORTS_DUE.length - 1 ? '0.5px solid var(--line)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--cream)' }}>{r.kind}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>{r.client}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{r.due}</span>
                </div>
              ))}
            </div>
          </div>

          {nav.showActivity && (
            <div className="card">
              <div className="card-hd"><h3>Activity</h3></div>
              <div style={{ padding: '4px 0' }}>
                {ACTIVITY.slice(0, 5).map((a, i) => (
                  <div key={a.id} style={{
                    display: 'flex', gap: 12, padding: '10px 18px', alignItems: 'flex-start',
                    fontSize: 12.5,
                  }}>
                    <span className="avatar avatar--sm" style={{ marginTop: 1 }}>
                      {a.who.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </span>
                    <div style={{ flex: 1, lineHeight: 1.45 }}>
                      <div style={{ color: 'var(--fg-dim)' }}>
                        <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{a.who}</span> {a.action}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 2 }}>{a.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, accent, hint }) => {
  const color = accent === 'rust' ? 'var(--rust-soft)' :
                accent === 'gold' ? 'var(--gold-soft)' : 'var(--cream)';
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="eyebrow" style={{ color: 'var(--fg-faint)' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 52, letterSpacing: '0.01em',
        color, marginTop: 6, lineHeight: 1,
      }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-dim)', marginTop: 12 }}>{hint}</div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Clients list
// ────────────────────────────────────────────────────────────

const ClientsView = ({ nav }) => {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const filtered = CLIENTS.filter(c => {
    if (filter !== 'all' && c.flag !== filter) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="eyebrow">Active engagements</div>
          <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>Clients</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost"><Icon name="filter" size={14} /> Filters</button>
          <button className="btn btn--primary"><Icon name="plus" size={14} /> Add client</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6, padding: 2 }}>
          {[
            { id: 'all', label: 'All', n: CLIENTS.length },
            { id: 'action', label: 'Needs action', n: CLIENTS.filter(c => c.flag === 'action').length },
            { id: 'waiting', label: 'Waiting on client', n: CLIENTS.filter(c => c.flag === 'waiting').length },
            { id: 'onboarding', label: 'Onboarding', n: CLIENTS.filter(c => c.flag === 'onboarding').length },
            { id: 'on-track', label: 'On track', n: CLIENTS.filter(c => c.flag === 'on-track').length },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 12px', borderRadius: 4, border: 0, cursor: 'pointer',
              background: filter === f.id ? 'var(--bg-3)' : 'transparent',
              color: filter === f.id ? 'var(--cream)' : 'var(--fg-dim)',
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
            }}>{f.label} <span style={{ color: 'var(--fg-faint)', marginLeft: 4 }}>{f.n}</span></button>
          ))}
        </div>
        <input className="input" placeholder="Search clients…"
               style={{ maxWidth: 260, background: 'var(--bg-1)' }}
               value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="card">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr 110px 100px 120px 28px',
          gap: 14, padding: '12px 20px',
          borderBottom: '0.5px solid var(--line)',
          fontSize: 10.5, color: 'var(--fg-faint)', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <div>Client</div>
          <div>Project</div>
          <div>Phase</div>
          <div>Progress</div>
          <div>Status</div>
          <div>Last activity</div>
          <div />
        </div>
        {filtered.map((c, i) => (
          <div key={c.id} className="clickable" onClick={() => nav.goToClient(c.id)} style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr 1fr 110px 100px 120px 28px',
            gap: 14, padding: '14px 20px', alignItems: 'center',
            borderBottom: i < filtered.length - 1 ? '0.5px solid var(--line)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="avatar" style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line-strong)' }}>{c.initials}</span>
              <div>
                <div style={{ fontSize: 13.5, color: 'var(--cream)', fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{c.industry}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-dim)' }}>{c.project}</div>
            <PhaseChip name={c.phase} active />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="progress"><i style={{ width: `${c.progress}%` }} /></div>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-faint)' }}>{c.progress}%</span>
            </div>
            <StatusBadge status={c.flag} />
            <div style={{ fontSize: 12, color: 'var(--fg-faint)' }}>{c.activity}</div>
            <Icon name="chevR" size={14} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Client detail (deep dive)
// ────────────────────────────────────────────────────────────

const ClientDetailView = ({ nav, client }) => {
  const tabs = [
    { id: 'overview',   label: 'Overview',     icon: 'home' },
    { id: 'milestones', label: 'Milestones',   icon: 'flag' },
    { id: 'deliverables', label: 'Deliverables', icon: 'image' },
    { id: 'checklist',  label: 'Checklist',    icon: 'check' },
    { id: 'intake',     label: 'Onboarding',   icon: 'book' },
    { id: 'messages',   label: 'Messages',     icon: 'chat' },
    { id: 'contracts',  label: 'Contracts',    icon: 'sign' },
    { id: 'invoices',   label: 'Invoices',     icon: 'money' },
    { id: 'files',      label: 'Files',        icon: 'folder' },
    { id: 'analytics',  label: 'Analytics',    icon: 'bar' },
  ];

  return (
    <div className="fade-in-up">
      {/* Client header */}
      <div style={{
        display: 'flex', gap: 24, alignItems: 'flex-start',
        paddingBottom: 24, marginBottom: 24,
        borderBottom: '0.5px solid var(--line)',
      }}>
        <span className="avatar avatar--xl" style={{
          background: 'linear-gradient(135deg, var(--rust) 0%, var(--rust-deep) 100%)', color: '#fff', border: 0,
        }}>{client.initials}</span>
        <div style={{ flex: 1 }}>
          <div className="eyebrow eyebrow--rust">{client.industry}</div>
          <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>{client.name}</h1>
          <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12.5, color: 'var(--fg-dim)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span><Icon name="folder" size={13} /> {client.project}</span>
            <span style={{ width: 1, height: 12, background: 'var(--line-bright)' }} />
            <span>Started {client.startedAt}</span>
            <span style={{ width: 1, height: 12, background: 'var(--line-bright)' }} />
            <span>Target launch <b style={{ color: 'var(--cream)' }}>{client.targetLaunch}</b></span>
            <span style={{ width: 1, height: 12, background: 'var(--line-bright)' }} />
            <span>Lead {client.contact.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="eyebrow">Project progress</span>
                <span className="mono tabular" style={{ fontSize: 11, color: 'var(--cream)' }}>{client.progress}%</span>
              </div>
              <div className="progress"><i style={{ width: `${client.progress}%` }} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="eyebrow" style={{ marginRight: 4 }}>Team</span>
              <div className="avatar-stack">
                {client.assigned.map(id => {
                  const s = STAFF.find(x => x.id === id);
                  return <span key={id} className="avatar avatar--sm" title={s.name}>{s.initials}</span>;
                })}
                <button className="avatar avatar--sm" style={{ background: 'var(--bg-3)', cursor: 'pointer' }}><Icon name="plus" size={10} /></button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost"><Icon name="chat" size={14} /> Message</button>
          <button className="btn btn--ghost"><Icon name="eye" size={14} /> View as client</button>
          <button className="btn btn--icon btn--quiet"><Icon name="settings" size={15} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 24,
        borderBottom: '0.5px solid var(--line)',
        overflowX: 'auto',
      }}>
        {tabs.map(t => {
          const active = nav.clientTab === t.id;
          return (
            <button key={t.id} onClick={() => nav.setClientTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', border: 0, background: 'transparent',
              color: active ? 'var(--cream)' : 'var(--fg-dim)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              borderBottom: active ? '2px solid var(--rust)' : '2px solid transparent',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}>
              <Icon name={t.icon} size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {nav.clientTab === 'overview'     && <OverviewTab nav={nav} client={client} />}
      {nav.clientTab === 'milestones'   && <MilestonesTab nav={nav} />}
      {nav.clientTab === 'deliverables' && <DeliverablesTab nav={nav} />}
      {nav.clientTab === 'checklist'    && <ChecklistTab nav={nav} />}
      {nav.clientTab === 'intake'       && <IntakeForm />}
      {nav.clientTab === 'messages'     && (
        <div className="card"><div className="card-bd"><MessageThread messages={MESSAGES} /></div></div>
      )}
      {nav.clientTab === 'contracts'    && <ContractsTab nav={nav} />}
      {nav.clientTab === 'invoices'     && <InvoicesTab nav={nav} />}
      {nav.clientTab === 'files'        && <FilesTab nav={nav} />}
      {nav.clientTab === 'analytics'    && <AnalyticsTab nav={nav} />}
    </div>
  );
};

// ─── Tab: Overview ───

const OverviewTab = ({ nav, client }) => {
  const activePhase = PHASES.find(p => p.status === 'active');
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pad-lg)' }}>
      <div className="card">
        <div className="card-hd"><h3>Pending your review</h3><StatusBadge status="pending" /></div>
        <div className="card-bd" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {pending.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} compact />)}
          {pending.length === 0 && <div style={{ color: 'var(--fg-faint)', fontSize: 13 }}>No pending deliverables.</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><h3>Current phase · {activePhase?.name}</h3>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{activePhase?.startedAt} → ongoing</span>
        </div>
        <div className="card-bd">
          <p style={{ color: 'var(--fg-dim)', fontSize: 13.5, lineHeight: 1.6, marginTop: 0, marginBottom: 16 }}>{activePhase?.summary}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activePhase?.milestones.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 4,
                background: m.status === 'active' ? 'rgba(212,160,32,0.08)' : 'transparent',
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '1.5px solid ' + (m.status === 'complete' ? 'var(--ok)' :
                                            m.status === 'active' ? 'var(--gold)' : 'var(--line-bright)'),
                  background: m.status === 'complete' ? 'var(--ok)' : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.status === 'complete' && <Icon name="check" size={8} stroke={3} />}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: m.status === 'upcoming' ? 'var(--fg-faint)' : 'var(--cream)' }}>{m.name}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-hd"><h3>Recent activity</h3></div>
        <div className="card-bd" style={{ padding: 0 }}>
          {ACTIVITY.map((a, i) => (
            <div key={a.id} style={{
              display: 'flex', gap: 14, padding: '12px 20px', alignItems: 'flex-start',
              borderBottom: i < ACTIVITY.length - 1 ? '0.5px solid var(--line)' : 'none',
            }}>
              <span className="avatar avatar--sm">{a.who.split(' ').map(w => w[0]).join('').slice(0,2)}</span>
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{a.who}</span>
                <span style={{ color: 'var(--fg-dim)' }}> {a.action}</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>{a.when}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Milestones ───

const MilestonesTab = ({ nav }) => (
  <div className="card">
    <div className="card-hd"><h3>Project timeline</h3>
      <span style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>
        {PHASES.filter(p => p.status === 'complete').length} of {PHASES.length} phases complete
      </span>
    </div>
    <div className="card-bd">
      {PHASES.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', gap: 18, paddingBottom: i < PHASES.length - 1 ? 22 : 0 }}>
          <div style={{ width: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              width: 26, height: 26, borderRadius: '50%',
              background: p.status === 'complete' ? 'var(--ok)' :
                          p.status === 'active' ? 'var(--gold)' : 'transparent',
              border: '1.5px solid ' + (p.status === 'complete' ? 'var(--ok)' :
                                        p.status === 'active' ? 'var(--gold)' : 'var(--line-bright)'),
              color: p.status === 'complete' || p.status === 'active' ? '#0a0a0a' : 'var(--fg-faint)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {p.status === 'complete' ? <Icon name="check" size={12} stroke={3} /> : i + 1}
            </span>
            {i < PHASES.length - 1 && (
              <div style={{ width: 1, flex: 1, background: 'var(--line-strong)', marginTop: 6, minHeight: 60 }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
              <h4 className="h-display" style={{ fontSize: 22, color: p.status === 'upcoming' ? 'var(--fg-faint)' : 'var(--cream)' }}>{p.name}</h4>
              <StatusBadge status={p.status} />
              <span style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginLeft: 'auto' }}>
                {p.startedAt && <>{p.startedAt}{p.completedAt && ` → ${p.completedAt}`}</>}
              </span>
            </div>
            <p style={{ color: 'var(--fg-dim)', fontSize: 13, margin: '0 0 12px' }}>{p.summary}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {p.milestones.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 4,
                  background: m.status === 'active' ? 'rgba(212,160,32,0.08)' : 'transparent',
                  border: m.status === 'active' ? '0.5px solid rgba(212,160,32,0.30)' : '0.5px solid transparent',
                }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    border: '1.5px solid ' + (m.status === 'complete' ? 'var(--ok)' :
                                              m.status === 'active' ? 'var(--gold)' : 'var(--line-bright)'),
                    background: m.status === 'complete' ? 'var(--ok)' : 'transparent',
                  }} />
                  <span style={{ flex: 1, fontSize: 13, color: m.status === 'upcoming' ? 'var(--fg-faint)' : 'var(--cream)' }}>{m.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{m.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DeliverablesTab = ({ nav }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: 0, color: 'var(--cream)' }}>Deliverables</h3>
        <StatusBadge status="pending" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn--ghost btn--sm"><Icon name="filter" size={13} /> All statuses</button>
        <button className="btn btn--primary btn--sm"><Icon name="plus" size={13} /> Submit for review</button>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
      {nav.deliverables.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} />)}
    </div>
  </div>
);

const ChecklistTab = ({ nav }) => {
  const [items, setItems] = useState(CHECKLIST);
  const onAction = (item, action) => {
    setItems(list => list.map(x => x.id === item.id
      ? { ...x, status: action === 'approve' ? 'approved' : 'changes-requested' }
      : x));
    window.toast?.(action === 'approve' ? `Approved "${item.label}"` : 'Changes requested', action === 'approve' ? 'ok' : 'rust');
  };
  const remaining = items.filter(i => i.status === 'awaiting' || i.status === 'changes-requested').length;
  return (
    <div className="card">
      <div className="card-hd">
        <h3>What we need from {CLIENTS[0].contact.name.split(' ')[0]}</h3>
        <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{remaining} of {items.length} outstanding</span>
      </div>
      <div className="card-bd">
        {items.map(item => <ChecklistRow key={item.id} item={item} onAction={onAction} />)}
        <button className="btn btn--ghost" style={{ marginTop: 16 }}>
          <Icon name="plus" size={13} /> Add checklist item
        </button>
      </div>
    </div>
  );
};

const ContractsTab = ({ nav }) => (
  <div className="card">
    <div className="card-hd"><h3>Contracts</h3>
      <button className="btn btn--ghost btn--sm"><Icon name="upload" size={13} /> Upload contract</button>
    </div>
    <div>
      {nav.contracts.map((c, i) => (
        <div key={c.id} style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 130px 100px 110px',
          gap: 14, alignItems: 'center', padding: '14px 18px',
          borderBottom: i < nav.contracts.length - 1 ? '0.5px solid var(--line)' : 'none',
        }}>
          <Icon name="sign" size={18} />
          <div>
            <div style={{ fontSize: 13.5, color: 'var(--cream)', fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>
              {c.status === 'signed' ? `Signed by ${c.signedBy} · ${c.signedAt}` : `Sent ${c.sentAt}`}
            </div>
          </div>
          <StatusBadge status={c.status} />
          <span style={{ fontSize: 12, color: 'var(--fg-faint)' }}>{c.signedAt || c.sentAt}</span>
          {c.status === 'pending'
            ? <button className="btn btn--primary btn--sm" onClick={() => nav.openContract(c)}>Open & sign</button>
            : <button className="btn btn--ghost btn--sm"><Icon name="download" size={13} /> PDF</button>}
        </div>
      ))}
    </div>
  </div>
);

const InvoicesTab = ({ nav }) => {
  const total = INVOICES.reduce((a, b) => a + b.amount, 0);
  const paid = INVOICES.filter(i => i.status === 'paid').reduce((a, b) => a + b.amount, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--pad-lg)' }}>
      <div className="card">
        <div className="card-hd"><h3>Invoices</h3>
          <span style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>Synced with QuickBooks · 3m ago</span>
        </div>
        <div>
          {INVOICES.map((inv, i) => (
            <div key={inv.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 32px',
              gap: 14, alignItems: 'center', padding: '14px 18px',
              borderBottom: i < INVOICES.length - 1 ? '0.5px solid var(--line)' : 'none',
            }}>
              <div>
                <div className="mono" style={{ fontSize: 12.5, color: 'var(--cream)' }}>{inv.num}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>Issued {inv.issued}</div>
              </div>
              <div className="mono tabular" style={{ fontSize: 14, color: 'var(--cream)' }}>${inv.amount.toLocaleString()}</div>
              <StatusBadge status={inv.status} />
              <span style={{ fontSize: 12, color: 'var(--fg-faint)' }}>{inv.paid || '—'}</span>
              <Icon name="download" size={14} />
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><h3>Totals</h3></div>
        <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="eyebrow">Invoiced</div>
            <div className="h-display" style={{ fontSize: 36, marginTop: 4 }}>${total.toLocaleString()}</div>
          </div>
          <div className="divider" />
          <div>
            <div className="eyebrow">Paid</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ok)', marginTop: 4 }}>${paid.toLocaleString()}</div>
          </div>
          <div className="divider" />
          <div>
            <div className="eyebrow">Outstanding</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gold-soft)', marginTop: 4 }}>${(total-paid).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilesTab = ({ nav }) => {
  const [mode, setMode] = useState('grid');
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: 0, color: 'var(--cream)' }}>Files</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6, padding: 2 }}>
            <button className={`btn btn--icon btn--sm`} style={{ background: mode === 'grid' ? 'var(--bg-3)' : 'transparent', color: mode === 'grid' ? 'var(--cream)' : 'var(--fg-dim)' }} onClick={() => setMode('grid')}><Icon name="grid" size={14} /></button>
            <button className={`btn btn--icon btn--sm`} style={{ background: mode === 'list' ? 'var(--bg-3)' : 'transparent', color: mode === 'list' ? 'var(--cream)' : 'var(--fg-dim)' }} onClick={() => setMode('list')}><Icon name="list" size={14} /></button>
          </div>
          <button className="btn btn--primary btn--sm"><Icon name="upload" size={13} /> Upload</button>
        </div>
      </div>
      <DropZone />
      <div style={{ marginTop: 18 }}>
        <FileGrid files={FILES} mode={mode} />
      </div>
    </div>
  );
};

const AnalyticsTab = ({ nav }) => (
  <div className="card">
    <div className="card-hd"><h3>Connected accounts</h3>
      <span style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>Tracking IDs and ad accounts</span>
    </div>
    <div>
      {ANALYTICS_IDS.map((a, i) => (
        <div key={a.id} style={{
          display: 'grid', gridTemplateColumns: '50px 1fr 200px 130px 120px',
          gap: 14, alignItems: 'center', padding: '14px 18px',
          borderBottom: i < ANALYTICS_IDS.length - 1 ? '0.5px solid var(--line)' : 'none',
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 6,
            background: 'var(--bg-2)', border: '0.5px solid var(--line-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
            color: 'var(--fg-dim)', letterSpacing: '0.04em',
          }}>{a.icon}</span>
          <div>
            <div style={{ fontSize: 13.5, color: 'var(--cream)', fontWeight: 600 }}>{a.label}</div>
          </div>
          <span className="mono" style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{a.value}</span>
          <StatusBadge status={a.status} />
          <button className="btn btn--ghost btn--sm">
            {a.status === 'connected' ? 'Manage' : a.status === 'pending' ? 'Resend invite' : 'Connect'}
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//   Misc top-level views
// ────────────────────────────────────────────────────────────

const InboxView = ({ nav }) => (
  <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--pad-lg)' }}>
    <div className="card" style={{ alignSelf: 'start' }}>
      <div className="card-hd"><h3>Threads</h3>
        <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{CLIENTS.filter(c => c.unread).length} unread</span>
      </div>
      <div>
        {CLIENTS.map((c, i) => (
          <button key={c.id} onClick={() => nav.goToClient(c.id, 'messages')} style={{
            width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: '12px 18px', border: 0,
            background: c.id === 'brookside' ? 'var(--bg-2)' : 'transparent',
            cursor: 'pointer', textAlign: 'left',
            borderBottom: i < CLIENTS.length - 1 ? '0.5px solid var(--line)' : 'none',
          }}>
            <span className="avatar" style={{ background: 'var(--bg-3)' }}>{c.initials}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: 10.5, color: 'var(--fg-faint)' }}>{c.activity}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-dim)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.contact.name}
              </div>
            </div>
            {c.unread > 0 && (
              <span style={{
                background: 'var(--rust)', color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '2px 6px', borderRadius: 999, alignSelf: 'center',
              }}>{c.unread}</span>
            )}
          </button>
        ))}
      </div>
    </div>
    <div className="card">
      <div className="card-hd">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="avatar" style={{ background: 'var(--bg-3)' }}>BD</span>
          <div>
            <div style={{ fontSize: 14, color: 'var(--cream)', fontWeight: 600 }}>Brookside Dental</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>Dr. Elena Brookside · Mara Reyes</div>
          </div>
        </div>
        <button className="btn btn--quiet btn--icon"><Icon name="settings" /></button>
      </div>
      <div className="card-bd"><MessageThread messages={MESSAGES} height={520} /></div>
    </div>
  </div>
);

const ApprovalsView = ({ nav }) => {
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow eyebrow--rust">Cross-client</div>
        <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>Approvals queue</h1>
        <p style={{ color: 'var(--fg-dim)', fontSize: 14, maxWidth: 580, marginTop: 8 }}>
          {pending.length} deliverable{pending.length === 1 ? '' : 's'} waiting on a client decision.
          Approve on their behalf if you've already verbalized sign-off.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {pending.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} />)}
        {pending.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: 'var(--fg-faint)' }}>
            <div className="h-display" style={{ fontSize: 32, color: 'var(--fg-dim)' }}>Inbox zero.</div>
            <p style={{ marginTop: 10 }}>No deliverables pending review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ReportsView = ({ nav }) => (
  <div className="fade-in-up">
    <div style={{ marginBottom: 24 }}>
      <div className="eyebrow">Scheduled</div>
      <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>Reports</h1>
    </div>
    <div className="card">
      <div>
        {REPORTS_DUE.map((r, i) => (
          <div key={r.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 100px 130px',
            gap: 14, alignItems: 'center', padding: '14px 18px',
            borderBottom: i < REPORTS_DUE.length - 1 ? '0.5px solid var(--line)' : 'none',
          }}>
            <div style={{ fontSize: 13.5, color: 'var(--cream)' }}>{r.kind}</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-dim)' }}>{r.client}</div>
            <div style={{ fontSize: 12, color: 'var(--gold-soft)' }}>Due {r.due}</div>
            <button className="btn btn--ghost btn--sm">Build report <Icon name="arrowR" size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AllFilesView = ({ nav }) => (
  <div className="fade-in-up">
    <h1 className="h-display" style={{ fontSize: 44, marginBottom: 24 }}>Files</h1>
    <FileGrid files={FILES} />
  </div>
);

const ActivityView = ({ nav }) => (
  <div className="fade-in-up">
    <h1 className="h-display" style={{ fontSize: 44, marginBottom: 24 }}>Activity</h1>
    <div className="card">
      {ACTIVITY.map((a, i) => (
        <div key={a.id} style={{
          display: 'flex', gap: 14, padding: '14px 20px', alignItems: 'flex-start',
          borderBottom: i < ACTIVITY.length - 1 ? '0.5px solid var(--line)' : 'none',
        }}>
          <span className="avatar">{a.who.split(' ').map(w => w[0]).join('').slice(0,2)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5 }}>
              <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{a.who}</span>
              <span style={{ color: 'var(--fg-dim)' }}> {a.action}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 4 }}>{a.when}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, {
  SidebarLayout,
  // re-exported for other layouts to reuse
  StatCard, MilestonesTab, DeliverablesTab, ChecklistTab,
  ContractsTab, InvoicesTab, FilesTab, AnalyticsTab, OverviewTab,
});
