/**
 * Gallery photographs: who took each one, when, and what it shows.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ NOTE: placeholder credits — replace with real author/date before launch. │
 * │ The authors, dates, and descriptions below are invented stand-ins so the │
 * │ gallery can be designed with full information. The `alt` text is real:   │
 * │ it describes what is actually in each picture.                           │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * One entry per file in `public/photos/`. To add a photograph, drop the file in that
 * folder and add an entry here with the same `file` name:
 *
 * - `file`        the file name in public/photos/, exactly
 * - `alt`         what the picture shows, for people who cannot see it
 * - `description` a short caption shown beside the photograph (optional — the alt
 *                 text is shown instead when it is missing)
 * - `author`      who took it (optional)
 * - `takenAt`     when, as YYYY-MM-DD (optional)
 *
 * Optional fields can simply be left out; the gallery shows what it has.
 */
export type GalleryPhotoDetails = {
  file: string;
  alt: string;
  description?: string;
  author?: string;
  takenAt?: string;
};

export const galleryPhotoDetails: GalleryPhotoDetails[] = [
  {
    file: "1.jpg",
    alt: "A wooden dock reaching into a still, mist-covered lake, its planks scattered with red and pink maple leaves beneath an autumn tree.",
    description: "First frost on the lake: maple leaves drift onto the dock as the morning mist lifts.",
    author: "Mira Hollis",
    takenAt: "2024-10-19",
  },
  {
    file: "2.avif",
    alt: "A terraced hillside garden of pink and red flowering shrubs looking down over a lake ringed by hazy blue mountains.",
    description: "A terraced garden in full bloom above the lake, the mountains softening into haze.",
    author: "Daniel Okafor",
    takenAt: "2023-05-27",
  },
  {
    file: "3.jpg",
    alt: "An empty wooden bench on a lakeshore in low golden light, framed by bare branches and dry winter grasses.",
    description: "An empty bench keeps watch over the shore in the last low light of a winter afternoon.",
    author: "Elena Varga",
    takenAt: "2025-01-12",
  },
  {
    file: "4.jpg",
    alt: "Branches of magenta bougainvillea against a pink and orange sunset sky, with hills and distant town lights below.",
    description: "Bougainvillea against a blush of sunset as the town lights come on below the hills.",
    author: "Theo Lindqvist",
    takenAt: "2024-08-03",
  },
  {
    file: "5.jpg",
    alt: "Sunrise breaking over a ridge above a green mountain valley, a lone figure crossing the meadow among moss-covered boulders.",
    description: "Sunrise spills over the ridge as a lone walker crosses the valley meadow.",
    author: "Priya Raman",
    takenAt: "2023-07-15",
  },
  {
    file: "6.avif",
    alt: "A high alpine valley seen over a foreground of pale granite boulders, with conifers and cloud-covered peaks beyond.",
    description: "Granite, pine, and cloud: a high alpine valley after an afternoon storm.",
    author: "Samuel Achterberg",
    takenAt: "2022-09-04",
  },
];
