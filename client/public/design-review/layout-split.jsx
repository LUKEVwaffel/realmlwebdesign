// layout-split.jsx
// Direction 5: SPLIT WORKSPACE
// Linear / Things-style three-pane: nav rail · master list · detail.
// Density first. All Montserrat (no Bebas) — sans-serif throughout for a
// tighter, more "operational" feel. Keyboard-friendly markers.

const { useState: useStateSp } = React;

const SplitLayout = ({ nav }) => {
  const c = CLIENTS.find(x => x.id === nav.clientId);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '212px 320px 1fr', minHeight: '100vh', background: 'var(--bg-1)' }}>
      <SplitNav nav={nav} />
      <SplitMaster nav={nav} client={c} />
      <main style={{ background: 'var(--bg-0)', minWidth: 0, overflowY: 'auto', maxHeight: '100vh' }}>
        <SplitDetail nav={nav} client={c} />
      </main>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Left rail nav
// ────────────────────────────────────────────────────────────

const SplitNav = ({ nav }) => {
  const groups = [
    {
      label: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Inbox',     icon: 'home',     view: 'dashboard' },
        { id: 'approvals', label: 'Approvals', icon: 'check',    view: 'approvals', accent: true,
          count: nav.deliverables.filter(d => d.status === 'pending').length },
        { id: 'inbox',     label: 'Messages',  icon: 'chat',     view: 'inbox',
          count: CLIENTS.reduce((a, b) => a + b.unread, 0) },
        { id: 'activity',  label: 'Activity',  icon: 'activity', view: 'activity' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'clients',  label: 'Clients',  icon: 'clients', view: 'clients', count: CLIENTS.length },
        { id: 'reports',  label: 'Reports',  icon: 'bar',     view: 'reports', count: REPORTS_DUE.length },
        { id: 'files',    label: 'Files',    icon: 'folder',  view: 'files' },
      ],
    },
  ];
  return (
    <aside style={{
      position: 'sticky', top: 0, height: '100vh',
      background: 'var(--bg-1)',
      borderRight: '0.5px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      padding: '14px 10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 18px' }}>
        <AwakenMark size={22} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 600 }}>Awaken Creative</div>
          <div style={{ fontSize: 10, color: 'var(--fg-faint)', letterSpacing: '0.06em' }}>Agency workspace</div>
        </div>
        <button className="btn btn--icon btn--quiet" style={{ width: 22, height: 22 }}><Icon name="chevD" size={12} /></button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 2px 14px' }}>
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 5, border: 0,
          background: 'var(--bg-2)', cursor: 'pointer',
          color: 'var(--fg-faint)', fontFamily: 'inherit', fontSize: 11.5,
        }}>
          <Icon name="search" size={12} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
          <span className="mono" style={{ fontSize: 9.5, opacity: 0.7 }}>⌘K</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {groups.map(g => (
          <div key={g.label} style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 9.5, color: 'var(--fg-faint)', letterSpacing: '0.16em',
              textTransform: 'uppercase', padding: '6px 10px 6px', fontWeight: 600,
            }}>{g.label}</div>
            {g.items.map(it => {
              const active = nav.view === it.view;
              return (
                <button key={it.id} onClick={() => nav.setView(it.view)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '5px 10px', borderRadius: 5, border: 0,
                  background: active ? 'var(--bg-3)' : 'transparent',
                  color: active ? 'var(--cream)' : 'var(--fg-dim)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
                  textAlign: 'left', marginBottom: 1,
                }}>
                  <Icon name={it.icon} size={14} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {typeof it.count === 'number' && it.count > 0 && (
                    <span className="tabular" style={{
                      fontSize: 10.5, padding: '0 5px', borderRadius: 3, minWidth: 16, textAlign: 'center',
                      background: it.accent ? 'var(--rust)' : 'transparent',
                      color: it.accent ? '#fff' : 'var(--fg-faint)',
                    }}>{it.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Pinned clients group */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 10px',
          }}>
            <span style={{
              fontSize: 9.5, color: 'var(--fg-faint)', letterSpacing: '0.16em',
              textTransform: 'uppercase', fontWeight: 600,
            }}>Pinned</span>
            <button className="btn btn--icon btn--quiet" style={{ width: 16, height: 16, padding: 0 }}><Icon name="plus" size={10} /></button>
          </div>
          {CLIENTS.slice(0, 4).map(c => {
            const active = nav.view === 'client' && nav.clientId === c.id;
            return (
              <button key={c.id} onClick={() => nav.goToClient(c.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 10px', borderRadius: 5, border: 0,
                background: active ? 'var(--bg-3)' : 'transparent',
                color: active ? 'var(--cream)' : 'var(--fg-dim)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                textAlign: 'left',
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 3, background: 'var(--bg-3)',
                  border: '0.5px solid var(--line-strong)',
                  fontSize: 8, fontWeight: 600, color: 'var(--fg-dim)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{c.initials[0]}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                {c.flag === 'action' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--rust)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / user */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px',
        borderTop: '0.5px solid var(--line)',
      }}>
        <div className="avatar avatar--sm" style={{ background: 'var(--rust)', color: '#fff' }}>JC</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 500 }}>Jordan Cole</div>
        </div>
        <button className="btn btn--icon btn--quiet" style={{ width: 22, height: 22 }}><Icon name="settings" size={13} /></button>
      </div>
    </aside>
  );
};

// ────────────────────────────────────────────────────────────
//   Master list (middle column) — varies by view
// ────────────────────────────────────────────────────────────

const SplitMaster = ({ nav, client }) => (
  <aside style={{
    background: 'var(--bg-1)',
    borderRight: '0.5px solid var(--line)',
    position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
  }}>
    {/* Header */}
    <div style={{
      padding: '14px 16px', borderBottom: '0.5px solid var(--line)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--bg-1)', position: 'sticky', top: 0, zIndex: 1,
    }}>
      <div>
        <div style={{ fontSize: 14, color: 'var(--cream)', fontWeight: 600 }}>{splitTitle(nav)}</div>
        <div style={{ fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 2, letterSpacing: '0.04em' }}>{splitSub(nav)}</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn btn--icon btn--quiet" style={{ width: 26, height: 26 }}><Icon name="filter" size={13} /></button>
        <button className="btn btn--icon btn--quiet" style={{ width: 26, height: 26 }}><Icon name="plus" size={13} /></button>
      </div>
    </div>

    {/* List body */}
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {nav.view === 'dashboard' && <SplitDashboardList nav={nav} />}
      {(nav.view === 'clients' || nav.view === 'client') && <SplitClientsList nav={nav} />}
      {nav.view === 'inbox' && <SplitInboxList nav={nav} />}
      {nav.view === 'approvals' && <SplitApprovalsList nav={nav} />}
      {nav.view === 'reports' && <SplitReportsList nav={nav} />}
      {nav.view === 'files' && <SplitFilesList nav={nav} />}
      {nav.view === 'activity' && <SplitActivityList nav={nav} />}
    </div>
  </aside>
);

const splitTitle = (nav) => ({
  dashboard: 'Inbox', clients: 'Clients', client: 'Clients',
  inbox: 'Messages', approvals: 'Approvals',
  reports: 'Reports', files: 'Files', activity: 'Activity',
})[nav.view] || 'Inbox';

const splitSub = (nav) => ({
  dashboard: `${ACTION_ITEMS.length} need you · ${WAITING_ON_CLIENT.length} waiting`,
  clients: `${CLIENTS.length} active`,
  client:  `${CLIENTS.length} active`,
  inbox: `${CLIENTS.reduce((a, b) => a + b.unread, 0)} unread`,
  approvals: `${nav.deliverables.filter(d => d.status === 'pending').length} pending`,
  reports: `${REPORTS_DUE.length} due`,
  files: `${FILES.length} files`,
  activity: 'Last 7 days',
})[nav.view] || '';

// Dashboard master = combined to-do queue
const SplitDashboardList = ({ nav }) => {
  const items = [
    ...ACTION_ITEMS.map(a => ({ kind: 'action', priority: a.priority, label: a.label, sub: `${a.client} · due ${a.due}`, id: a.id })),
    ...WAITING_ON_CLIENT.map(w => ({ kind: 'wait', priority: 'low', label: w.label, sub: `${w.client} · ${w.age} old`, id: w.id })),
    ...UPCOMING_MILESTONES.map(m => ({ kind: 'milestone', priority: 'low', label: m.label, sub: `${m.client} · ${m.date}`, id: m.id })),
  ];
  return (
    <div>
      {items.map((it, i) => (
        <SplitRow key={it.id}
                  selected={i === 0}
                  marker={
                    it.kind === 'action' ? <SplitDot priority={it.priority} /> :
                    it.kind === 'wait' ? <Icon name="clock" size={11} /> :
                    <Icon name="flag" size={11} />
                  }
                  title={it.label} sub={it.sub}
                  kind={it.kind} />
      ))}
    </div>
  );
};

const SplitClientsList = ({ nav }) => (
  <div>
    {CLIENTS.map(c => {
      const active = nav.view === 'client' && nav.clientId === c.id;
      return (
        <button key={c.id} onClick={() => nav.goToClient(c.id)}
                style={{ ...rowStyle(active), display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: c.flag === 'action' ? 'var(--rust)' :
                        c.flag === 'waiting' ? 'var(--gold)' :
                        c.flag === 'onboarding' ? 'var(--info)' :
                        c.flag === 'on-track' ? 'var(--ok)' : 'var(--fg-mute)',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 500 }}>{c.name}</span>
              <span className="tabular" style={{ fontSize: 10.5, color: 'var(--fg-faint)' }}>{c.progress}%</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.phase} · {c.activity}
            </div>
            <div className="progress" style={{ height: 2, marginTop: 5 }}><i style={{ width: `${c.progress}%` }} /></div>
          </div>
        </button>
      );
    })}
  </div>
);

const SplitInboxList = ({ nav }) => (
  <div>
    {CLIENTS.map(c => {
      const active = c.id === 'brookside';
      return (
        <button key={c.id} onClick={() => nav.goToClient(c.id, 'messages')}
                style={{ ...rowStyle(active), display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span className="avatar avatar--sm" style={{ background: 'var(--bg-3)', flexShrink: 0 }}>{c.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 500 }}>{c.name}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)' }}>{c.activity}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.contact.name}
            </div>
            {c.unread > 0 && (
              <span style={{
                fontSize: 9.5, fontWeight: 700, background: 'var(--rust)', color: '#fff',
                padding: '1px 5px', borderRadius: 3, marginTop: 4, display: 'inline-block',
              }}>{c.unread} new</span>
            )}
          </div>
        </button>
      );
    })}
  </div>
);

const SplitApprovalsList = ({ nav }) => {
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  return (
    <div>
      {pending.map((d, i) => (
        <button key={d.id} onClick={() => nav.openApproval(d)} style={{ ...rowStyle(i === 0), display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 30, background: 'var(--bg-2)', borderRadius: 3, flexShrink: 0, border: '0.5px solid var(--line-strong)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 2 }}>Brookside · {d.submittedAt}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const SplitReportsList = ({ nav }) => (
  <div>
    {REPORTS_DUE.map((r, i) => (
      <button key={r.id} style={{ ...rowStyle(i === 0), display: 'flex', gap: 10, alignItems: 'center' }}>
        <Icon name="bar" size={13} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: 'var(--cream)' }}>{r.kind}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 2 }}>{r.client} · {r.due}</div>
        </div>
      </button>
    ))}
  </div>
);

const SplitFilesList = ({ nav }) => (
  <div>
    {FILES.map((f, i) => (
      <button key={f.id} style={{ ...rowStyle(i === 0), display: 'flex', gap: 10, alignItems: 'center' }}>
        <Icon name={f.kind === 'pdf' || f.kind === 'doc' ? 'doc' : f.kind === 'archive' ? 'archive' : 'image'} size={13} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 1 }}>{f.size} · {f.uploaded}</div>
        </div>
      </button>
    ))}
  </div>
);

const SplitActivityList = ({ nav }) => (
  <div>
    {ACTIVITY.map((a, i) => (
      <button key={a.id} style={{ ...rowStyle(i === 0), display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span className="avatar avatar--sm" style={{ flexShrink: 0 }}>{a.who.split(' ').map(w => w[0]).join('').slice(0,2)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 600 }}>{a.who}</span> {a.action.slice(0, 38)}…
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 2 }}>{a.when}</div>
        </div>
      </button>
    ))}
  </div>
);

const rowStyle = (selected) => ({
  width: '100%', padding: '8px 14px', border: 0,
  background: selected ? 'var(--bg-3)' : 'transparent',
  cursor: 'pointer', textAlign: 'left',
  borderBottom: '0.5px solid var(--line)',
  fontFamily: 'inherit',
});

const SplitDot = ({ priority }) => (
  <span style={{
    width: 8, height: 8, borderRadius: 2, flexShrink: 0, marginTop: 5,
    background: priority === 'high' ? 'var(--rust)' :
                priority === 'medium' ? 'var(--gold)' : 'var(--fg-mute)',
  }} />
);

const SplitRow = ({ marker, title, sub, selected, kind }) => (
  <div style={{
    ...rowStyle(selected),
    display: 'flex', gap: 10, alignItems: 'flex-start',
  }}>
    <span style={{ display: 'inline-flex', width: 16, justifyContent: 'center', paddingTop: 2, color: 'var(--fg-faint)', flexShrink: 0 }}>{marker}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 500, lineHeight: 1.35 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 2 }}>{sub}</div>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//   Detail (right column)
// ────────────────────────────────────────────────────────────

const SplitDetail = ({ nav, client }) => {
  if (nav.view === 'dashboard')  return <SplitDashDetail nav={nav} />;
  if (nav.view === 'clients' || nav.view === 'client') return <SplitClientDetail nav={nav} client={client} />;
  if (nav.view === 'inbox')      return <SplitInboxDetail nav={nav} />;
  if (nav.view === 'approvals')  return <SplitApprovalsDetail nav={nav} />;
  if (nav.view === 'reports')    return <SplitReportsDetail nav={nav} />;
  if (nav.view === 'files')      return <SplitFilesDetail nav={nav} />;
  if (nav.view === 'activity')   return <SplitActivityDetail nav={nav} />;
  return null;
};

// ─── Dashboard detail: featured action item ───

const SplitDashDetail = ({ nav }) => {
  const item = ACTION_ITEMS[0];
  return (
    <div className="fade-in" style={{ padding: '28px 36px' }}>
      <DetailHeader title={item.label} sub={item.client}
        right={<><StatusBadge status="action" />
          <button className="btn btn--ghost btn--sm"><Icon name="check" size={13} /> Mark done</button>
          <button className="btn btn--primary btn--sm">Open project <Icon name="arrowR" size={13} /></button></>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <DetailKV label="Priority" value="High" accent="rust" />
        <DetailKV label="Due" value={item.due} accent="rust" />
        <DetailKV label="Client" value={item.client} />
        <DetailKV label="Assigned" value="Jordan Cole" />
      </div>

      <Section title="Why now">
        <p style={{ color: 'var(--fg-dim)', fontSize: 13.5, lineHeight: 1.6, margin: 0, maxWidth: 720 }}>
          Two homepage directions went to Elena on May 9. She replied this morning leaning A
          but wants to mix in B's testimonial pull-quotes. The team needs your call so they
          can ship a v2 by Friday.
        </p>
      </Section>

      <Section title="Today's queue" sub={`${ACTION_ITEMS.length + WAITING_ON_CLIENT.length} items`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <SplitPanel title="Needs you">
            {ACTION_ITEMS.map((a, i) => (
              <div key={a.id} style={{ ...denseRow(i === ACTION_ITEMS.length - 1) }}>
                <SplitDot priority={a.priority} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--cream)' }}>{a.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 1 }}>{a.client}</div>
                </div>
                <span style={{ fontSize: 11, color: a.due === 'today' ? 'var(--rust-soft)' : 'var(--fg-faint)' }}>{a.due}</span>
              </div>
            ))}
          </SplitPanel>
          <SplitPanel title="Waiting on clients">
            {WAITING_ON_CLIENT.map((w, i) => (
              <div key={w.id} style={{ ...denseRow(i === WAITING_ON_CLIENT.length - 1) }}>
                <Icon name="clock" size={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--cream)' }}>{w.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 1 }}>{w.client}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--gold-soft)' }}>+{w.age}</span>
              </div>
            ))}
          </SplitPanel>
        </div>
      </Section>

      <Section title="Coming up">
        <SplitPanel>
          {UPCOMING_MILESTONES.map((m, i) => (
            <div key={m.id} style={{ ...denseRow(i === UPCOMING_MILESTONES.length - 1) }}>
              <Icon name="flag" size={12} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: 'var(--cream)' }}>{m.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--fg-faint)', marginTop: 1 }}>{m.client}</div>
              </div>
              <span className="mono tabular" style={{ fontSize: 11.5, color: 'var(--cream)' }}>{m.date}</span>
            </div>
          ))}
        </SplitPanel>
      </Section>
    </div>
  );
};

// ─── Client detail (right panel for clients view) ───

const SplitClientDetail = ({ nav, client }) => {
  const c = client || CLIENTS[0];
  const tabs = [
    { id: 'overview',     label: 'Overview' },
    { id: 'milestones',   label: 'Timeline' },
    { id: 'deliverables', label: 'Deliverables',
      count: nav.deliverables.filter(d => d.status === 'pending').length },
    { id: 'checklist',    label: 'Checklist' },
    { id: 'intake',       label: 'Onboarding' },
    { id: 'messages',     label: 'Messages',
      count: MESSAGES.filter(m => !m.read).length },
    { id: 'contracts',    label: 'Contracts' },
    { id: 'invoices',     label: 'Invoices' },
    { id: 'files',        label: 'Files' },
    { id: 'analytics',    label: 'Analytics' },
  ];
  return (
    <div className="fade-in" style={{ padding: '28px 36px' }}>
      <DetailHeader
        title={c.name}
        sub={`${c.industry} · since ${c.startedAt}`}
        right={
          <>
            <StatusBadge status={c.flag} />
            <button className="btn btn--ghost btn--sm"><Icon name="chat" size={13} /> Message</button>
            <button className="btn btn--primary btn--sm"><Icon name="eye" size={13} /> View as client</button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <DetailKV label="Phase" value={c.phase} accent="gold" />
        <DetailKV label="Progress" value={`${c.progress}%`} />
        <DetailKV label="Target launch" value={c.targetLaunch} />
        <DetailKV label="Lead" value={c.contact.name.split(' ').slice(-1)[0]} />
        <DetailKV label="Team" value={`${c.assigned.length}`} />
      </div>

      <div style={{
        display: 'flex', gap: 0, marginBottom: 22, overflowX: 'auto',
        borderBottom: '0.5px solid var(--line)',
      }}>
        {tabs.map(t => {
          const active = nav.clientTab === t.id;
          return (
            <button key={t.id} onClick={() => nav.setClientTab(t.id)} style={{
              padding: '9px 12px', border: 0, background: 'transparent',
              color: active ? 'var(--cream)' : 'var(--fg-dim)',
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
              borderBottom: active ? '2px solid var(--rust)' : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              {typeof t.count === 'number' && t.count > 0 && (
                <span className="tabular" style={{
                  fontSize: 10, padding: '0 5px', borderRadius: 3, minWidth: 14, textAlign: 'center',
                  background: 'var(--rust)', color: '#fff',
                }}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {nav.clientTab === 'overview'     && <OverviewTab nav={nav} client={c} />}
      {nav.clientTab === 'milestones'   && <MilestonesTab nav={nav} />}
      {nav.clientTab === 'deliverables' && <DeliverablesTab nav={nav} />}
      {nav.clientTab === 'checklist'    && <ChecklistTab nav={nav} />}
      {nav.clientTab === 'intake'       && <IntakeForm />}
      {nav.clientTab === 'messages'     && <div className="card"><div className="card-bd"><MessageThread messages={MESSAGES} /></div></div>}
      {nav.clientTab === 'contracts'    && <ContractsTab nav={nav} />}
      {nav.clientTab === 'invoices'     && <InvoicesTab nav={nav} />}
      {nav.clientTab === 'files'        && <FilesTab nav={nav} />}
      {nav.clientTab === 'analytics'    && <AnalyticsTab nav={nav} />}
    </div>
  );
};

// ─── Inbox detail ───

const SplitInboxDetail = ({ nav }) => (
  <div className="fade-in" style={{ padding: '28px 36px' }}>
    <DetailHeader
      title="Brookside Dental"
      sub="Dr. Elena Brookside · Mara Reyes"
      right={
        <>
          <button className="btn btn--ghost btn--sm" onClick={() => nav.goToClient('brookside')}>Open project</button>
          <button className="btn btn--icon btn--quiet"><Icon name="settings" size={14} /></button>
        </>
      }
    />
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-bd"><MessageThread messages={MESSAGES} height={560} /></div>
    </div>
  </div>
);

// ─── Approvals detail ───

const SplitApprovalsDetail = ({ nav }) => {
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  const featured = pending[0];
  if (!featured) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--fg-faint)' }}>
        <Icon name="check" size={36} />
        <h2 style={{ fontSize: 22, color: 'var(--fg-dim)', marginTop: 16 }}>Inbox zero.</h2>
        <p>No pending approvals.</p>
      </div>
    );
  }
  return (
    <div className="fade-in" style={{ padding: '28px 36px' }}>
      <DetailHeader
        title={featured.name}
        sub={`Brookside Dental · submitted ${featured.submittedAt} by ${featured.submittedBy}`}
        right={
          <>
            <StatusBadge status="pending" />
            <button className="btn btn--ghost btn--sm" onClick={() => nav.openApproval(featured)}><Icon name="pen" size={13} /> Request changes</button>
            <button className="btn btn--primary btn--sm" onClick={() => nav.openApproval(featured)}><Icon name="check" size={13} /> Open review</button>
          </>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginTop: 8 }}>
        <DeliverableThumb label={featured.thumb} h={420} variant={featured.name.includes('B') ? 'B' : 'A'} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Section title="Description"><p style={{ margin: 0, color: 'var(--fg-dim)', fontSize: 13.5, lineHeight: 1.6 }}>{featured.description}</p></Section>
          <Section title="Revisions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {featured.revisions.map(r => (
                <div key={r.v} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 4, fontSize: 12 }}>
                  <span className="mono" style={{ color: 'var(--rust-soft)', fontWeight: 600 }}>{r.v}</span>
                  <span style={{ color: 'var(--fg-dim)' }}>{r.note}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--fg-faint)', fontSize: 10.5 }}>{r.date}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

const SplitReportsDetail = ({ nav }) => {
  const r = REPORTS_DUE[0];
  return (
    <div className="fade-in" style={{ padding: '28px 36px' }}>
      <DetailHeader title={r.kind} sub={`${r.client} · due ${r.due}`}
        right={<><button className="btn btn--ghost btn--sm">Skip this period</button><button className="btn btn--primary btn--sm">Build report <Icon name="arrowR" size={13} /></button></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
        <DetailKV label="Period" value="Apr 1 – Apr 30" />
        <DetailKV label="Recipient" value="June Halverson" />
        <DetailKV label="Sent last" value="Apr 14" />
      </div>
      <Section title="Sections to include">
        <SplitPanel>
          {['Site traffic summary', 'Top pages', 'Conversion goals', 'Search performance', 'Recommendations for May'].map((s, i, a) => (
            <div key={s} style={{ ...denseRow(i === a.length - 1) }}>
              <Icon name="check" size={12} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--cream)' }}>{s}</span>
            </div>
          ))}
        </SplitPanel>
      </Section>
    </div>
  );
};

const SplitFilesDetail = ({ nav }) => {
  const f = FILES[3];
  return (
    <div className="fade-in" style={{ padding: '28px 36px' }}>
      <DetailHeader title={f.name} sub={`Uploaded by ${f.by} · ${f.uploaded}`}
        right={<><button className="btn btn--ghost btn--sm"><Icon name="download" size={13} /> Download</button><button className="btn btn--ghost btn--sm"><Icon name="chat" size={13} /> Comment</button></>} />
      <div className="img-placeholder" style={{ height: 420, fontSize: 12, marginTop: 16 }}>
        File preview
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
        <DetailKV label="Size" value={f.size} />
        <DetailKV label="Kind" value={f.kind} />
        <DetailKV label="Project" value="Brookside Dental" />
        <DetailKV label="Shared with" value="Client" />
      </div>
    </div>
  );
};

const SplitActivityDetail = ({ nav }) => {
  const a = ACTIVITY[0];
  return (
    <div className="fade-in" style={{ padding: '28px 36px' }}>
      <DetailHeader title="Activity stream" sub={`${ACTIVITY.length} events in the last 7 days`} />
      <SplitPanel>
        {ACTIVITY.concat(ACTIVITY).map((a, i, arr) => (
          <div key={i} style={{ ...denseRow(i === arr.length - 1) }}>
            <span className="avatar avatar--sm">{a.who.split(' ').map(w => w[0]).join('').slice(0,2)}</span>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--cream)', fontWeight: 500, fontSize: 13 }}>{a.who}</span>
              <span style={{ color: 'var(--fg-dim)', fontSize: 13 }}> {a.action}</span>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{a.when}</span>
          </div>
        ))}
      </SplitPanel>
    </div>
  );
};

// ─── shared detail bits ───

const DetailHeader = ({ title, sub, right }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 16, marginBottom: 24, paddingBottom: 20,
    borderBottom: '0.5px solid var(--line)',
  }}>
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--cream)', margin: 0, lineHeight: 1.3 }}>{title}</h1>
      <div style={{ fontSize: 12.5, color: 'var(--fg-faint)', marginTop: 6 }}>{sub}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      {right}
    </div>
  </div>
);

const DetailKV = ({ label, value, accent }) => {
  const color = accent === 'rust' ? 'var(--rust-soft)' : accent === 'gold' ? 'var(--gold-soft)' : 'var(--cream)';
  return (
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)', borderRadius: 6, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--fg-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 14, color, marginTop: 6, fontWeight: 500 }}>{value}</div>
    </div>
  );
};

const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <h3 style={{
        fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.12em',
        textTransform: 'uppercase', fontWeight: 600, margin: 0,
      }}>{title}</h3>
      {sub && <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{sub}</span>}
    </div>
    {children}
  </div>
);

const SplitPanel = ({ title, children }) => (
  <div style={{
    background: 'var(--bg-1)', border: '0.5px solid var(--line-strong)',
    borderRadius: 6, overflow: 'hidden',
  }}>
    {title && (
      <div style={{
        padding: '8px 14px', borderBottom: '0.5px solid var(--line)',
        fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.08em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>{title}</div>
    )}
    <div>{children}</div>
  </div>
);

const denseRow = (last) => ({
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
  borderBottom: last ? 'none' : '0.5px solid var(--line)',
  fontSize: 12.5,
});

Object.assign(window, { SplitLayout });
