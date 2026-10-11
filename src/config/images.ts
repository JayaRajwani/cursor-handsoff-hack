/**
 * Stock photos used on the site (free Unsplash licence: https://unsplash.com/license).
 * To swap a photo: find one on unsplash.com, open it, copy its image address,
 * and paste it into `src` below. Also update `credit` and `source`.
 * If an image fails to load, the site shows a neutral illustrated placeholder.
 */
export const stockPhotos = {
  about: {
    src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=75",
    alt: "A clinician using a tablet computer in a hospital setting",
    credit: "Unsplash (photo-1576091160399-112ba8d25d1d)",
    source: "https://unsplash.com/photos/photo-1576091160399-112ba8d25d1d",
  },
  institutions: {
    src: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=75",
    alt: "Healthcare professionals working together in a hospital",
    credit: "Unsplash (photo-1551076805-e1869033e561)",
    source: "https://unsplash.com/photos/photo-1551076805-e1869033e561",
  },
} as const;
