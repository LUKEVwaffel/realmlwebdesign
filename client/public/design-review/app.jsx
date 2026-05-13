// app.jsx — root: layout switcher + global navigation state.

const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "sidebar",
  "density": "regular",
  "accent": "rust",
  "fontPair": "bebas-mont",
  "showActivity": true
}/*EDITMODE-END*/;

// Centralized navigation state — every layout consumes this.
// We pass it via props (no context needed since we render exactly one layout at a time).

const LAYOUT_DESCRIPTIONS = {
  sidebar:    { label: 'Sidebar Classic',   sub: 'Left rail + cards. Brand-default.' },
  commandbar: { label: 'Command Bar',       sub: 'Top nav, dense lists, ⌘K palette.' },
  focus:      { label: 'Focus Mode',        sub: 'Sparse, one-thing-at-a-time.' },
  dock:       { label: 'Studio Dock',       sub: 'Icon dock + filmstrip rhythm.' },
  split:      { label: 'Split Workspace',   sub: 'Master/detail, list-heavy.' },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Listen for layout switch messages from the parent portal wrapper
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'SET_LAYOUT' && e.data.layout) {
        setTweak('layout', e.data.layout);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Navigation
  const [view, setView] = useState('dashboard');
  const [clientId, setClientId] = useState('brookside');
  const [clientTab, setClientTab] = useState('overview');

  // Modals
  const [approvalFor, setApprovalFor] = useState(null);
  const [contractFor, setContractFor] = useState(null);

  // App-level state — deliverables (we mutate status here so the flow feels live)
  const [deliverables, setDeliverables] = useState(DELIVERABLES);
  const [contracts, setContracts] = useState(CONTRACTS);

  const openApproval = (d) => setApprovalFor(d);
  const openContract = (c) => setContractFor(c);

  const onApprove = (d) => {
    setDeliverables(list => list.map(x => x.id === d.id ? { ...x, status: 'approved' } : x));
    setApprovalFor(null);
    window.toast?.(`Approved "${d.name}"`);
  };
  const onRequest = (d, note) => {
    setDeliverables(list => list.map(x => x.id === d.id
      ? { ...x, status: 'changes-requested',
          revisions: [...x.revisions, { v: `v${x.revisions.length + 1}`, date: 'just now', note: note.slice(0, 90) }] }
      : x));
    setApprovalFor(null);
    window.toast?.('Change request sent to the team', 'rust');
  };
  const onSign = (c, name) => {
    setContracts(list => list.map(x => x.id === c.id
      ? { ...x, status: 'signed', signedAt: 'just now', signedBy: name }
      : x));
    setContractFor(null);
    window.toast?.(`Contract signed by ${name}`);
  };

  // Density class on root
  useEffect(() => {
    document.documentElement.classList.remove('density-compact', 'density-regular', 'density-comfy');
    document.documentElement.classList.add(`density-${t.density}`);
  }, [t.density]);

  // Build the nav object passed to every layout
  const nav = {
    view, setView,
    clientId, setClientId,
    clientTab, setClientTab,
    goToClient: (id, tab = 'overview') => {
      setClientId(id); setClientTab(tab); setView('client');
    },
    openApproval, openContract,
    deliverables, contracts,
    accent: t.accent, density: t.density,
    showActivity: t.showActivity,
  };

  const layout = t.layout || 'sidebar';

  const Shell = {
    sidebar:    SidebarLayout,
    commandbar: CommandBarLayout,
    focus:      FocusLayout,
    dock:       DockLayout,
    split:      SplitLayout,
  }[layout] || SidebarLayout;

  // Map accent → applied CSS variable override on the root.
  const accentVar = {
    rust:  { '--rust': '#B24C40', '--rust-soft': '#C46557' },
    gold:  { '--rust': '#C58A1F', '--rust-soft': '#D4A020' },
    cream: { '--rust': '#A89074', '--rust-soft': '#C9B89E' },
  }[t.accent] || {};

  return (
    <div style={{ minHeight: '100vh', ...accentVar }}>
      <Shell nav={nav} />

      {/* Modals */}
      {approvalFor && (
        <ApprovalModal deliverable={approvalFor}
                        onClose={() => setApprovalFor(null)}
                        onApprove={onApprove}
                        onRequest={onRequest} />
      )}
      {contractFor && (
        <ContractModal contract={contractFor}
                        onClose={() => setContractFor(null)}
                        onSign={onSign} />
      )}

      <ToastStack />

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout direction" />
        <TweakSelect
          label="Layout"
          value={t.layout}
          options={[
            { value: 'sidebar',    label: '1 · Sidebar Classic' },
            { value: 'commandbar', label: '2 · Command Bar' },
            { value: 'focus',      label: '3 · Focus Mode' },
            { value: 'dock',       label: '4 · Studio Dock' },
            { value: 'split',      label: '5 · Split Workspace' },
          ]}
          onChange={v => setTweak('layout', v)} />
        <div style={{
          fontSize: 11, color: 'rgba(41,38,27,.55)',
          padding: '2px 0 0 2px', lineHeight: 1.4,
        }}>
          {LAYOUT_DESCRIPTIONS[t.layout]?.sub}
        </div>

        <TweakSection label="System" />
        <TweakRadio label="Density"
                    value={t.density}
                    options={['compact', 'regular', 'comfy']}
                    onChange={v => setTweak('density', v)} />
        <TweakColor label="Accent"
                    value={t.accent === 'rust' ? '#B24C40' : t.accent === 'gold' ? '#D4A020' : '#C9B89E'}
                    options={['#B24C40', '#D4A020', '#C9B89E']}
                    onChange={v => setTweak('accent',
                      v === '#B24C40' ? 'rust' : v === '#D4A020' ? 'gold' : 'cream')} />

        <TweakSection label="Display" />
        <TweakToggle label="Show activity feed"
                     value={t.showActivity}
                     onChange={v => setTweak('showActivity', v)} />

        <div style={{
          marginTop: 8, padding: '10px 0 0',
          borderTop: '0.5px solid rgba(0,0,0,0.08)',
          fontSize: 11, color: 'rgba(41,38,27,.55)', lineHeight: 1.5,
        }}>
          <b style={{ fontWeight: 600 }}>Beta tester notes:</b><br/>
          Each layout is a complete agency-view direction. Click around — the deliverable approval, intake form, contract signing, and inbox all work across every layout.
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
