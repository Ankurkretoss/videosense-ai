/**
 * Copy and catalogue data for the VantageAI UI.
 *
 * Football is the only sport the analysis engine actually covers today, so every
 * other sport is listed as coming soon rather than being offered and failing.
 */

export interface SportEntry {
  name: string;
  abbr: string;
  metrics: string[];
  maps: string;
  available: boolean;
  model: string;
}

export const SPORTS: SportEntry[] = [
  {
    name: "Football",
    abbr: "FBL",
    metrics: ["Goals", "xG", "Pressing", "Heatmaps", "Formations"],
    maps: "Pitch maps",
    available: true,
    model:
      "Detects goals, shots, passes, touches, kicks, tackles, cards, xG, formations and pressing patterns.",
  },
  {
    name: "Basketball",
    abbr: "BSK",
    metrics: ["Shots", "3PT", "Assists", "Rebounds", "Turnovers"],
    maps: "Shot charts",
    available: false,
    model: "Shots by zone, 3-pointers, assists, rebounds, turnovers and defensive matchups.",
  },
  {
    name: "Cricket",
    abbr: "CRK",
    metrics: ["Runs", "Wickets", "Boundaries", "Bowling", "Pitch maps"],
    maps: "Pitch + wagon wheel",
    available: false,
    model: "Deliveries, runs, wickets, boundaries, shot placement and bowling zones.",
  },
  {
    name: "Tennis",
    abbr: "TNS",
    metrics: ["Serve", "Rally", "Winners", "Errors", "Placement"],
    maps: "Court maps",
    available: false,
    model: "Serves and placement, returns, rally length, winners, errors and court coverage.",
  },
  {
    name: "Baseball",
    abbr: "BSB",
    metrics: ["Pitching", "Batting", "Hits", "Strikeouts", "Bases"],
    maps: "Strike zone",
    available: false,
    model: "Pitch location, strike-zone outcomes, hits, runs and defensive plays.",
  },
  {
    name: "Ice Hockey",
    abbr: "ICE",
    metrics: ["Goals", "Faceoffs", "Zone entries", "Possession"],
    maps: "Rink maps",
    available: false,
    model: "Shots, goals, faceoffs, puck possession and zone entries.",
  },
  {
    name: "Rugby",
    abbr: "RGB",
    metrics: ["Tries", "Tackles", "Rucks", "Line breaks", "Territory"],
    maps: "Territory maps",
    available: false,
    model: "Tries, tackles, rucks, passes, line breaks and territory.",
  },
];

export interface NavEntry {
  label: string;
  href: string;
  available: boolean;
}

export const DASHBOARD_NAV: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", available: true },
  { label: "New analysis", href: "/dashboard/new", available: true },
  { label: "My matches", href: "/dashboard/matches", available: true },
  { label: "Players", href: "/dashboard/players", available: false },
  { label: "Teams", href: "/dashboard/teams", available: false },
  { label: "Clips", href: "/dashboard/clips", available: false },
  { label: "Reports", href: "/dashboard/reports", available: false },
  { label: "Analytics", href: "/dashboard/analytics", available: false },
  { label: "Settings", href: "/dashboard/settings", available: false },
];

export const COMING_SOON: Record<string, { title: string; blurb: string }> = {
  players: {
    title: "Players",
    blurb:
      "A searchable player database with season-long profiles, tracking trends and cross-match comparison.",
  },
  teams: {
    title: "Teams",
    blurb:
      "Squad and opposition management — rosters, formations used, and team-level trends across the season.",
  },
  clips: {
    title: "Clips",
    blurb: "A central clip library with playlists, tagging, and sharing to players and staff.",
  },
  reports: {
    title: "Reports",
    blurb:
      "Every generated match report in one place, with export, comparison and season summaries.",
  },
  analytics: {
    title: "Analytics",
    blurb:
      "Season analytics across matches: form curves, xG trends, pressing intensity and squad workload.",
  },
  settings: {
    title: "Settings",
    blurb: "Account, organisation, roles, billing and analysis-default preferences.",
  },
};

export const HERO_STATS = [
  { v: "132", k: "events per match" },
  { v: "22", k: "players tracked" },
  { v: "94%", k: "avg. AI confidence" },
  { v: "12 min", k: "to full report" },
];

export const VALUE_BAR = [
  "AI match analysis",
  "Player tracking",
  "Tactical intelligence",
  "Automated highlights",
  "Performance reports",
  "Football first",
];

export const STEPS = [
  {
    n: "01",
    title: "Upload your match",
    body: "Drop a full match file or paste a link. Nothing to tag, trim or prepare.",
    items: ["MP4 · MOV · MKV · WebM", "YouTube or direct URL", "Full matches", "Broadcast or tactical cam"],
  },
  {
    n: "02",
    title: "AI watches the match",
    body: "Every frame is processed: players, ball, teams, jersey numbers, movement and events.",
    items: ["Player + ball detection", "Jersey number reading", "Team assignment", "Event classification"],
  },
  {
    n: "03",
    title: "AI builds your report",
    body: "Structured intelligence, not a video dump — with the uncertain values flagged.",
    items: ["Match summary + timeline", "Player statistics + ratings", "Tactical analysis", "Heatmaps and shot maps"],
  },
  {
    n: "04",
    title: "Watch, share, improve",
    body: "Every detected moment becomes a clip your staff and players can act on.",
    items: ["Auto-cut highlight clips", "Jump-to-moment timeline", "Download or share", "Coaching recommendations"],
  },
];

export const FEATURES = [
  {
    i: "01",
    title: "AI match analysis",
    body: "Understand what happened across the full match — not just the goals.",
    tags: ["Full match", "Per-phase", "Evidence cited"],
  },
  {
    i: "02",
    title: "Player tracking",
    body: "Distance, speed, position, involvement and actions for every detected player.",
    tags: ["Distance", "Sprints", "Involvement"],
  },
  {
    i: "03",
    title: "Event detection",
    body: "Touches, passes, kicks, shots, goals, defensive actions and referee calls.",
    tags: ["Goals", "Cards", "Kick angles"],
  },
  {
    i: "04",
    title: "Tactical intelligence",
    body: "Formation, pressing, defensive shape, transitions and space creation.",
    tags: ["Formations", "Pressing", "Transitions"],
  },
  {
    i: "05",
    title: "Automatic highlights",
    body: "Every clip-worthy moment is cut from your own upload, ready to download.",
    tags: ["Auto-cut", "Download", "Player reels"],
  },
  {
    i: "06",
    title: "Player performance",
    body: "Profiles with ratings, key actions, strengths, watch-outs and coaching notes.",
    tags: ["Ratings", "Scouting", "Drills"],
  },
];

export const PLANS = [
  {
    name: "Free",
    badge: "",
    price: "—",
    per: "per month · placeholder",
    items: ["2 analyses / month", "Short clips", "Basic report", "3 clips per match"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    badge: "Most popular",
    price: "—",
    per: "per month · placeholder",
    items: ["40 analyses / month", "Full match length", "Advanced player analytics", "Tactical analysis + clips"],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Team",
    badge: "",
    price: "—",
    per: "per month · placeholder",
    items: ["Multiple users + roles", "Player database", "Shared reports", "Season analytics"],
    cta: "Talk to us",
    featured: false,
  },
  {
    name: "Enterprise",
    badge: "",
    price: "—",
    per: "custom · placeholder",
    items: ["Custom limits", "API access", "Custom AI models", "Dedicated support"],
    cta: "Contact sales",
    featured: false,
  },
];

export const FAQS: [string, string][] = [
  [
    "Which sports work today?",
    "Football is fully covered end to end. The other sports are listed on the roadmap and are marked coming soon in the product — the engine is built so a new sport adds its own event model and maps.",
  ],
  [
    "How long does an analysis take?",
    "It depends on the clip length and your connection. A short clip is a couple of minutes; a full match takes longer because the footage is analysed in three passes.",
  ],
  [
    "How accurate is it?",
    "Jersey numbers, distances, speeds, angles and xG are AI estimates read from the footage. Anything uncertain is flagged in the report so you know what to verify.",
  ],
  [
    "Where do the highlight clips come from?",
    "Clips are cut from your own upload in the browser — nothing is re-uploaded, and you can download individual clips, a per-player reel or the whole set as a ZIP.",
  ],
  [
    "Do I need to tag anything manually?",
    "No. Upload the footage and the analysis produces the events, players, tactics and clips on its own.",
  ],
  [
    "Can multiple coaches use one account?",
    "Team and enterprise plans support multiple users with roles and shared reports.",
  ],
];

export const FOOTER_COLUMNS = [
  { title: "Product", links: ["Features", "Sports", "Pricing", "Demo", "API"] },
  { title: "Resources", links: ["Documentation", "Help centre", "Blog", "Analytics guide"] },
  { title: "Company", links: ["About", "Contact", "Careers"] },
  { title: "Legal", links: ["Privacy", "Terms", "Cookie policy"] },
];

export const AUTH_PROOF = [
  { v: "132", k: "events detected per match" },
  { v: "22", k: "players tracked per match" },
  { v: "12", k: "clip-ready moments" },
  { v: "0", k: "manual tags required" },
];

export const ROLES = ["Coach", "Analyst", "Scout", "Player", "Team manager", "Academy", "Other"];
