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

/** Sections of the one-page site, top to bottom. `id` is the section's anchor. */
export const navigation = [
  { label: "About", id: "about" },
  { label: "Gallery", id: "gallery" },
  { label: "Events", id: "events" },
  { label: "Contact", id: "contact" },
] as const;

export type SectionId = (typeof navigation)[number]["id"];

/** "01", "02"… — a section's place in the nav, so numbering follows the order there. */
export function sectionNumber(id: SectionId): string {
  return String(navigation.findIndex((item) => item.id === id) + 1).padStart(2, "0");
}

export const headerContent = {
  skipLabel: "Skip to content",
  navLabel: "Main navigation",
  /** The phone tab bar: a second nav landmark, so it needs a name of its own. */
  tabBarLabel: "Sections",
} as const;

export const heroContent = {
  eyebrow: "Non-profit · British Columbia, Canada",
  headline: "Celebrating visual arts from coast to coast",
  subheadline:
    "We bring artists, educators, and communities together to create, learn, and share the power of visual expression.",
  primaryCta: { label: "Explore the gallery", sectionId: "gallery" },
  secondaryCta: { label: "See what’s on", sectionId: "events" },
  scrollLabel: "Scroll",
} as const;

export const aboutContent = {
  eyebrow: "Who we are",
  title: "About",
  /** Set large beside the paragraphs. */
  quote: "Connecting communities through visual arts, from coast to coast.",
  quoteAttribution: "Our mission",
  paragraphs: [
    "Coast to Coast Visual Arts Association (CCVAA) is a registered non-profit society in British Columbia, dedicated to advancing visual arts across Canada.",
    "We bring artists, educators, and communities together through exhibitions, education, and cultural programming — from local workshops to coast-to-coast collaboration.",
    "Whether you are an artist, educator, volunteer, or art enthusiast, we invite you to join our growing community.",
  ],
  purposesHeading: "Our Purposes",
  purposesShowLabel: "Read all",
  purposesHideLabel: "Collapse",
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
  profileLabel: "View profile",
  closeLabel: "Close",
  previousLabel: "Previous board member",
  nextLabel: "Next board member",
  /**
   * NOTE: every `bio` below is lorem ipsum standing in for the real text. Replace it
   * before launch. To add a portrait, put the file in `public/board/` and set
   * `portrait: "file-name.jpg"` on the member.
   */
  members: [
    {
      id: "zhong-liu",
      name: "Zhong Liu",
      role: "President",
      portraitAlt: "Portrait of Zhong Liu, President",
      portrait: undefined as string | undefined,
      bio: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      ],
    },
    {
      id: "yaqi-jing",
      name: "Yaqi Jing",
      role: "Vice President",
      portraitAlt: "Portrait of Yaqi Jing, Vice President",
      portrait: undefined as string | undefined,
      bio: [
      "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.",
      "Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis.",
      ],
    },
    {
      id: "albert-zang",
      name: "Albert Zang",
      role: "Secretary",
      portraitAlt: "Portrait of Albert Zang, Secretary",
      portrait: undefined as string | undefined,
      bio: [
      "Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.",
      "Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus. Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi.",
      ],
    },
  ],
} as const;

export type BoardMember = (typeof boardContent.members)[number];

export const galleryContent = {
  eyebrow: "The collection",
  title: "Gallery",
  description:
    "Work and moments from our community. Choose how many to show per row, and select any photograph to view it full size.",
  zoomLabel: "View this photograph larger",
  /** Shown on hover over each tile. */
  viewLabel: "View",
  closeLabel: "Close",
  previousLabel: "Previous photograph",
  nextLabel: "Next photograph",
  columnsLabel: "Per row",
  /** Rendered as "6 photographs" / "1 photograph" beside the layout control. */
  countNoun: "photograph",
  countNounPlural: "photographs",
} as const;

export const eventsContent = {
  eyebrow: "What’s on",
  title: "Events",
  description:
    "Exhibitions, workshops, and gatherings through the year. Follow the timeline, or search the listings — select any event for full details.",
  detailsLabel: "View details",
  closeLabel: "Close",
  searchLabel: "Search events",
  searchPlaceholder: "Search by title, place, or date…",
  clearSearchLabel: "Clear search",
  /** Rendered as "5 events" / "1 event" beside the search field. */
  countNoun: "event",
  countNounPlural: "events",
  noResults: "No events match that search.",
  pastLabel: "Past",
  timelineLabel: "Event timeline",
  /** The phone and portrait-tablet strip that stands in for the timeline. */
  dateRailLabel: "Event dates",
  todayLabel: "Today",
} as const;

export const contactContent = {
  eyebrow: "Get in touch",
  title: "Contact",
  description:
    "Interested in partnering, volunteering, or learning more about our programs? We would love to hear from you.",
  emailLabel: "Email",
  emailPrompt: "Write to us",
  addressLabel: "Mailing address",
} as const;

export const footerContent = {
  navHeading: "Explore",
  contactHeading: "Contact",
} as const;
