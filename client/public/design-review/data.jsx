// data.jsx — shared mock data for Duo Portal
// Realistic hero data for "Brookside Dental"; placeholders for the rest.

const STAFF = [
  { id: 'jc',  name: 'Jordan Cole',    role: 'Creative Director', initials: 'JC' },
  { id: 'mr',  name: 'Mara Reyes',     role: 'Project Manager',   initials: 'MR' },
  { id: 'as',  name: 'Avery Stone',    role: 'Lead Designer',     initials: 'AS' },
  { id: 'dh',  name: 'Devin Hart',     role: 'Developer',         initials: 'DH' },
  { id: 'kk',  name: 'Kai Knutson',    role: 'Video Producer',    initials: 'KK' },
];

const CLIENTS = [
  {
    id: 'brookside',
    name: 'Brookside Dental',
    initials: 'BD',
    industry: 'Healthcare',
    project: 'Website redesign + brand video',
    phase: 'Design',
    progress: 42,
    contact: { name: 'Dr. Elena Brookside', email: 'elena@brooksidedental.com' },
    assigned: ['mr', 'as', 'dh'],
    startedAt: 'Mar 18, 2026',
    targetLaunch: 'Jul 22, 2026',
    activity: '2h ago',
    pendingApprovals: 2,
    awaitingClient: 1,
    flag: 'action',
    unread: 3,
  },
  {
    id: 'northpine',
    name: 'North Pine Outfitters',
    initials: 'NP',
    industry: 'Retail',
    project: 'E-commerce build + product video series',
    phase: 'Development',
    progress: 68,
    contact: { name: 'Sam Whitlock', email: 'sam@northpine.co' },
    assigned: ['mr', 'dh', 'kk'],
    startedAt: 'Jan 12, 2026',
    targetLaunch: 'Jun 04, 2026',
    activity: 'yesterday',
    pendingApprovals: 0,
    awaitingClient: 3,
    flag: 'waiting',
    unread: 0,
  },
  {
    id: 'sagewood',
    name: 'Sagewood Counseling',
    initials: 'SC',
    industry: 'Healthcare',
    project: 'New site + intake automation',
    phase: 'Discovery',
    progress: 14,
    contact: { name: 'Rita Hayes', email: 'rita@sagewoodcounseling.com' },
    assigned: ['mr', 'as'],
    startedAt: 'Apr 28, 2026',
    targetLaunch: 'Aug 11, 2026',
    activity: '4d ago',
    pendingApprovals: 0,
    awaitingClient: 5,
    flag: 'onboarding',
    unread: 1,
  },
  {
    id: 'kettleforge',
    name: 'Kettle & Forge',
    initials: 'KF',
    industry: 'Hospitality',
    project: 'Restaurant brand refresh + site',
    phase: 'Launch',
    progress: 92,
    contact: { name: 'Marcus Vela', email: 'marcus@kettleforge.com' },
    assigned: ['jc', 'mr', 'as'],
    startedAt: 'Nov 04, 2025',
    targetLaunch: 'May 21, 2026',
    activity: '6h ago',
    pendingApprovals: 1,
    awaitingClient: 0,
    flag: 'action',
    unread: 0,
  },
  {
    id: 'lakeridge',
    name: 'Lakeridge Realty',
    initials: 'LR',
    industry: 'Real Estate',
    project: 'IDX site + listing video templates',
    phase: 'Development',
    progress: 55,
    contact: { name: 'Brett Donnelly', email: 'brett@lakeridge.com' },
    assigned: ['dh', 'kk'],
    startedAt: 'Feb 02, 2026',
    targetLaunch: 'Jul 09, 2026',
    activity: '3d ago',
    pendingApprovals: 0,
    awaitingClient: 0,
    flag: 'on-track',
    unread: 0,
  },
  {
    id: 'cedarcraft',
    name: 'Cedarcraft Studio',
    initials: 'CC',
    industry: 'Maker',
    project: 'Portfolio site + workshop video',
    phase: 'Post-launch',
    progress: 100,
    contact: { name: 'June Halverson', email: 'june@cedarcraft.studio' },
    assigned: ['as', 'kk'],
    startedAt: 'Sep 14, 2025',
    targetLaunch: 'Feb 28, 2026',
    activity: '1w ago',
    pendingApprovals: 0,
    awaitingClient: 1,
    flag: 'reporting',
    unread: 0,
  },
];

// Hero client project structure (Brookside Dental)
const PHASES = [
  {
    id: 'discovery', name: 'Discovery', status: 'complete', startedAt: 'Mar 18', completedAt: 'Apr 02',
    summary: 'Kickoff, intake, audit, sitemap',
    milestones: [
      { id: 'm1', name: 'Kickoff & intake', status: 'complete', date: 'Mar 18' },
      { id: 'm2', name: 'Brand & content audit', status: 'complete', date: 'Mar 25' },
      { id: 'm3', name: 'Sitemap approval', status: 'complete', date: 'Apr 02' },
    ],
  },
  {
    id: 'design', name: 'Design', status: 'active', startedAt: 'Apr 03', completedAt: null,
    summary: 'Brand direction, wireframes, hi-fi mockups',
    milestones: [
      { id: 'm4', name: 'Brand direction', status: 'complete', date: 'Apr 14' },
      { id: 'm5', name: 'Homepage hi-fi mockup', status: 'active', date: 'May 14',
        deliverables: ['d1', 'd2'] },
      { id: 'm6', name: 'Interior page templates', status: 'upcoming', date: 'May 28' },
      { id: 'm7', name: 'Brand video storyboard', status: 'upcoming', date: 'Jun 04' },
    ],
  },
  {
    id: 'development', name: 'Development', status: 'upcoming', startedAt: null, completedAt: null,
    summary: 'Build, integrate, populate',
    milestones: [
      { id: 'm8', name: 'WordPress build kickoff', status: 'upcoming', date: 'Jun 11' },
      { id: 'm9', name: 'Content migration', status: 'upcoming', date: 'Jun 25' },
      { id: 'm10', name: 'Forms & integrations', status: 'upcoming', date: 'Jul 02' },
    ],
  },
  {
    id: 'launch', name: 'Launch', status: 'upcoming', startedAt: null, completedAt: null,
    summary: 'QA, DNS, training, go-live',
    milestones: [
      { id: 'm11', name: 'Staging review', status: 'upcoming', date: 'Jul 09' },
      { id: 'm12', name: 'Go-live', status: 'upcoming', date: 'Jul 22' },
    ],
  },
  {
    id: 'post-launch', name: 'Post-Launch', status: 'upcoming', startedAt: null, completedAt: null,
    summary: '90-day support, monthly reporting',
    milestones: [
      { id: 'm13', name: '30-day check-in', status: 'upcoming', date: 'Aug 22' },
    ],
  },
];

const DELIVERABLES = [
  {
    id: 'd1', name: 'Homepage hi-fi — Direction A',
    type: 'design',
    thumb: 'homepage A',
    submittedAt: 'May 09, 2026',
    submittedBy: 'Avery Stone',
    status: 'pending', // pending | changes-requested | approved
    description: 'Warm, editorial layout with full-bleed hero video. Centers Dr. Brookside as the practice voice.',
    revisions: [
      { v: 'v1', date: 'May 09', note: 'Initial submission' },
    ],
  },
  {
    id: 'd2', name: 'Homepage hi-fi — Direction B',
    type: 'design',
    thumb: 'homepage B',
    submittedAt: 'May 09, 2026',
    submittedBy: 'Avery Stone',
    status: 'pending',
    description: 'Service-first, calm clinical layout. Quick paths to "Book", "Pricing", "Insurance".',
    revisions: [
      { v: 'v1', date: 'May 09', note: 'Initial submission' },
    ],
  },
  {
    id: 'd0', name: 'Brand direction board',
    type: 'design',
    thumb: 'brand board',
    submittedAt: 'Apr 14, 2026',
    submittedBy: 'Jordan Cole',
    status: 'approved',
    description: 'Approved palette, typography pairing, and tonal direction.',
    revisions: [
      { v: 'v1', date: 'Apr 11', note: 'Initial submission' },
      { v: 'v2', date: 'Apr 14', note: 'Updated cream weight, finalized type pairing' },
    ],
  },
  {
    id: 'd-1', name: 'Sitemap v3',
    type: 'document',
    thumb: 'sitemap',
    submittedAt: 'Apr 02, 2026',
    submittedBy: 'Mara Reyes',
    status: 'approved',
    description: '',
    revisions: [{ v: 'v3', date: 'Apr 02', note: 'Merged Insurance + Pricing per client feedback' }],
  },
];

const CHECKLIST = [
  { id: 'c1', label: 'Staff headshots (5 dentists, 2 hygienists)', status: 'submitted',
    submittedAt: 'May 06', note: '7 photos uploaded' },
  { id: 'c2', label: 'Updated services & pricing list', status: 'approved',
    submittedAt: 'Apr 22' },
  { id: 'c3', label: 'Patient testimonials (3 minimum, signed releases)', status: 'awaiting',
    requestedAt: 'Apr 18' },
  { id: 'c4', label: 'Insurance carriers — current list', status: 'awaiting',
    requestedAt: 'May 01' },
  { id: 'c5', label: 'Google Business Profile access (manager invite)', status: 'changes-requested',
    requestedAt: 'Apr 25', note: 'Invite sent to wrong email — please resend to jordan@awakencreativecda.com' },
];

const FILES = [
  { id: 'f1', name: 'Brookside_logo_master.zip', size: '14.2 MB', uploaded: 'Apr 14', by: 'Avery Stone', kind: 'archive' },
  { id: 'f2', name: 'Brand-guidelines-v2.pdf', size: '3.1 MB', uploaded: 'Apr 16', by: 'Jordan Cole', kind: 'pdf' },
  { id: 'f3', name: 'Practice-photos-batch-1.zip', size: '128 MB', uploaded: 'May 06', by: 'Elena Brookside', kind: 'archive' },
  { id: 'f4', name: 'Homepage-direction-A.fig', size: '8.4 MB', uploaded: 'May 09', by: 'Avery Stone', kind: 'design' },
  { id: 'f5', name: 'Homepage-direction-B.fig', size: '8.1 MB', uploaded: 'May 09', by: 'Avery Stone', kind: 'design' },
  { id: 'f6', name: 'Voiceover-script-v1.docx', size: '24 KB', uploaded: 'May 11', by: 'Kai Knutson', kind: 'doc' },
];

const MESSAGES = [
  { id: 'msg1', from: 'mr', author: 'Mara Reyes', side: 'agency',
    body: 'Hi Elena — two homepage directions are ready for your review. They take different approaches: A leans editorial, B leans service-first. Take your time. Either is a strong foundation.',
    time: 'May 09 · 2:14 PM', read: true },
  { id: 'msg2', from: 'client', author: 'Elena Brookside', side: 'client',
    body: 'Just opened them — wow. I think A might be the one but I want to sit with both. Can we keep the testimonial pull-quotes from B if we go with A?',
    time: 'May 10 · 9:02 AM', read: true },
  { id: 'msg3', from: 'mr', author: 'Mara Reyes', side: 'agency',
    body: 'Absolutely. That kind of mixing is exactly what these directions are for. I\'ll note it in the revision request.',
    time: 'May 10 · 10:30 AM', read: true },
  { id: 'msg4', from: 'client', author: 'Elena Brookside', side: 'client',
    body: 'Also — I have the testimonial releases now. Where do I upload them?',
    time: 'May 12 · 4:45 PM', read: false },
];

const ACTIVITY = [
  { id: 'a1', when: '2h ago', who: 'Elena Brookside', action: 'sent a message in the project thread', kind: 'message' },
  { id: 'a2', when: '6h ago', who: 'Avery Stone', action: 'uploaded Homepage-direction-A.fig', kind: 'file' },
  { id: 'a3', when: 'yesterday', who: 'Elena Brookside', action: 'submitted "Staff headshots" for review', kind: 'checklist' },
  { id: 'a4', when: 'yesterday', who: 'Mara Reyes', action: 'submitted two deliverables for client review', kind: 'deliverable' },
  { id: 'a5', when: '3d ago', who: 'Jordan Cole', action: 'marked "Brand direction" approved', kind: 'approval' },
  { id: 'a6', when: '5d ago', who: 'System', action: 'sent monthly progress report to Elena', kind: 'system' },
];

const ACTION_ITEMS = [
  { id: 'ai1', client: 'Kettle & Forge', label: 'Approve final menu page copy', priority: 'high', due: 'today' },
  { id: 'ai2', client: 'Brookside Dental', label: 'Respond to Elena\'s message re: testimonials', priority: 'high', due: 'today' },
  { id: 'ai3', client: 'Lakeridge Realty', label: 'Review staging build before client walkthrough', priority: 'medium', due: 'tomorrow' },
  { id: 'ai4', client: 'Sagewood Counseling', label: 'Send onboarding intake reminder', priority: 'low', due: 'this week' },
];

const WAITING_ON_CLIENT = [
  { id: 'wc1', client: 'North Pine Outfitters', label: 'Product photography batch 2 (24 SKUs)', age: '5 days' },
  { id: 'wc2', client: 'Sagewood Counseling', label: 'Onboarding intake form', age: '3 days' },
  { id: 'wc3', client: 'Brookside Dental', label: 'Testimonial release forms (3)', age: '2 days' },
  { id: 'wc4', client: 'Sagewood Counseling', label: 'Google Analytics access', age: '3 days' },
];

const UPCOMING_MILESTONES = [
  { id: 'um1', client: 'Brookside Dental', label: 'Homepage hi-fi review window closes', date: 'May 16' },
  { id: 'um2', client: 'Kettle & Forge', label: 'Go-live', date: 'May 21' },
  { id: 'um3', client: 'North Pine Outfitters', label: 'Staging review', date: 'May 28' },
  { id: 'um4', client: 'Brookside Dental', label: 'Interior page templates due', date: 'May 28' },
];

const REPORTS_DUE = [
  { id: 'r1', client: 'Cedarcraft Studio', kind: 'Monthly performance', due: 'May 14' },
  { id: 'r2', client: 'Lakeridge Realty', kind: 'Build progress', due: 'May 16' },
  { id: 'r3', client: 'Kettle & Forge', kind: 'Pre-launch QA', due: 'May 19' },
];

const CONTRACTS = [
  { id: 'co1', name: 'Master services agreement', signedAt: 'Mar 18, 2026', status: 'signed', signedBy: 'Dr. Elena Brookside' },
  { id: 'co2', name: 'Brand video addendum', signedAt: null, status: 'pending', sentAt: 'May 02, 2026' },
];

const INVOICES = [
  { id: 'in1', num: '#2026-0118', amount: 4800, status: 'paid', issued: 'Mar 18', paid: 'Mar 22' },
  { id: 'in2', num: '#2026-0142', amount: 6200, status: 'paid', issued: 'Apr 15', paid: 'Apr 19' },
  { id: 'in3', num: '#2026-0163', amount: 5400, status: 'sent', issued: 'May 09', paid: null },
];

const ANALYTICS_IDS = [
  { id: 'ga4',   label: 'Google Analytics 4',   value: 'G-XXXXXXXXXX',     status: 'pending', icon: 'GA' },
  { id: 'gsc',   label: 'Search Console',       value: 'verified',         status: 'connected', icon: 'GSC' },
  { id: 'gads',  label: 'Google Ads',           value: '—',                status: 'not-set', icon: 'GAds' },
  { id: 'meta',  label: 'Meta Ads',             value: '—',                status: 'not-set', icon: 'Meta' },
  { id: 'gbp',   label: 'Google Business',      value: 'access requested', status: 'pending', icon: 'GBP' },
];

const INTAKE_SECTIONS = [
  {
    id: 'business', label: 'Business Info', complete: true,
    fields: [
      { k: 'Business name',     v: 'Brookside Dental' },
      { k: 'Industry',          v: 'General + cosmetic dentistry' },
      { k: 'Founded',           v: '2014' },
      { k: 'Locations',         v: '1 (Coeur d\'Alene, ID)' },
      { k: 'Hours',             v: 'Mon–Thu 7a–5p, Fri 7a–2p' },
      { k: 'Phone',             v: '(208) 555-0144' },
    ],
  },
  {
    id: 'brand', label: 'Brand Assets', complete: true,
    fields: [
      { k: 'Logo files',        v: '3 vector formats uploaded' },
      { k: 'Brand guide',       v: 'Existing v1 (2019) — to be refreshed' },
      { k: 'Typography',        v: 'No current standard' },
      { k: 'Color palette',     v: 'Sage / cream / warm clay (to be defined)' },
    ],
  },
  {
    id: 'voice', label: 'Voice & Audience', complete: true,
    fields: [
      { k: 'Audience',          v: 'Families, 25–55, North Idaho + Spokane' },
      { k: 'Tone',              v: 'Warm, calm, expert — not corporate' },
      { k: 'Differentiator',    v: '"Same dentist every visit." Continuity of care.' },
    ],
  },
  {
    id: 'access', label: 'Account Access', complete: false,
    fields: [
      { k: 'Domain registrar',  v: 'GoDaddy (admin access provided)' },
      { k: 'Current host',      v: 'Bluehost (transfer planned)' },
      { k: 'Google Workspace',  v: '⚠ access requested, awaiting' },
      { k: 'GA4',               v: '⚠ to be created' },
    ],
  },
  {
    id: 'billing', label: 'Billing & Terms', complete: true,
    fields: [
      { k: 'Billing contact',   v: 'Elena Brookside' },
      { k: 'Payment method',    v: 'ACH (set up in QuickBooks)' },
      { k: 'Schedule',          v: '40% kickoff / 30% design approval / 30% launch' },
    ],
  },
  {
    id: 'notes', label: 'Notes & Sensitivities', complete: true,
    fields: [
      { k: 'Notes',             v: 'Avoid stock dental imagery. Real practice photos only. Existing logo should evolve, not be replaced.' },
    ],
  },
];

// Awaken sunrise mark — cream, transparent. Recreated as inline SVG so we don't
// depend on a PNG. Three rays + horizon arc.
const AwakenMark = ({ size = 36, color = '#EFDCC6' }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} className="awaken-mark"
       fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    {/* horizon */}
    <line x1="6"  y1="48" x2="58" y2="48" />
    {/* sun arc */}
    <path d="M 18 48 A 14 14 0 0 1 46 48" />
    {/* center ray */}
    <line x1="32" y1="14" x2="32" y2="22" />
    {/* angled rays */}
    <line x1="13" y1="22" x2="19" y2="27" />
    <line x1="51" y1="22" x2="45" y2="27" />
    <line x1="6"  y1="36" x2="13" y2="38" />
    <line x1="58" y1="36" x2="51" y2="38" />
  </svg>
);

// Awaken wordmark (text only, in display font) — for layouts that show full lockup
const AwakenLockup = ({ size = 36, gap = 12, color = '#EFDCC6', sub = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap }}>
    <AwakenMark size={size} color={color} />
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: size * 0.55,
        letterSpacing: '0.08em', color, lineHeight: 1,
      }}>AWAKEN</span>
      {sub && <span style={{
        fontFamily: 'var(--font-body)', fontSize: size * 0.22, fontWeight: 500,
        letterSpacing: '0.34em', color, opacity: 0.6, marginTop: 4,
      }}>CREATIVE</span>}
    </div>
  </div>
);

Object.assign(window, {
  STAFF, CLIENTS, PHASES, DELIVERABLES, CHECKLIST, FILES, MESSAGES,
  ACTIVITY, ACTION_ITEMS, WAITING_ON_CLIENT, UPCOMING_MILESTONES,
  REPORTS_DUE, CONTRACTS, INVOICES, ANALYTICS_IDS, INTAKE_SECTIONS,
  AwakenMark, AwakenLockup,
});
