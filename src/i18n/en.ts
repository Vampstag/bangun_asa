/**
 * English dictionary. Same shape as id.ts (typed as `Dict`), so the build fails if anything is missing.
 * Proper names, addresses, and registration numbers are intentionally left as they are in Indonesian.
 */
import type { Dict } from './id';

export const en: Dict = {
  lang: 'en',
  ogLocale: 'en_US',
  meta: {
    tagline: 'Construction Services in Tuban, East Java',
    slogan: 'Turning Hope Into Reality',
    description:
      'Bangun Asa Konstruksi builds and renovates homes and commercial buildings in Tuban, East Java, and across Java. Founded in 2024, trusted by 200+ clients, with a transparent process.',
    areaServed: ['East Java', 'Central Java', 'West Java'],
  },
  nav: [
    { label: 'Services', href: '/#layanan' },
    { label: 'Work', href: '/#karya' },
    { label: 'Process', href: '/#proses' },
    { label: 'Team', href: '/#tim' },
  ],
  navCta: { label: 'Free Consultation', href: '/#kontak' },
  ui: {
    home: 'home',
    mainNav: 'Main',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    menuContact: 'Contact',
    language: 'Language',
    quickContact: 'Quick contact',
    chatWhatsApp: 'Chat on WhatsApp',
    chatWhatsAppAria: 'Chat on WhatsApp',
    backToTop: 'Back to top ↑',
    step: 'Step',
  },
  whatsappText:
    'Hello Bangun Asa Konstruksi, I would like to consult about a project. Please send me more information. Thank you.',
  footer: { location: 'Our location', navigation: 'Navigation', contact: 'Contact us', follow: 'Follow' },
  menu: {
    nav: 'Menu',
    chatWith: 'Chat on WhatsApp with',
    callTo: 'Call',
    directions: 'Directions',
  },
  map: {
    show: 'Show map',
    note: 'Loaded from Google Maps when clicked',
    loading: 'Loading map…',
    directions: 'Directions',
    open: 'Open in Google Maps',
    title: 'Location map',
  },
  lightbox: {
    label: 'Image preview',
    close: 'Close preview',
    prev: 'Previous image',
    next: 'Next image',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset zoom',
  },
  cta: {
    label: 'Contact',
    title: 'Have a project?|Let’s talk.',
    whatsapp: 'Chat on WhatsApp',
    note: 'Free consultation with a transparent budget estimate. No risk until you are completely sure.',
  },
  form: {
    title: 'Request a free quote',
    name: 'Full name',
    type: 'Project type',
    choose: 'Select',
    estimate: 'Estimated area / budget',
    estimatePlaceholder: 'E.g. 120 m² or IDR 500 million',
    location: 'Project location',
    locationPlaceholder: 'City / regency',
    details: 'Project details',
    submit: 'Send via WhatsApp',
    note: 'This button opens WhatsApp with a pre-filled message. You can still edit it before sending.',
    projectTypes: ['House', 'Shophouse', 'Office', 'Warehouse', 'Café / Restaurant', 'Renovation', 'Other'],
    message: {
      intro: 'Hello {brand}, I would like to request a quote.',
      name: 'Name',
      type: 'Project type',
      estimate: 'Estimated area / budget',
      location: 'Location',
      details: 'Project details',
    },
  },
  home: {
    hero: {
      tag: 'Construction · Tuban, East Java',
      title: 'Building Hope|Into Reality.',
      lead: 'Bangun Asa Konstruksi brings experience and dedication to turn your dream project into reality, from family homes to commercial buildings.',
      cta: 'Request a free quote',
      alt: 'Modern two-storey house built by Bangun Asa Konstruksi',
    },
    trust: {
      aria: 'Building types and legal documents',
      clientsLabel: 'What we build',
      clientsLead:
        'From family homes to places of business: every type of building delivered through a planned, transparent process.',
      items: [
        'Houses',
        'Shophouses',
        'Offices',
        'Warehouses',
        'Cafés & Restaurants',
        'Partial Renovation',
        'Full Renovation',
        'Commercial Buildings',
      ],
      legalLabel: 'Legal',
      legal: [
        { name: 'Company', text: 'PT BANGUN ASA KONSTRUKSI' },
        { name: 'Business Identification Number (NIB)', text: '1106260081441' },
        { name: 'Ministry of Law decree (AHU)', text: 'AHU-A095587.AH.01.30.Tahun 2026' },
      ],
      certsLabel: 'Competence',
      certsCaption:
        'Professional competence certificates of our experts. Hover to preview, click to view in full and zoom.',
      certs: [
        {
          title: 'Urban Drainage Site Supervisor',
          kind: 'Certificate of competence',
          alt: 'Certificate of competence: Urban Drainage Site Supervisor',
          attach: 'Attachment',
          attachAlt: 'Certificate attachment: Urban Drainage Site Supervisor',
        },
        {
          title: 'Junior Expert in Foundation Design',
          kind: 'Certificate of competence',
          alt: 'Certificate of competence: Junior Expert in Foundation Design',
          attach: 'Attachment',
          attachAlt: 'Certificate attachment: Junior Expert in Foundation Design',
        },
      ],
    },
    intro: {
      label: 'About us',
      text: 'We are more than an ordinary contractor. We are a building partner serving homes and commercial properties with precision, care, and consistent professionalism, from small renovations to large-scale projects.',
      imageAlt: 'Modern minimalist house built by Bangun Asa Konstruksi',
    },
    stats: [
      { text: 'Year PT Bangun Asa Konstruksi was founded.' },
      { text: 'Clients and projects entrusted to us.' },
      { text: 'Main regions: East Java, Central Java, and West Java.' },
    ],
    audience: {
      label: 'Who we work for',
      title: 'A trusted partner for business. A friendly contractor for your home.',
      cards: [
        {
          tag: 'B2B',
          who: 'Shophouses · Offices · Warehouses · Cafés & Restaurants',
          title: 'Trusted partner',
          text: 'Architects, estimators, and site supervisors work as one system, keeping every stage of commercial construction effective and consistently high in quality.',
          points: [
            'An integrated team: architect, estimator, site supervisor',
            'Cost estimate (RAB) and technical survey before the project starts',
            'Clear contract: scope, value, schedule, payment scheme',
            'Regular monitoring and progress updates',
          ],
          cta: 'Request a quote',
          alt: 'Multi-storey building with a tower crane under construction',
        },
        {
          tag: 'B2C',
          who: 'Homeowners · Families',
          title: 'Friendly contractor',
          text: 'Where families grow. We build and renovate homes to high standards, with materials that meet specification and thorough supervision.',
          points: [
            'Free consultation, no risk until you are sure',
            'A flexible budget that fits your means',
            'Budget, materials, and schedule explained openly',
            'Progress reports you can follow',
          ],
          cta: 'Consult about your home',
          alt: 'Terrace and facade of a minimalist house built by Bangun Asa Konstruksi',
        },
      ],
    },
    services: {
      label: 'Services',
      title: 'From homes to workplaces, built right from the start.',
      cta: 'Discuss this service',
      items: [
        {
          title: 'New Construction',
          text: 'Houses, shophouses, offices, warehouses, cafés, restaurants, and other commercial buildings, delivered through a planned, transparent, quality-driven process.',
        },
        {
          title: 'Renovation',
          text: 'Partial or full renovation for homes and commercial buildings, improving function, comfort, and value.',
        },
        {
          title: 'Full Renovation',
          text: 'A complete renewal from start to finish: restructuring plans, material selection, and on-site execution.',
        },
        {
          title: 'Commercial Buildings',
          text: 'Shophouses, offices, warehouses, cafés, and restaurants built by an integrated team of architects, estimators, and site supervisors.',
        },
      ],
    },
    work: {
      label: 'Selected work',
      title: 'Every building is made with precision and care.',
      /** Daftar proyek ada di src/data/content/projects.json (diedit lewat CMS). */
      end: { label: 'Your next project', title: 'Could be yours.' },
    },
    process: {
      label: 'How we work',
      title: 'Six steps, one consistent standard.',
      lead: 'From the first consultation to handover, our team stays with you at every stage, with a process built on clarity, careful planning, and consistent quality.',
      steps: [
        {
          title: 'Consultation',
          text: 'We start with an initial consultation to understand your needs, location, and budget.',
        },
        {
          title: 'Planning',
          text: 'Cost estimate (RAB), a technical site survey, and a finalised design and budget. Everything is agreed before the project begins.',
        },
        {
          title: 'Contract',
          text: 'The agreement is set out in a clear contract: scope of work, project value, schedule, and payment scheme.',
        },
        {
          title: 'Execution',
          text: 'Construction or renovation proceeds as planned, with regular monitoring and progress updates.',
        },
        { title: 'Finishing', text: 'The final stage, so that every detail is neat and to specification.' },
        {
          title: 'Quality control',
          text: 'A thorough inspection to make sure the result meets specification, looks neat, and is ready to be handed over to you.',
        },
      ],
    },
    team: {
      label: 'Team',
      title: 'The people behind every building.',
      lead: 'Architects, estimators, site supervisors, and construction crews work as one system so every stage runs effectively and in step.',
      alt: 'Bangun Asa Konstruksi team photo: nine team members with their names and titles',
      members: [
        { name: 'Pandu Ario Pratanu', role: 'General Manager' },
        { name: 'Hujan Setiakita', role: 'Project Manager' },
        { name: 'Joko Sunarto', role: 'Supervisor' },
        { name: 'Mu’tashimuddin', role: 'Public Relations & Legal' },
        { name: 'M. Fatchul Riski', role: 'Site Supervisor' },
        { name: 'Rayana Surya Wiranata', role: 'Site Supervisor' },
        { name: 'Reza Aprilia', role: 'Project Admin' },
        { name: 'Islamiana Darma Siwi', role: 'Customer Service' },
        { name: 'Lifyatin Nuzulul Rohmah', role: 'Architect' },
      ],
    },
    quote: {
      label: 'What they say',
      /** "|" = pindah baris. Isi testimoni ada di src/data/testimonials.ts. */
      title: 'Trusted first-hand|by our clients.',
      translated: 'Translated from the original Indonesian.',
      original: 'Original in Indonesian.',
      share: 'Used our services?',
      shareCta: 'Send a testimonial on WhatsApp',
      shareText: 'Hello Bangun Asa Konstruksi, I would like to send a testimonial about your service.',
    },
    faq: {
      label: 'FAQ',
      title: 'Frequently asked questions.',
      items: [
        {
          q: 'What sets Bangun Asa apart from other contractors?',
          a: 'We put transparency first at every stage, from budgeting and material specifications to the work schedule and progress reports, so clients can follow the project clearly. We are also flexible with budgets, without compromising safety, function, or build quality.',
        },
        {
          q: 'Is the consultation free?',
          a: 'Yes. You get a free consultation for your construction or renovation needs, complete with a transparent budget estimate that flexes to what you can invest. There is no risk until you are completely sure.',
        },
        {
          q: 'How long does a project take?',
          a: 'It depends on the scale, complexity, and type of building. A house typically takes a few months, while commercial projects can take longer. We prepare a detailed schedule from the planning stage, with regular progress reports.',
        },
        {
          q: 'Which areas does Bangun Asa Konstruksi serve?',
          a: 'Most of our projects are in East Java, but we are also trusted with projects in Central Java, West Java, and elsewhere in Java.',
        },
        {
          q: 'Why does early planning matter?',
          a: 'Without solid planning, budgets can balloon from mid-project design changes, legal documents and permits can hold things up, and schedules can slip. Preparing early also makes buildings last longer with minimal repair costs.',
        },
      ],
    },
  },
};
