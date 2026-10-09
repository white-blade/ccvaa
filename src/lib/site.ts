export const siteConfig = {
  name: "Coast to Coast Visual Arts Association",
  shortName: "CCVAA",
  navSubtitle: "Visual Arts Association",
  tagline: "Connecting communities through visual arts across Canada",
  description:
    "A British Columbia–based non-profit fostering visual arts education, exhibitions, and community engagement from coast to coast.",
  url: "https://ccvaa.ca",
  locale: "en-CA",
  logo: {
    src: "/images/logo-ondark.png",
    srcOnLight: "/images/logo-onlight.png",
    alt: "Coast to Coast",
    width: 762,
    height: 206,
  },
} as const;

export const organization = {
  legalName: "Coast to Coast Visual Arts Association",
  registrationNote:
    "Registered non-profit organization in British Columbia, Canada.",
  email: "info@ccvaa.ca",
  location: "Richmond, British Columbia, Canada",
  address: {
    line1: "4 – 8800 Hazelbridge Way",
    city: "Richmond",
    province: "BC",
    postalCode: "V6X 0S3",
    country: "Canada",
  },
} as const;

export const navigation = [
  /** Root-relative so these resolve from /membership too, not just the home page. */
  { label: "About", href: "/#about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Events", href: "/events" },
  { label: "Contact", href: "/#contact" },
  { label: "Membership", href: "/membership" },
] as const;

export const heroContent = {
  eyebrow: "Non-profit · British Columbia, Canada",
  headline: "Celebrating visual arts from coast to coast",
  subheadline:
    "We bring artists, educators, and communities together to create, learn, and share the power of visual expression.",
} as const;

export const aboutContent = {
  title: "About",
  paragraphs: [
    "Coast to Coast Visual Arts Association (CCVAA) is a registered non-profit society in British Columbia, dedicated to advancing visual arts across Canada.",
    "We bring artists, educators, and communities together through exhibitions, education, and cultural programming — from local workshops to coast-to-coast collaboration.",
    "Whether you are an artist, educator, volunteer, or art enthusiast, we invite you to join our growing community.",
  ],
  purposesHeading: "Our Purposes",
  purposes: [
    {
      title: "Advancement of Visual Arts",
      description:
        "To promote, support, and advance the creation, appreciation, study, and public understanding of visual arts, including but not limited to photography, painting, drawing, printmaking, sculpture, digital art, mixed media, installation art, and emerging artistic practices.",
    },
    {
      title: "Artistic Development",
      description:
        "To encourage artistic excellence, innovation, experimentation, and professional development among artists, photographers, educators, curators, students, and art enthusiasts.",
    },
    {
      title: "Exhibitions and Public Programs",
      description:
        "To organize, sponsor, and present exhibitions, festivals, lectures, workshops, artist talks, screenings, publications, and other cultural activities that foster public engagement with the arts.",
    },
    {
      title: "Education",
      description:
        "To provide educational opportunities that increase knowledge, skills, and appreciation of visual arts through instruction, mentorship, outreach programs, and lifelong learning initiatives.",
    },
    {
      title: "Cultural Exchange",
      description:
        "To facilitate local, national, and international artistic and cultural exchange, collaboration, and dialogue among artists, cultural organizations, educational institutions, and communities.",
    },
    {
      title: "Community Engagement",
      description:
        "To strengthen community participation in the arts and contribute to cultural vitality through inclusive, accessible, and diverse artistic programming.",
    },
    {
      title: "Preservation and Documentation",
      description:
        "To support the preservation, documentation, publication, and dissemination of artistic works, cultural heritage, and contemporary artistic practices.",
    },
    {
      title: "Support for Artists",
      description:
        "To provide opportunities, resources, recognition, networking, and professional support for artists and photographers at all stages of their careers.",
    },
    {
      title: "Public Benefit",
      description:
        "To carry on activities that benefit the public by promoting creativity, cultural understanding, artistic expression, and participation in the arts.",
    },
    {
      title: "Non-Profit Purpose",
      description:
        "The Society shall operate exclusively on a non-profit basis and shall not distribute any income or assets to its members except as permitted by the Societies Act of British Columbia.",
    },
  ],
} as const;

export const boardContent = {
  title: "Our Board",
  photoAlt:
    "CCVAA board members Zhong Liu, Yaqi Jing, and Albert Zang",
  photoPlaceholderNote: "Board photo coming soon.",
  portraitPlaceholderNote: "Portrait coming soon.",
  bioPlaceholder: "Bio coming soon.",
  members: [
    {
      name: "Zhong Liu",
      role: "President",
      portraitAlt: "Portrait of Zhong Liu, President",
    },
    {
      name: "Yaqi Jing",
      role: "Vice President",
      portraitAlt: "Portrait of Yaqi Jing, Vice President",
    },
    {
      name: "Albert Zang",
      role: "Secretary",
      portraitAlt: "Portrait of Albert Zang, Secretary",
    },
  ],
} as const;

export const galleryContent = {
  title: "Gallery",
  description:
    "A selection of work and moments from our community. Photographs play automatically — pause at any time, or select one to view it larger.",
  zoomLabel: "View this photograph larger",
  closeLabel: "Close",
  playLabel: "Play slideshow",
  pauseLabel: "Pause slideshow",
  previousLabel: "Previous photograph",
  nextLabel: "Next photograph",
  goToLabel: "Go to photograph",
  viewAllLabel: "View all photographs",
} as const;

export const galleryPageContent = {
  title: "Gallery",
  description:
    "Every photograph in our collection. Choose how many to show per row, and select any photograph to view it full size.",
  columnsLabel: "Per row",
  /** Rendered as "6 photographs" / "1 photograph" beside the layout control. */
  countNoun: "photograph",
  countNounPlural: "photographs",
  emptyNote: "Photographs are on their way.",
} as const;

export const eventsContent = {
  title: "Events",
  description:
    "Exhibitions, workshops, and gatherings through the year. Search the listings, choose how many to show per row, and select any event for full details.",
  detailsLabel: "View details",
  closeLabel: "Close",
  searchLabel: "Search events",
  searchPlaceholder: "Search by title, place, or date…",
  clearSearchLabel: "Clear search",
  perRowLabel: "Per row",
  /** Rendered as "5 events" / "1 event" beside the search field. */
  countNoun: "event",
  countNounPlural: "events",
  noResults: "No events match that search.",
  emptyNote: "Listings for the coming season are on their way.",
} as const;

export const contactContent = {
  title: "Contact",
  description:
    "Interested in partnering, volunteering, or learning more about our programs? We would love to hear from you.",
  emailLabel: "Email",
  addressLabel: "Mailing address",
} as const;

export const membershipContent = {
  title: "Membership",
  description:
    "Join a community of artists, educators, and supporters advancing visual arts across Canada.",
  comingSoonLabel: "Coming soon",
  register: {
    title: "Become a member",
    description:
      "Free membership. Share your name and email to receive news on exhibitions, programs, and community events — and tell us how you would like to take part.",
    cta: "Become a member",
  },
  paid: {
    heading: "Support our work",
    description:
      "Paid memberships fund exhibitions, education, and community programming.",
  },
  plans: [
    {
      id: "founding",
      name: "Founding",
      price: "$360",
      cadence: "one-time",
      description:
        "A limited founding membership recognizing our earliest supporters. Available while seats remain.",
      featured: true,
    },
    {
      id: "lifetime",
      name: "Lifetime",
      price: "$500",
      cadence: "one-time",
      description:
        "Lifelong membership with a single contribution — no renewals to track.",
      featured: false,
    },
    {
      id: "annual",
      name: "Annual",
      price: "$36",
      cadence: "per year",
      description:
        "Renews yearly. Cancel or update your payment details at any time.",
      featured: false,
    },
  ],
  manageBilling: {
    text: "Already a paid member?",
    cta: "Manage your billing",
  },
  currencyNote: "All amounts in CAD. Payments are processed securely by Stripe.",
} as const;
