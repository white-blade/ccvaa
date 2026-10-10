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

/**
 * POLICY: the organization's address (`email` below) is the only email address the
 * site shows. Personal email addresses — board members' or anyone else's — are
 * never added anywhere on the page, bios included; people are reached through the
 * organization. A test fails if any other address appears (src/lib/site.test.ts).
 */
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
  backToTopLabel: "Back to top",
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
  /** The shortcut beside the heading; each purpose also opens on its own. */
  purposesExpandAllLabel: "Expand all",
  purposesCollapseAllLabel: "Collapse all",
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
  /** File in `public/board/`. */
  photo: "board.jpg",
  photoAlt:
    "CCVAA board members, from left: Yaqi Jing, Zhong Liu, and Albert Zang, smiling together in front of a dark studio backdrop.",
  portraitPlaceholderNote: "Portrait coming soon.",
  /** Shown for a member whose `bio` is still empty. */
  bioPlaceholder: "Bio coming soon.",
  profileLabel: "View profile",
  websiteLabel: "Website",
  closeLabel: "Close",
  previousLabel: "Previous board member",
  nextLabel: "Next board member",
  /**
   * No personal email addresses here, ever — see the policy on `organization`. A
   * member's own public website may be linked.
   *
   * `portrait` is a file in `public/board/` (pre-sized: ≤1200px, ≤300KB); leave it
   * out and the profile shows a monogram. An empty `bio` shows `bioPlaceholder`.
   */
  members: [
    {
      id: "zhong-liu",
      name: "Zhong Liu",
      role: "President",
      portrait: "zhong-liu.jpg" as string | undefined,
      portraitAlt:
        "Zhong Liu, President, in a white T-shirt, smiling and looking off to one side against a dark backdrop.",
      bio: [
        "Zhong Liu is a Richmond-based photographic artist originally from China. With more than thirty years of experience in photography, his work explores the relationship between nature, time, and contemplation. His photographs have been exhibited nationally and internationally in Canada, China, France, Switzerland, and Macau, and have received multiple international awards, including the MonoVisions Photography Awards and the Minimalist Photography Awards.",
        "Liu is the author of several photography books and served as a contracted expert for Fotomen magazine from 2012 to 2015. He holds a Bachelor of Fine Arts degree from Minzu University of China.",
        "Beyond his artistic practice, Liu actively participates in international cultural and artistic exchange initiatives, serves as a juror for international photography exhibitions, and is committed to community engagement through volunteer work and public cultural events.",
        "Liu currently serves as President of the Coast to Coast Visual Arts Association. He is also a member of the China Photographers Association and the Canadian Association for Photographic Art.",
      ] as readonly string[],
      website: {
        label: "liuzhongphoto.com",
        href: "https://www.liuzhongphoto.com",
      } as { label: string; href: string } | undefined,
    },
    {
      id: "yaqi-jing",
      name: "Yaqi Jing",
      role: "Vice President",
      portrait: "yaqi-jing.jpg" as string | undefined,
      portraitAlt:
        "Yaqi Jing, Vice President, in a denim jacket, smiling at the camera against a mottled grey backdrop.",
      bio: [
        "Yaqi Jing is a contemporary visual artist based in Vancouver, Canada. Her practice spans large-scale abstract expressionism, mixed-media paintings, and conceptual installations. Integrating Western abstraction with Eastern philosophical thought, her work explores themes of psychological self-reflection, natural aesthetics, and existential flow. With an extensive international exhibition footprint—including showcases in France, Switzerland, and North America—her art seeks to transform inner consciousness into tactile, visual narratives.",
      ] as readonly string[],
      website: undefined as { label: string; href: string } | undefined,
    },
    {
      id: "albert-zang",
      name: "Albert Zang",
      role: "Secretary",
      portrait: "albert-zang.jpg" as string | undefined,
      portraitAlt:
        "Albert Zang, Secretary, in a grey knit hoodie, facing the camera against a warm brown backdrop.",
      bio: [
        "Albert Zang is the Secretary of the Coast to Coast Visual Arts Association. A Vancouver-based entrepreneur and hobbyist photographer, he brings a unique blend of technical precision, creative curiosity, and collaborative spirit to the association.",
        "With over a decade of experience as a full-stack software engineer, including technical leadership, Albert has built a career grounded in thoughtful problem-solving, attention to detail, and a strong sense of ownership. Today, he is focused on empowering local small businesses through tailored technology solutions, including custom application development, IT consulting, and technical support.",
        "Alongside his passion for technology, Albert sees photography as a form of creative expression and connection. Through his involvement with CCVAA, he hopes to contribute to a welcoming community where artists can connect, share their work, and inspire one another.",
      ] as readonly string[],
      website: undefined as { label: string; href: string } | undefined,
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
  /** The viewer's strip of thumbnails, and each one: "Show photograph 3". */
  thumbnailsLabel: "All photographs",
  showPhotoLabel: "Show photograph",
  /** Shown to mouse and keyboard users only; touch gets swipes instead. */
  keyboardHint: "← → to browse · Esc to close",
  columnsLabel: "Per row",
  /** Rendered as "6 photographs" / "1 photograph" beside the layout control. */
  countNoun: "photograph",
  countNounPlural: "photographs",
} as const;

export const eventsContent = {
  eyebrow: "What’s on",
  title: "Events",
  description:
    "Exhibitions, workshops, and gatherings through the year. Follow the timeline, and select any event for full details.",
  detailsLabel: "View details",
  /** An event picture's button, before its description: opens it whole. */
  viewPictureLabel: "View the full picture",
  closeLabel: "Close",
  pastLabel: "Past",
  timelineLabel: "Event timeline",
  /** The phone and portrait-tablet strip that stands in for the timeline. */
  dateRailLabel: "Event dates",
  /** A date-rail chip's place for an event with no venue. */
  onlineLabel: "Online",
  todayLabel: "Today",
} as const;

export const contactContent = {
  eyebrow: "Get in touch",
  title: "Contact",
  description:
    "Interested in partnering, volunteering, or learning more about our programs? We would love to hear from you.",
  emailPrompt: "Write to us",
  addressLabel: "Mailing address",
} as const;

export const footerContent = {
  navHeading: "Explore",
  contactHeading: "Contact",
} as const;
