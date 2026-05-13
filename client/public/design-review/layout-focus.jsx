// layout-focus.jsx
// Direction 3: FOCUS MODE
// Sparse, one-thing-at-a-time. Massive typography. Editorial layout.
// Minimal top chrome — just brand + crumb + user. Generous whitespace.
// "Magazine spread" rather than dashboard. The opposite of CommandBar.

const FocusLayout = ({ nav }) => {
  const c = CLIENTS.find(x => x.id === nav.clientId);
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <FocusNav nav={nav} client={c} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px 80px' }}>
        {nav.view === 'dashboard' && <FocusDashboard nav={nav} />}
        {nav.view === 'clients'   && <FocusClients nav={nav} />}
        {nav.view === 'client'    && <FocusClient nav={nav} client={c} />}
        {nav.view === 'inbox'     && <FocusInbox nav={nav} />}
        {nav.view === 'approvals' && <FocusApprovals nav={nav} />}
        {nav.view === 'reports'   && <FocusReports nav={nav} />}
        {nav.view === 'files'     && <div className="card" style={{ marginTop: 40 }}><div className="card-bd"><FileGrid files={FILES} /></div></div>}
        {nav.view === 'activity'  && <FocusActivity nav={nav} />}
      </main>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//   Minimal top nav — three zones
// ────────────────────────────────────────────────────────────

const FocusNav = ({ nav, client }) => {
  const views = [
    { id: 'dashboard', label: 'Today' },
    { id: 'clients',   label: 'Clients' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'inbox',     label: 'Inbox' },
  ];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '0.5px solid var(--line)',
      display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', gap: 24,
      padding: '18px 48px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AwakenMark size={28} />
        <button onClick={() => nav.setView('dashboard')} style={{
          background: 'none', border: 0, padding: 0, cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.06em',
          color: 'var(--cream)',
        }}>AWAKEN</button>
      </div>

      <nav style={{ display: 'flex', gap: 2 }}>
        {views.map(v => {
          const active = nav.view === v.id || (v.id === 'clients' && nav.view === 'client');
          return (
            <button key={v.id} onClick={() => nav.setView(v.id)} style={{
              padding: '8px 18px', border: 0, background: 'transparent',
              color: active ? 'var(--cream)' : 'var(--fg-faint)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', position: 'relative',
            }}>
              {v.label}
              {active && <span style={{ position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--rust)' }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'flex-end' }}>
        <button className="btn btn--icon btn--quiet" style={{ position: 'relative' }}>
          <Icon name="bell" size={15} />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: 'var(--rust)' }} />
        </button>
        <div className="avatar" style={{ background: 'var(--rust)', color: '#fff' }}>JC</div>
      </div>
    </header>
  );
};

// ────────────────────────────────────────────────────────────
//   Focus Dashboard — editorial "Today" view
// ────────────────────────────────────────────────────────────

const FocusDashboard = ({ nav }) => {
  return (
    <div className="fade-in-up">
      {/* Editorial header */}
      <div style={{ paddingTop: 40, paddingBottom: 60, textAlign: 'left' }}>
        <div className="eyebrow" style={{ color: 'var(--rust-soft)' }}>Wednesday · 13 May 2026</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 96, lineHeight: 0.92,
          color: 'var(--cream)', margin: '20px 0 0', letterSpacing: '0.01em', maxWidth: 900,
        }}>Three things<br/>need you today.</h1>
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.55,
          color: 'var(--fg-dim)', maxWidth: 580, marginTop: 28, fontStyle: 'italic',
        }}>
          Two clients waiting on your team. One report goes out tomorrow.
          The rest of the day is yours.
        </p>
      </div>

      {/* The three things */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {ACTION_ITEMS.slice(0, 3).map((a, i) => (
          <div key={a.id} style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 140px',
            gap: 28, padding: '28px 0', alignItems: 'baseline',
            borderTop: '0.5px solid var(--line-strong)',
            borderBottom: i === 2 ? '0.5px solid var(--line-strong)' : 'none',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 56, color: 'var(--fg-mute)',
              letterSpacing: '0.04em', lineHeight: 1,
            }}>{String(i + 1).padStart(2, '0')}</div>
            <div>
              <div style={{ fontSize: 22, color: 'var(--cream)', lineHeight: 1.3, fontWeight: 500 }}>{a.label}</div>
              <div style={{
                display: 'flex', gap: 12, marginTop: 10, alignItems: 'center',
                fontSize: 12, color: 'var(--fg-faint)',
              }}>
                <span style={{ color: a.priority === 'high' ? 'var(--rust-soft)' : 'var(--fg-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                  {a.priority} priority
                </span>
                <span>·</span>
                <span>{a.client}</span>
                <span>·</span>
                <span>due {a.due}</span>
              </div>
            </div>
            <button className="btn btn--primary" style={{ justifySelf: 'end' }}>
              Open <Icon name="arrowR" size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Secondary content — sparse */}
      <section style={{ paddingTop: 64 }}>
        <div className="eyebrow eyebrow--rust" style={{ marginBottom: 24 }}>Then</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
          <FocusBlock
            title="Waiting on clients"
            value={WAITING_ON_CLIENT.length}
            sub={`Across ${new Set(WAITING_ON_CLIENT.map(w => w.client)).size} engagements. Oldest item is 5 days.`}
            onClick={() => nav.setView('clients')}
          />
          <FocusBlock
            title="Milestones this week"
            value={UPCOMING_MILESTONES.length}
            sub="Two launches this month. Stay close to Kettle & Forge."
            onClick={() => nav.setView('clients')}
          />
          <FocusBlock
            title="Reports due"
            value={REPORTS_DUE.length}
            sub="Cedarcraft monthly tomorrow. Two more this week."
            onClick={() => nav.setView('reports')}
          />
        </div>
      </section>

      {/* Recently */}
      <section style={{ paddingTop: 80 }}>
        <div className="eyebrow eyebrow--rust" style={{ marginBottom: 24 }}>Recently</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ACTIVITY.slice(0, 4).map((a, i) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '18px 0',
              borderTop: '0.5px solid var(--line)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)', minWidth: 80, letterSpacing: '0.04em' }}>{a.when}</span>
              <span style={{ flex: 1, fontSize: 15, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{a.who}</span>
                <span style={{ color: 'var(--fg-dim)' }}> {a.action}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const FocusBlock = ({ title, value, sub, onClick }) => (
  <button onClick={onClick} style={{
    background: 'transparent', border: 0, padding: '0 0 24px', textAlign: 'left',
    cursor: 'pointer', borderTop: '0.5px solid var(--line-strong)', paddingTop: 24,
  }}>
    <div className="eyebrow">{title}</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--cream)', lineHeight: 1, margin: '14px 0' }}>
      {value}
    </div>
    <p style={{ fontSize: 13, color: 'var(--fg-dim)', margin: 0, lineHeight: 1.5, maxWidth: 280 }}>{sub}</p>
  </button>
);

// ────────────────────────────────────────────────────────────
//   Focus Clients — directory list
// ────────────────────────────────────────────────────────────

const FocusClients = ({ nav }) => (
  <div className="fade-in-up">
    <div style={{ paddingTop: 40, paddingBottom: 48 }}>
      <div className="eyebrow eyebrow--rust">Engagements</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 80, lineHeight: 1, color: 'var(--cream)', margin: '14px 0 0', letterSpacing: '0.02em' }}>
        {CLIENTS.length} clients<span style={{ color: 'var(--fg-mute)' }}>.</span>
      </h1>
    </div>
    <div>
      {CLIENTS.map((c, i) => (
        <button key={c.id} onClick={() => nav.goToClient(c.id)} style={{
          width: '100%', display: 'grid', gridTemplateColumns: '60px 1fr 1fr 140px 28px',
          gap: 24, padding: '28px 0', border: 0,
          borderTop: '0.5px solid var(--line)',
          borderBottom: i === CLIENTS.length - 1 ? '0.5px solid var(--line)' : 'none',
          background: 'transparent', cursor: 'pointer', textAlign: 'left',
          alignItems: 'center',
          transition: 'padding 200ms ease',
        }} onMouseEnter={e => e.currentTarget.style.paddingLeft = '12px'}
           onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-mute)', letterSpacing: '0.04em' }}>{String(i + 1).padStart(2, '0')}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--cream)', letterSpacing: '0.02em', lineHeight: 1.1 }}>{c.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-faint)', marginTop: 6 }}>{c.industry} · since {c.startedAt}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--fg-dim)', fontStyle: 'italic', lineHeight: 1.5 }}>{c.project}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
            <StatusBadge status={c.flag} />
            <span className="mono tabular" style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>{c.progress}% · {c.phase}</span>
          </div>
          <Icon name="arrowR" size={16} />
        </button>
      ))}
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//   Focus Client Detail — editorial profile + section navigator
// ────────────────────────────────────────────────────────────

const FocusClient = ({ nav, client }) => {
  const sections = [
    { id: 'overview',     label: 'Overview' },
    { id: 'milestones',   label: 'Timeline' },
    { id: 'deliverables', label: 'Deliverables', count: nav.deliverables.filter(d => d.status === 'pending').length },
    { id: 'checklist',    label: 'Checklist' },
    { id: 'intake',       label: 'Onboarding' },
    { id: 'messages',     label: 'Messages' },
    { id: 'contracts',    label: 'Contracts' },
    { id: 'files',        label: 'Files' },
  ];

  return (
    <div className="fade-in-up">
      {/* Magazine-style hero */}
      <div style={{ paddingTop: 32, paddingBottom: 44, borderBottom: '0.5px solid var(--line-strong)' }}>
        <button onClick={() => nav.setView('clients')} style={{
          background: 'none', border: 0, padding: 0, cursor: 'pointer',
          color: 'var(--fg-faint)', fontSize: 12, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 6,
        }}><Icon name="arrowL" size={12} /> All clients</button>

        <div className="eyebrow eyebrow--rust">{client.industry} · #{String(CLIENTS.findIndex(c => c.id === client.id) + 1).padStart(3, '0')}</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 88, lineHeight: 0.96,
          color: 'var(--cream)', margin: '14px 0 0', letterSpacing: '0.01em',
        }}>{client.name}</h1>
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--fg-dim)',
          fontStyle: 'italic', marginTop: 18, maxWidth: 720, lineHeight: 1.45,
        }}>{client.project}.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 36 }}>
          <FocusKV label="Phase" value={client.phase} accent />
          <FocusKV label="Progress" value={`${client.progress}%`} />
          <FocusKV label="Started" value={client.startedAt} />
          <FocusKV label="Target launch" value={client.targetLaunch} accent />
          <FocusKV label="Lead" value={client.contact.name.split(' ').slice(-1)[0]} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button className="btn btn--ghost btn--sm"><Icon name="chat" size={13} /> Message</button>
            <button className="btn btn--primary btn--sm"><Icon name="eye" size={13} /> View as client</button>
          </div>
        </div>
      </div>

      {/* Section navigator */}
      <div style={{
        display: 'flex', gap: 22, padding: '24px 0', marginTop: 4,
        overflowX: 'auto', borderBottom: '0.5px solid var(--line)',
      }}>
        {sections.map(s => {
          const active = nav.clientTab === s.id;
          return (
            <button key={s.id} onClick={() => nav.setClientTab(s.id)} style={{
              padding: 0, border: 0, background: 'transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              color: active ? 'var(--cream)' : 'var(--fg-faint)',
              display: 'flex', alignItems: 'center', gap: 8,
              position: 'relative', paddingBottom: 8,
              borderBottom: active ? '1px solid var(--rust)' : '1px solid transparent',
              marginBottom: -1,
            }}>
              {s.label}
              {typeof s.count === 'number' && s.count > 0 && (
                <span className="mono tabular" style={{ fontSize: 10, color: 'var(--rust-soft)' }}>{s.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div style={{ paddingTop: 40 }}>
        {nav.clientTab === 'overview'     && <FocusOverview nav={nav} client={client} />}
        {nav.clientTab === 'milestones'   && <FocusTimeline nav={nav} />}
        {nav.clientTab === 'deliverables' && <FocusDeliverables nav={nav} />}
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

const FocusKV = ({ label, value, accent }) => (
  <div>
    <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1,
      color: accent ? 'var(--cream)' : 'var(--fg-dim)', letterSpacing: '0.02em',
    }}>{value}</div>
  </div>
);

const FocusOverview = ({ nav, client }) => {
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
      {pending.length > 0 && (
        <section>
          <div className="eyebrow eyebrow--rust" style={{ marginBottom: 18 }}>Pending your review</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {pending.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} />)}
          </div>
        </section>
      )}

      <section>
        <div className="eyebrow" style={{ marginBottom: 18 }}>Recent activity</div>
        <div>
          {ACTIVITY.slice(0, 5).map((a, i, arr) => (
            <div key={a.id} style={{
              display: 'flex', gap: 20, padding: '16px 0',
              borderTop: '0.5px solid var(--line)',
              borderBottom: i === arr.length - 1 ? '0.5px solid var(--line)' : 'none',
            }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', minWidth: 80, letterSpacing: '0.04em' }}>{a.when}</span>
              <div style={{ flex: 1 }}>
                <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{a.who}</span>
                <span style={{ color: 'var(--fg-dim)' }}> {a.action}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const FocusTimeline = ({ nav }) => (
  <div>
    {PHASES.map((p, i) => (
      <div key={p.id} style={{
        padding: '40px 0',
        borderTop: '0.5px solid var(--line-strong)',
        borderBottom: i === PHASES.length - 1 ? '0.5px solid var(--line-strong)' : 'none',
        display: 'grid', gridTemplateColumns: '180px 1fr', gap: 40,
      }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.12em' }}>PHASE {String(i + 1).padStart(2, '0')}</div>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1,
            color: p.status === 'upcoming' ? 'var(--fg-mute)' : 'var(--cream)',
            letterSpacing: '0.02em', margin: '8px 0 12px',
          }}>{p.name}</h3>
          <StatusBadge status={p.status} />
          {p.startedAt && (
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 12, letterSpacing: '0.04em' }}>
              {p.startedAt}{p.completedAt && ` → ${p.completedAt}`}
            </div>
          )}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--fg-dim)', fontStyle: 'italic', marginTop: 0, lineHeight: 1.6 }}>
            {p.summary}
          </p>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column' }}>
            {p.milestones.map((m, j) => (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '20px 1fr 80px',
                gap: 14, padding: '12px 0', alignItems: 'center',
                borderTop: j === 0 ? '0.5px solid var(--line)' : 'none',
                borderBottom: '0.5px solid var(--line)',
              }}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '1.5px solid ' + (m.status === 'complete' ? 'var(--ok)' :
                                            m.status === 'active' ? 'var(--gold)' : 'var(--line-bright)'),
                  background: m.status === 'complete' ? 'var(--ok)' : 'transparent',
                }} />
                <span style={{ fontSize: 14, color: m.status === 'upcoming' ? 'var(--fg-faint)' : 'var(--cream)' }}>{m.name}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FocusDeliverables = ({ nav }) => (
  <div>
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--fg-dim)', fontStyle: 'italic', lineHeight: 1.55, maxWidth: 620 }}>
        Every deliverable, in the order it was submitted. Click any one to review or revise.
      </p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {nav.deliverables.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} />)}
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//   Focus inbox / approvals / reports / activity
// ────────────────────────────────────────────────────────────

const FocusInbox = ({ nav }) => (
  <div className="fade-in-up">
    <div style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div className="eyebrow eyebrow--rust">Conversations</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 72, lineHeight: 1, color: 'var(--cream)', margin: '14px 0 0', letterSpacing: '0.02em' }}>Inbox</h1>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
      {CLIENTS.filter(c => c.unread > 0 || c.id === 'brookside').map(c => (
        <button key={c.id} onClick={() => nav.goToClient(c.id, 'messages')} style={{
          width: '100%', textAlign: 'left', border: 0, background: 'transparent', cursor: 'pointer',
          padding: '24px 0', borderTop: '0.5px solid var(--line)',
          display: 'grid', gridTemplateColumns: '48px 1fr 110px', gap: 20, alignItems: 'center',
        }}>
          <span className="avatar avatar--lg" style={{ background: 'var(--bg-3)' }}>{c.initials}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--cream)', letterSpacing: '0.02em' }}>{c.name}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--fg-dim)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.45 }}>
              "{c.contact.name.split(' ')[0]} hasn't replied since {c.activity}."
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {c.unread > 0 && (
              <span style={{ background: 'var(--rust)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>{c.unread} new</span>
            )}
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', marginTop: 8 }}>{c.activity}</div>
          </div>
        </button>
      ))}
    </div>
    <div style={{ marginTop: 60 }}>
      <div className="eyebrow" style={{ marginBottom: 18 }}>Active thread · Brookside Dental</div>
      <div className="card"><div className="card-bd"><MessageThread messages={MESSAGES} /></div></div>
    </div>
  </div>
);

const FocusApprovals = ({ nav }) => {
  const pending = nav.deliverables.filter(d => d.status === 'pending');
  return (
    <div className="fade-in-up">
      <div style={{ paddingTop: 40, paddingBottom: 48 }}>
        <div className="eyebrow eyebrow--rust">Pending review</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 80, lineHeight: 1, color: 'var(--cream)', margin: '14px 0 0', letterSpacing: '0.02em' }}>
          {pending.length} deliverable{pending.length === 1 ? '' : 's'}.
        </h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--fg-dim)', fontStyle: 'italic', marginTop: 18, maxWidth: 620, lineHeight: 1.55 }}>
          Waiting on a client decision. Approve on their behalf if you've already verbalized sign-off.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {pending.map(d => <DeliverableCard key={d.id} deliverable={d} onOpen={nav.openApproval} />)}
      </div>
    </div>
  );
};

const FocusReports = ({ nav }) => (
  <div className="fade-in-up">
    <div style={{ paddingTop: 40, paddingBottom: 48 }}>
      <div className="eyebrow">Scheduled deliverables</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 80, color: 'var(--cream)', margin: '14px 0 0', letterSpacing: '0.02em', lineHeight: 1 }}>Reports</h1>
    </div>
    {REPORTS_DUE.map((r, i) => (
      <div key={r.id} style={{
        display: 'grid', gridTemplateColumns: '120px 1fr 1fr 140px',
        gap: 24, padding: '28px 0', alignItems: 'baseline',
        borderTop: '0.5px solid var(--line-strong)',
        borderBottom: i === REPORTS_DUE.length - 1 ? '0.5px solid var(--line-strong)' : 'none',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--cream)', letterSpacing: '0.02em' }}>{r.due}</div>
        <div style={{ fontSize: 17, color: 'var(--cream)' }}>{r.kind}</div>
        <div style={{ fontSize: 14, color: 'var(--fg-dim)' }}>{r.client}</div>
        <button className="btn btn--ghost" style={{ justifySelf: 'end' }}>Build <Icon name="arrowR" size={14} /></button>
      </div>
    ))}
  </div>
);

const FocusActivity = ({ nav }) => (
  <div className="fade-in-up">
    <div style={{ paddingTop: 40, paddingBottom: 48 }}>
      <div className="eyebrow">Audit trail</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 80, color: 'var(--cream)', margin: '14px 0 0', letterSpacing: '0.02em', lineHeight: 1 }}>Activity</h1>
    </div>
    {ACTIVITY.map((a, i, arr) => (
      <div key={a.id} style={{
        display: 'grid', gridTemplateColumns: '120px 1fr',
        gap: 24, padding: '20px 0', alignItems: 'baseline',
        borderTop: '0.5px solid var(--line)',
        borderBottom: i === arr.length - 1 ? '0.5px solid var(--line)' : 'none',
      }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--fg-faint)', letterSpacing: '0.04em' }}>{a.when}</span>
        <div style={{ fontSize: 15 }}>
          <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{a.who}</span>
          <span style={{ color: 'var(--fg-dim)' }}> {a.action}</span>
        </div>
      </div>
    ))}
  </div>
);

Object.assign(window, { FocusLayout });
