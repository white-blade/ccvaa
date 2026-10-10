import { assetPath } from "@/lib/asset";
import { eventsContent } from "@/lib/site";

/** A picture. `src` is a file name under `public/events/`, prefixed at read time. */
export type EventPicture = { src: string; alt: string };

/** One or more pictures set among the description paragraphs. */
export type EventPictureBlock = {
  pictures: EventPicture[];
  caption?: string;
};

/**
 * One block of an event's description: a paragraph, or a picture block. Plain
 * strings keep the common case readable — most blocks are prose.
 */
type EventDetail = string | EventPictureBlock;

export function isPictureBlock(detail: EventDetail): detail is EventPictureBlock {
  return typeof detail !== "string";
}

/** As authored below. `getEvents()` adds the derived fields. */
type EventSource = {
  id: string;
  title: string;
  /** ISO 8601 — the machine-readable value for <time dateTime>. */
  startsAt: string;
  /** ISO 8601 date of the last day, for multi-day events. Omit for one-day events. */
  endsAt?: string;
  dateLabel: string;
  location: string;
  /** Where it happens, for the date rail's chip. Omit for events held online. */
  place?: { city: string; country: string };
  /** Shown on the card. */
  summary: string;
  /** Shown in the dialog: paragraphs, optionally with pictures between them. */
  details: EventDetail[];
  admission?: string;
  /** Optional — events without a picture render as text cards. */
  image?: EventPicture;
};

export type CcvaaEvent = EventSource & {
  /** Derived from `startsAt` for the card's calendar chip and the date rail. */
  dateBadge: { year: string; month: string; day: string };
  /** "City, Country", or "Online" — derived from `place`. */
  placeLabel: string;
};

/**
 * Event listings.
 *
 * Content, not data: there is no backend to query, and at this volume a typed
 * array is clearer than a CMS. Edit this file to add or remove an event.
 *
 * NOTE: apart from the founding, these are invented placeholders for the initial
 * build, and their pictures are downscaled copies of gallery photos. Replace both
 * with real listings — see `specs/events-0001-events-section.md`.
 */
const events: EventSource[] = [
  {
    id: "ccvaa-founded",
    title: "Our Birthday: CCVAA Is Founded",
    startsAt: "2026-06-27",
    dateLabel: "June 27, 2026",
    location: "Victoria, BC · BC Registry Services",
    place: { city: "Victoria", country: "Canada" },
    summary:
      "The Coast to Coast Visual Arts Association was incorporated under British Columbia’s Societies Act — the day we count as our birthday.",
    details: [
      "On June 27, 2026, the Registrar of Companies certified the incorporation of the Coast to Coast Visual Arts Association under British Columbia’s Societies Act, as society number S0085619.",
      "Every exhibition, workshop, and gathering on this page begins here.",
    ],
    image: {
      src: "certificate-of-incorporation.jpg",
      alt: "The British Columbia Societies Act Certificate of Incorporation for Coast to Coast Visual Arts Association, dated June 27, 2026, beneath the provincial coat of arms, with a red seal.",
    },
  },
  {
    id: "coastal-light-exhibition",
    title: "Coastal Light: Members’ Exhibition",
    startsAt: "2026-11-14",
    endsAt: "2026-12-06",
    dateLabel: "November 14 – December 6, 2026",
    location: "Richmond Cultural Centre, Richmond, BC",
    place: { city: "Richmond", country: "Canada" },
    summary:
      "Our annual juried members’ exhibition, bringing together painting, photography, and printmaking from across the province.",
    details: [
      "Coastal Light gathers work from CCVAA members responding to the landscapes, weather, and shorelines of British Columbia. The 2026 edition features more than forty pieces across painting, photography, printmaking, and mixed media.",
      "The opening reception takes place on Saturday, November 14 from 2:00 to 5:00 pm, with remarks from the jurors at 3:00 pm. Several exhibiting artists will be present.",
      {
        pictures: [
          {
            src: "detail-lakeshore-bench.jpg",
            alt: "An empty wooden bench on a lakeshore in low golden light, framed by bare branches and dry winter grasses.",
          },
          {
            src: "detail-bougainvillea-sunset.jpg",
            alt: "Branches of magenta bougainvillea against a pink and orange sunset sky, with hills and distant town lights below.",
          },
        ],
        caption: "Work from the 2025 edition.",
      },
      "The exhibition is free to visit during Cultural Centre hours for its full three-week run.",
    ],
    admission: "Free admission · Opening reception November 14, 2–5 pm",
    image: {
      src: "coastal-light-exhibition.jpg",
      alt: "A wooden dock reaching into a mist-covered lake, scattered with red and pink autumn leaves.",
    },
  },
  {
    id: "spring-garden-plein-air",
    title: "Plein Air Morning: Gardens in Bloom",
    startsAt: "2027-04-18",
    dateLabel: "April 18, 2027 · 9:00 am – 12:00 pm",
    location: "Minoru Park, Richmond, BC",
    place: { city: "Richmond", country: "Canada" },
    summary:
      "A guided outdoor painting and sketching session among the spring plantings. All levels welcome; bring your own materials.",
    details: [
      "Spend a morning working outdoors with other members as the spring plantings come into colour. A CCVAA facilitator will circulate with guidance on composition, colour mixing, and working quickly in changing light.",
      "Suitable for every level, including complete beginners. Bring whatever medium you prefer — watercolour, gouache, pencil, or a camera — plus a folding stool if you would like to sit.",
      "The session runs rain or shine; in heavy rain we move under the pavilion. Participants under 16 should be accompanied by an adult.",
    ],
    admission: "Members free · Non-members $10 at the door",
    image: {
      src: "spring-garden-plein-air.avif",
      alt: "A terraced hillside garden of pink and red flowering shrubs overlooking a lake and hazy mountains.",
    },
  },
  {
    id: "artist-talk-pacific-light",
    title: "Artist Talk: Photographing Pacific Light",
    startsAt: "2027-02-11",
    dateLabel: "February 11, 2027 · 7:00 pm",
    location: "Online (Zoom)",
    summary:
      "An evening conversation on landscape photography at the edge of the Pacific — chasing weather, working at dusk, and knowing when to stop.",
    details: [
      "A ninety-minute conversation with a working landscape photographer on the particular challenges of the Pacific coast: flat light, persistent rain, and the narrow windows when conditions turn.",
      "The talk covers planning around tide and weather, practical approaches to long exposure in low light, and an honest account of how many frames go unused.",
      "A half-hour audience question period follows. The session is recorded and shared with members afterwards.",
    ],
    admission: "Free for members · Registration link sent by email",
    // No image: an online talk has no venue to photograph, and this exercises
    // the text-only card path that `image?` exists for.
  },
  {
    id: "valley-printmaking-retreat",
    title: "Printmaking Retreat: Monotype in the Valley",
    startsAt: "2027-06-05",
    endsAt: "2027-06-06",
    dateLabel: "June 5 – 6, 2027",
    location: "Fraser Valley · exact venue confirmed on registration",
    place: { city: "Fraser Valley", country: "Canada" },
    summary:
      "A two-day residential workshop in monotype printing, from inking and plate preparation to pulling a finished edition.",
    details: [
      "Two days of focused studio practice in monotype, a printmaking method that rewards experiment: each plate yields a single print, so there is no safe repetition to fall back on.",
      "Saturday covers plate preparation, ink viscosity, and additive and subtractive mark-making. Sunday moves to multi-layer work and registration, finishing with a group critique.",
      {
        pictures: [
          {
            src: "detail-lakeshore-bench.jpg",
            alt: "An empty wooden bench on a lakeshore in low golden light, framed by bare branches and dry winter grasses.",
          },
        ],
        caption: "The valley in early June.",
      },
      "Presses, inks, and paper are provided. Space is limited to twelve participants so that everyone has press time. Accommodation and meals are arranged separately; details follow registration.",
    ],
    admission: "$180 members · $240 non-members · Twelve places",
    image: {
      src: "valley-printmaking-retreat.avif",
      alt: "A high alpine valley seen over pale granite boulders, with conifers and cloud-covered peaks beyond.",
    },
  },
  {
    id: "annual-general-meeting",
    title: "Annual General Meeting & Community Showcase",
    startsAt: "2027-09-19",
    dateLabel: "September 19, 2027 · 1:00 pm",
    location: "Richmond, BC · venue to be announced",
    place: { city: "Richmond", country: "Canada" },
    summary:
      "The association’s AGM, followed by an open showcase where any member may present one recent work.",
    details: [
      "The formal portion covers the year in review, the financial report, and elections to the board. All members in good standing may vote; proxies are accepted with written notice.",
      "The showcase that follows is deliberately informal: any member may bring one recent piece and speak about it for a few minutes. It is the one occasion each year when the whole membership sees each other’s work in person.",
      "Agenda and nomination papers circulate by email at least three weeks beforehand.",
    ],
    admission: "Members only · Please register so we can plan seating",
    image: {
      src: "annual-showcase.jpg",
      alt: "Sunrise breaking over a ridge above a green mountain valley, a lone figure crossing the meadow.",
    },
  },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Month and day for the card's calendar chip, read straight off the ISO string.
 * Deliberately not `new Date()`: a date-only value parses as UTC midnight, which
 * renders as the previous day anywhere west of Greenwich — including here.
 */
function toDateBadge(startsAt: string): CcvaaEvent["dateBadge"] {
  const [year = "", month, day] = startsAt.split("-");
  return {
    year,
    month: MONTHS[Number(month) - 1] ?? "",
    day: day ? String(Number(day)) : "",
  };
}

function toEventSrc(picture: EventPicture): EventPicture {
  return { ...picture, src: assetPath(`/events/${picture.src}`) };
}

/** Chronological. Past events are not filtered — see the spec for why. */
export function getEvents(): CcvaaEvent[] {
  return [...events]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((event) => ({
      ...event,
      dateBadge: toDateBadge(event.startsAt),
      placeLabel: event.place
        ? `${event.place.city}, ${event.place.country}`
        : eventsContent.onlineLabel,
      image: event.image ? toEventSrc(event.image) : undefined,
      details: event.details.map((detail) =>
        isPictureBlock(detail)
          ? { ...detail, pictures: detail.pictures.map(toEventSrc) }
          : detail,
      ),
    }));
}
