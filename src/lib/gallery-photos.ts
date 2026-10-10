/**
 * The gallery's works: what each one is, who made it, when, and under what licence.
 * This file is the gallery's list — its order is the slideshow's order.
 *
 * The current set is landscape photography from Wikimedia Commons, credited to its
 * real creators under their licences (CC BY and CC BY-SA require the creator's name,
 * the licence, and a link). Replace it with members' work as it comes in.
 *
 * To add a work:
 *   1. `npm run photos -- <folder of originals>` makes its web sizes in
 *      public/photos/ (<name>-sm/md/lg.avif) and records them in
 *      gallery-photo-sizes.json. <name> is the original's file name, without its
 *      extension or a leading "NN-".
 *   2. Add an entry here with that `name`.
 *
 * - `name`        as above
 * - `alt`         what the picture shows, for people who cannot see it
 * - `description` a short caption shown beside it (optional; the alt text otherwise)
 * - `author`      who made it (optional)
 * - `takenAt`     when it was made, as YYYY-MM-DD (optional)
 * - `medium`      e.g. "Photograph", "Oil on canvas" (optional)
 * - `license`     for work not the association's own: its licence and a link to it
 * - `source`      where the original is published, linked from the credit (optional)
 */
export type GalleryPhotoDetails = {
  name: string;
  alt: string;
  description?: string;
  author?: string;
  takenAt?: string;
  medium?: string;
  license?: { name: string; url: string };
  source?: string;
};

const CC_BY_SA_4 = { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" };
const CC_BY_SA_3_US = { name: "CC BY-SA 3.0 US", url: "https://creativecommons.org/licenses/by-sa/3.0/us/" };
const CC_BY_4 = { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" };
const PUBLIC_DOMAIN = { name: "Public domain", url: "https://creativecommons.org/publicdomain/mark/1.0/" };

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const galleryPhotoDetails: GalleryPhotoDetails[] = [
  {
    name: "lake-louise-panorama",
    alt: "Lake Louise from high above: a turquoise lake in a forested valley beneath a rugged grey peak, with glaciers and distant ranges under scattered cloud.",
    description: "Lake Louise from the ridge above — the turquoise of glacial flour against a sea of spruce.",
    author: "Chensiyuan",
    takenAt: "2019-06-16",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("1_lake_louise_pano_2019.jpg"),
  },
  {
    name: "blue-lake-aoraki-mount-cook",
    alt: "A shallow green lake in a rocky alpine valley, ringed by scrub and boulders, with jagged grey mountains under a bright, cloud-streaked sky.",
    description: "Blue Lake in Aoraki / Mount Cook National Park, where the glacier once stood.",
    author: "Krzysztof Golik",
    takenAt: "2017-11-17",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Blue_Lake_in_Mount_Cook_National_Park.jpg"),
  },
  {
    name: "gosaikunda-lake-himalayas",
    alt: "Prayer flags strung across a frozen lake among snow-dusted boulders, with sharp snow-capped Himalayan peaks behind under a deep blue sky.",
    description: "Prayer flags over the frozen Gosaikunda, a sacred lake high in the Himalayas.",
    author: "Sergey Pesterev",
    takenAt: "2014-04-11",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Lake_Gosaikunda.jpg"),
  },
  {
    name: "dome-creek-british-columbia",
    alt: "Snow-capped mountains glowing in a pink and gold sky above a dark line of spruce, with mist lying over a still lake in the foreground.",
    description: "Morning mist on a lake at Dome Creek, in the Robson Valley of British Columbia.",
    author: "Jakub Fryš",
    takenAt: "2019-03-17",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Lake_in_Dome_Creek.jpg"),
  },
  {
    name: "desert-scenery-with-mountains",
    alt: "Layers of hazy blue mountain ridges fading into a pale sky, above a dark band of desert scrub and a lone bare tree.",
    description: "Desert ridges dissolving into haze, one layer paler than the last.",
    author: "Steve Hillebrand, U.S. Fish and Wildlife Service",
    medium: "Photograph",
    license: PUBLIC_DOMAIN,
    source: commons("Desert_scenery_with_mountains_in_background.jpg"),
  },
  {
    name: "atacama-desert-chile",
    alt: "Long white lenticular clouds stretched across a deep blue sky above bare, rust-brown volcanic peaks and slopes.",
    description: "Lenticular clouds over the volcanoes near Piedras Rojas, in Chile’s Atacama Desert.",
    author: "Wescottm",
    takenAt: "2017-10-05",
    medium: "Photograph",
    license: CC_BY_4,
    source: commons("Near_Piedras_Rojas,_Atacama_Desert,_Chile.jpg"),
  },
  {
    name: "castle-cove-coastal-lookout-australia",
    alt: "Waves rolling white onto a narrow beach below a scrub-covered headland, with turquoise sea stretching to the horizon.",
    description: "Surf on the Great Ocean Road coast, from the Castle Cove lookout in Victoria.",
    author: "Dietmar Rabich",
    takenAt: "2019-10-12",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Glenaire_(AU),_Castle_Cove_Lookout_--_2019_--_1163.jpg"),
  },
  {
    name: "autumn-forest-creek-west-virginia",
    alt: "A creek flowing over smooth stones through an autumn forest, its banks and rocks scattered with orange and red fallen leaves.",
    description: "An autumn creek in West Virginia, slowed to silk by a long exposure.",
    author: "ForestWander",
    takenAt: "2010-11-01",
    medium: "Photograph",
    license: CC_BY_SA_3_US,
    source: commons("Autumn-forest-creek-scenery_-_West_Virginia_-_ForestWander.jpg"),
  },
  {
    name: "quinault-rain-forest-washington",
    alt: "A thin waterfall threading down through a dense green rain forest of ferns, moss-covered boulders, and fallen logs.",
    description: "A waterfall threading through moss and fern in the Quinault Rain Forest.",
    author: "King of Hearts",
    takenAt: "2018-06-10",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Quinault_Rain_Forest_June_2018_011.jpg"),
  },
  {
    name: "forest-waterfalls-virginia",
    alt: "Water spilling over stepped, moss-covered ledges in a series of small falls, surrounded by bright green forest growth.",
    description: "Water stepping down mossy ledges in a Virginia forest.",
    author: "ForestWander",
    takenAt: "2011-10-21",
    medium: "Photograph",
    license: CC_BY_SA_3_US,
    source: commons("Waterfalls-forest-landscape_-_Virginia_-_ForestWander.jpg"),
  },
  {
    name: "desert-plants-and-scenery-joshua-tree",
    alt: "Prickly pear cacti, yucca, and scrub among sun-bleached granite boulders, with a bare tree on the rocks and rounded hills under a clear blue sky.",
    description: "Cactus and granite in the high desert of Joshua Tree National Park.",
    author: "Joshua Tree National Park",
    takenAt: "2021-05-30",
    medium: "Photograph",
    license: PUBLIC_DOMAIN,
    source: commons("Desert_Plants_and_Scenery_(51212409862).jpg"),
  },
  {
    name: "downhill-strand-coastal-countryside-ireland",
    alt: "Green fields dotted with round hay bales running down to a stone farmhouse and a calm blue sea inlet, with low hills on the far shore.",
    description: "Hay bales and a farmhouse above the sea at Downhill Strand, Northern Ireland.",
    author: "Y. Jauregui-Sánchez",
    takenAt: "2023-08-19",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Downhill_Strand_Countryside_with_Coastal_Views.jpg"),
  },
  {
    name: "castle-cove-coastal-lookout-at-sea-australia",
    alt: "A curving sandy beach below steep scrubby cliffs, with turquoise water and white surf stretching along the coast.",
    description: "The curve of Castle Cove, where the Otway cliffs meet the Southern Ocean.",
    author: "Dietmar Rabich",
    takenAt: "2019-10-12",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Glenaire_(AU),_Castle_Cove_Lookout_--_2019_--_1166.jpg"),
  },
  {
    name: "lake-sylvester-sunrise-new-zealand",
    alt: "A small alpine lake in a tussock basin at dawn, with blue mountain ridges beneath a sky fading from pink to violet.",
    description: "First light over Lake Sylvester, in Kahurangi National Park.",
    author: "Michal Klajban",
    takenAt: "2020-01-01",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Lake_Sylvester_during_the_sunrise,_Kahurangi,_New_Zealand.jpg"),
  },
  {
    name: "sninsky-kamen-in-winter-slovakia",
    alt: "A beech forest coated in thick white hoarfrost, every trunk and branch iced over, above deep snow.",
    description: "Hoarfrost on the beech forest below Sninský kameň, in eastern Slovakia.",
    author: "Milan Bališin",
    takenAt: "2019-01-11",
    medium: "Photograph",
    license: CC_BY_SA_4,
    source: commons("Sninský_kameň_(v_zime)_001.jpg"),
  },
  {
    name: "steens-mountain-oregon",
    alt: "A glacial valley with a dark blue lake below steep, snow-streaked slopes, and the desert plain stretching away beyond.",
    description: "A glacial cirque on Steens Mountain, high above the Oregon desert.",
    author: "Bureau of Land Management",
    takenAt: "2013-07-11",
    medium: "Photograph",
    license: PUBLIC_DOMAIN,
    source: commons("Steens_Mountain_in_eastern_Oregon_(9680476233).jpg"),
  },
  {
    name: "peyriac-de-mer-salt-ponds-france",
    alt: "A wooden boardwalk curving out across a mirror-still lagoon at dusk, under a sky fading from peach to blue.",
    description: "A boardwalk across the salt ponds of Peyriac-de-Mer at dusk.",
    author: "Christian Ferrer",
    takenAt: "2018-02-04",
    medium: "Photograph",
    license: CC_BY_4,
    source: commons("Landscape_in_Peyriac-de-Mer,_february_2018_(05).jpg"),
  },
  {
    name: "clear-water-waterfall-landscape-virginia",
    alt: "Clear water rushing past lichen-covered boulders and a fallen branch, with a small waterfall pouring down behind.",
    description: "Clear water over lichen-covered stone, in the Virginia woods.",
    author: "ForestWander",
    takenAt: "2011-11-04",
    medium: "Photograph",
    license: CC_BY_SA_3_US,
    source: commons("Clear-water-waterfall-landscape_-_Virginia_-_ForestWander.jpg"),
  },
  {
    name: "waterfalls-rocks-landscape-virginia",
    alt: "Several white waterfalls cascading over moss-green rock ledges, with a fallen log across the lower falls.",
    description: "Falls braiding over moss-covered rock, in Virginia.",
    author: "ForestWander",
    takenAt: "2011-10-21",
    medium: "Photograph",
    license: CC_BY_SA_3_US,
    source: commons("Waterfalls-rocks-landscape_-_Virginia_-_ForestWander.jpg"),
  },
];
