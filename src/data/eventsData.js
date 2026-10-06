/**
 * ==============================================================================
 * RUVERSE 2026 — CENTRALIZED EVENT DATABASE & CATEGORY SYSTEM
 * ==============================================================================
 * SINGLE SOURCE OF TRUTH for all event data, dates, categories, and links.
 *
 * How to use:
 * - To ADD an event: Add a new object to `EVENTS`.
 * - To REMOVE an event: Delete the object from `EVENTS`.
 * - To EDIT an event: Modify title, categories, image, description, dates, registrationUrl.
 * - To ADD/REMOVE a filter tab: Add/remove an entry in `EVENT_CATEGORIES`.
 * ==============================================================================
 */

/**
 * 1. EVENT_CATEGORIES Configuration
 * Controls the category filter tabs in the Events UI.
 * 'all' is the special system filter showing everything.
 */
export const EVENT_CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'hackathons', label: 'HACKATHONS' },
  { id: 'tech-coding', label: 'TECH & CODING' },
  { id: 'esports', label: 'ESPORTS' },
  { id: 'robotics', label: 'ROBOTICS & IoT' },
  { id: 'workshops', label: 'WORKSHOPS' },
  { id: 'clubs', label: 'STUDENT CLUBS' },
  { id: 'startup-expo', label: 'EXPO & STARTUPS' },
  { id: 'talks', label: 'TALKS & KEYNOTES' },
  { id: 'cultural', label: 'CULTURAL' }
];

/**
 * 2. Helper: Date Formatter
 * Formats date arrays into human-friendly sci-fi festival strings.
 * Examples:
 *   ["2026-10-21"] -> "21 OCT 2026"
 *   ["2026-10-21", "2026-10-22"] -> "21–22 OCT 2026"
 *   ["2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"] -> "21–24 OCT 2026"
 */
export function formatEventDates(dates) {
  if (!dates || !Array.isArray(dates) || dates.length === 0) return '';

  const monthNames = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  try {
    const parsed = dates.map((d) => {
      if (typeof d === 'string' && d.includes('-')) {
        const [year, month, day] = d.split('-').map(Number);
        return { day, month: month - 1, year };
      }
      const parts = d.split(' ');
      if (parts.length >= 3) {
        return {
          day: parseInt(parts[0], 10),
          month: monthNames.indexOf(parts[1].slice(0, 3).toUpperCase()),
          year: parseInt(parts[2], 10)
        };
      }
      return null;
    }).filter(Boolean);

    if (parsed.length === 0) return dates.join(', ');

    const days = parsed.map((p) => p.day).sort((a, b) => a - b);
    const minDay = days[0];
    const maxDay = days[days.length - 1];
    const m = parsed[0].month >= 0 ? monthNames[parsed[0].month] : 'OCT';
    const y = parsed[0].year || 2026;

    if (minDay === maxDay || parsed.length === 1) {
      return `${minDay} ${m} ${y}`;
    }
    return `${minDay}–${maxDay} ${m} ${y}`;
  } catch {
    return dates.join(' • ');
  }
}

/**
 * 3. CENTRAL EVENTS DATABASE
 * Central registry containing all official RUVERSE 2026 arenas and events.
 * Every event has a unique ID and canonical metadata.
 */
export const EVENTS = [
  // --- HACKATHONS & MAJOR TECH ---
  {
    id: 'hackathon',
    number: '01',
    title: 'HACKATHON',
    tagline: 'Code & Build',
    categories: ['hackathons', 'tech-coding'],
    image: null,
    description: 'Build solutions. Solve problems. Ship ideas in a 24-hour high-intensity sprint.',
    dates: ['2026-10-21', '2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'robotics-iot',
    number: '02',
    title: 'ROBOTICS & IoT',
    tagline: 'Hardware & Automation',
    categories: ['robotics', 'tech-coding'],
    image: null,
    description: 'Design, build, automate, and battle combat-ready bots and smart IoT devices.',
    dates: ['2026-10-21', '2026-10-22'],
    registrationUrl: ''
  },

  // --- ESPORTS ---
  {
    id: 'free-fire',
    number: '03',
    title: 'FREE FIRE',
    tagline: 'Battle Royale Arena',
    categories: ['esports'],
    image: null,
    description: 'Drop into the battleground, claim high ground, and outlast all opponents.',
    dates: ['2026-10-21', '2026-10-22'],
    registrationUrl: 'https://forms.gle/CBuBkoRpBA4xFhgL6'
  },
  {
    id: 'bgmi',
    number: '04',
    title: 'BGMI',
    tagline: 'Squad Tactical Showdown',
    categories: ['esports'],
    image: null,
    description: 'Squad combat, zone rotation strategy, and clutch precision gameplay.',
    dates: ['2026-10-22', '2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'valorant',
    number: '05',
    title: 'VALORANT',
    tagline: 'Tactical 5v5 FPS',
    categories: ['esports'],
    image: null,
    description: 'Agent ability synergy, site executions, and lightning-fast headshots.',
    dates: ['2026-10-23', '2026-10-24'],
    registrationUrl: ''
  },

  // --- TECH COMMUNITIES & ECOSYSTEMS ---
  {
    id: 'gdg',
    number: '06',
    title: 'GDG',
    tagline: 'Google Developer Groups',
    categories: ['tech-coding', 'workshops'],
    image: null,
    description: 'Workshops and tech talks on Cloud, Flutter, TensorFlow, and Google ecosystem.',
    dates: ['2026-10-21'],
    registrationUrl: ''
  },
  {
    id: 'gfg',
    number: '07',
    title: 'GFG',
    tagline: 'GeeksforGeeks Campus Arena',
    categories: ['tech-coding'],
    image: null,
    description: 'DSA speed sprints, competitive coding battles, and technical interview jams.',
    dates: ['2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'microsoft',
    number: '08',
    title: 'MICROSOFT',
    tagline: 'Azure & AI Innovations',
    categories: ['tech-coding', 'workshops'],
    image: null,
    description: 'Explore Azure services, Copilot toolchains, and modern cloud deployment architectures.',
    dates: ['2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'aws',
    number: '09',
    title: 'AWS',
    tagline: 'Cloud Architecture & Serverless',
    categories: ['tech-coding', 'workshops'],
    image: null,
    description: 'Architecting scalable cloud infrastructure, serverless pipelines, and AWS security.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'github',
    number: '10',
    title: 'GITHUB',
    tagline: 'Open Source & CI/CD Pipelines',
    categories: ['tech-coding', 'workshops'],
    image: null,
    description: 'Master git workflows, open source contribution etiquette, and GitHub Actions automation.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'huggingface',
    number: '11',
    title: 'HUGGINGFACE',
    tagline: 'Open ML & GenAI Models',
    categories: ['tech-coding', 'workshops'],
    image: null,
    description: 'Hands-on workshops deploying transformers, fine-tuning LLMs, and hosting AI Spaces.',
    dates: ['2026-10-24'],
    registrationUrl: ''
  },
  {
    id: 'cyber-security',
    number: '12',
    title: 'CYBER SECURITY',
    tagline: 'CTF & Ethical Hacking',
    categories: ['tech-coding', 'workshops'],
    image: null,
    description: 'Capture-the-Flag challenges, cryptography puzzles, web vulnerability auditing, and forensics.',
    dates: ['2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'icpc-cp',
    number: '13',
    title: 'ICPC AND CP CLUB',
    tagline: 'Algorithmic Masters',
    categories: ['tech-coding'],
    image: null,
    description: 'Intense time-constrained algorithmic problem-solving in ICPC tournament format.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },

  // --- GENERAL FESTIVAL TRACKS ---
  {
    id: 'workshops',
    number: '14',
    title: 'WORKSHOPS',
    tagline: 'Hands-on Skills & Labs',
    categories: ['workshops', 'tech-coding'],
    image: null,
    description: 'Learn, build, and experiment directly under the guidance of industry masters.',
    dates: ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'],
    registrationUrl: ''
  },
  {
    id: 'tech-expo',
    number: '15',
    title: 'TECH EXPO',
    tagline: 'Project Showcase',
    categories: ['startup-expo', 'tech-coding'],
    image: null,
    description: 'Showcase breakthrough engineering prototypes, robotics, and software inventions.',
    dates: ['2026-10-22', '2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'startup-innovation',
    number: '16',
    title: 'STARTUP & INNOVATION',
    tagline: 'Venture & Pitch',
    categories: ['startup-expo'],
    image: null,
    description: 'Venture pitch arena where student founders connect with angel investors and accelerators.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'talks-keynotes',
    number: '17',
    title: 'TALKS & KEYNOTES',
    tagline: 'Industry Insights',
    categories: ['talks'],
    image: null,
    description: 'Visionary keynotes, panel discussions, and career fireside chats with tech pioneers.',
    dates: ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'],
    registrationUrl: ''
  },

  // --- STUDENT CLUBS & DEPARTMENTAL ARENAS ---
  {
    id: 'central',
    number: '18',
    title: 'CENTRAL',
    tagline: 'Central Hub Operations',
    categories: ['clubs'],
    image: null,
    description: 'Core council arena coordinating central university initiatives and exhibitions.',
    dates: ['2026-10-21'],
    registrationUrl: ''
  },
  {
    id: 'mech-nexus',
    number: '19',
    title: 'MECHANICAL CLUB (MECHNEXUS)',
    tagline: 'Design, CAD & Thermal Systems',
    categories: ['clubs'],
    image: null,
    description: 'CAD modeling battles, structural analysis challenges, and automotive design showcases.',
    dates: ['2026-10-21'],
    registrationUrl: ''
  },
  {
    id: 'civil-club',
    number: '20',
    title: 'CIVIL CLUB',
    tagline: 'Structural Design & Smart Cities',
    categories: ['clubs'],
    image: null,
    description: 'Bridge building stress testing, CAD layout drafting, and sustainable material challenges.',
    dates: ['2026-10-21'],
    registrationUrl: ''
  },
  {
    id: 'et-ele-club',
    number: '21',
    title: 'ET+ELE CLUB',
    tagline: 'Circuits, Embedded & VLSI',
    categories: ['clubs', 'robotics'],
    image: null,
    description: 'PCB design sprint, circuit debugging showdown, and embedded signal processing.',
    dates: ['2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'mining-club',
    number: '22',
    title: 'MINING CLUB (MECHNEXUS)',
    tagline: 'Resource Tech & Geo-Analytics',
    categories: ['clubs'],
    image: null,
    description: 'Sustainable mineral extraction models, spatial surveying, and mine safety simulations.',
    dates: ['2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'management-club',
    number: '23',
    title: 'MANAGEMENT CLUB (R-FUSION)',
    tagline: 'Strategy & Brand Wars',
    categories: ['clubs', 'startup-expo'],
    image: null,
    description: 'Business case simulations, crisis management drills, and marketing pitch challenges.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'commerce-club',
    number: '24',
    title: 'COMMERCE CLUB (R-FINCOM)',
    tagline: 'FinTech & Stock Mock Simulation',
    categories: ['clubs'],
    image: null,
    description: 'Live virtual stock trading simulation, algorithmic portfolio management, and financial valuation.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'pharmacy-club',
    number: '25',
    title: 'PHARMACY CLUB (PHARMAPRENURE)',
    tagline: 'PharmaTech & Drug Formulation',
    categories: ['clubs'],
    image: null,
    description: 'Poster presentations, pharma entrepreneurship pitches, and formulation innovations.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'biotech-club',
    number: '26',
    title: 'BIOTECHNOLOGY CLUB (R-BIOVERSE)',
    tagline: 'Bioinformatics & Genetic Engineering',
    categories: ['clubs'],
    image: null,
    description: 'Computational biology hack, CRISPR conceptual modeling, and bioprocess exhibitions.',
    dates: ['2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'forensic-club',
    number: '27',
    title: 'FORENSIC CLUB (RESILIENCE)',
    tagline: 'Crime Scene Investigation',
    categories: ['clubs'],
    image: null,
    description: 'Mock crime scene investigation, fingerprint analysis, and digital forensic deduction.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'film-media-club',
    number: '28',
    title: 'FILM AND MEDIA CLUB (RUSH)',
    tagline: 'Cinematography & Short Film Showcase',
    categories: ['clubs', 'cultural'],
    image: null,
    description: 'Short film competition, drone filmmaking showcases, and digital storytelling workshops.',
    dates: ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'],
    registrationUrl: ''
  },
  {
    id: 'rubi-club',
    number: '29',
    title: 'RUBI CLUB',
    tagline: 'Student Incubator & Makers',
    categories: ['clubs'],
    image: null,
    description: 'Makerspace build challenge and hardware prototype demonstrations.',
    dates: ['2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'education-club',
    number: '30',
    title: 'EDUCATION CLUB',
    tagline: 'EdTech & Knowledge Exchange',
    categories: ['clubs'],
    image: null,
    description: 'Innovations in digital literacy, gamified learning models, and educational hack challenges.',
    dates: ['2026-10-22'],
    registrationUrl: ''
  },
  {
    id: 'law-club',
    number: '31',
    title: 'LAW CLUB (R-LEXHUB)',
    tagline: 'Moot Court & Cyber Law Debates',
    categories: ['clubs'],
    image: null,
    description: 'Simulated moot court trials, AI ethics debates, and cyber law policy drafting.',
    dates: ['2026-10-23'],
    registrationUrl: ''
  },
  {
    id: 'upsc-club',
    number: '32',
    title: 'UPSC CLUB',
    tagline: 'Policy Think Tank & Governance',
    categories: ['clubs', 'talks'],
    image: null,
    description: 'National youth parliament simulation, geopolitical analysis quiz, and public policy drafting.',
    dates: ['2026-10-24'],
    registrationUrl: ''
  },
  {
    id: 'ic-club',
    number: '33',
    title: 'IC',
    tagline: 'Innovation & Incubation Council',
    categories: ['clubs', 'tech-coding'],
    image: null,
    description: 'IPR filing workshops, patent landscape analyses, and technology commercialization guidance.',
    dates: ['2026-10-24'],
    registrationUrl: ''
  },

  // --- GRAND FINALE ---
  {
    id: 'cultural-night',
    number: '34',
    title: 'CULTURAL NIGHT',
    tagline: 'Grand Festival Finale',
    categories: ['cultural'],
    image: null,
    description: 'Celebrate the completion of the voyage with live concert performances and grand ceremonies.',
    dates: ['2026-10-24'],
    registrationUrl: ''
  }
];

/**
 * 4. Backward-compatibility alias
 */
export const eventsData = EVENTS;

/**
 * 5. Development Validation System
 * Checks for duplicate IDs and unknown categories during development.
 */
function validateEventDatabase() {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;

  const validCategoryIds = new Set(EVENT_CATEGORIES.map((c) => c.id));
  const seenIds = new Set();

  EVENTS.forEach((event) => {
    // Check duplicate ID
    if (seenIds.has(event.id)) {
      console.warn(`[RUVERSE EVENT DATA] Duplicate event ID detected: "${event.id}"`);
    }
    seenIds.add(event.id);

    // Check categories
    const categoriesToCheck = Array.isArray(event.categories)
      ? event.categories
      : event.category
        ? [event.category]
        : [];

    categoriesToCheck.forEach((catId) => {
      if (!validCategoryIds.has(catId) && catId !== 'all') {
        console.warn(
          `[RUVERSE EVENT DATA] Event "${event.id}" references unknown category "${catId}". Available in EVENT_CATEGORIES:`,
          Array.from(validCategoryIds)
        );
      }
    });
  });
}

// Run validation once in development
validateEventDatabase();
