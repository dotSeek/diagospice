// Illustrative stock photography from Unsplash. The restaurant has not supplied
// its own pictures yet, so nothing here shows real Diago Spice food or rooms.
// To replace one: drop the file in public/photos and return that path instead.

const photo = (id: string, width: number): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

export interface GalleryImage {
  id: string;
  alt: string;
  caption: string;
  thumb: string;
  full: string;
  span?: "wide" | "tall";
}

const galleryEntry = (
  id: string,
  alt: string,
  caption: string,
  span?: GalleryImage["span"],
): GalleryImage => ({
  id,
  alt,
  caption,
  span,
  thumb: photo(id, 800),
  full: photo(id, 1600),
});

export const heroImage = photo("1544025162-d76694265947", 2000);

export const aboutImages = {
  primary: photo("1585937421612-70a008356fbe", 1200),
};

export const galleryImages: GalleryImage[] = [
  galleryEntry("1585937421612-70a008356fbe", "Curry served with rice and nan", "Curry and nan", "wide"),
  galleryEntry("1568901346375-23c9450c58cd", "A stacked burger", "Burgers"),
  galleryEntry("1563379091339-03b21ab4a4f8", "A plate of biriyani", "Biriyani", "tall"),
  galleryEntry("1527477396000-e27163b481c2", "Glazed chicken wings", "Wings"),
  galleryEntry("1517248135467-4c7edcad34c4", "A warmly lit dining room", "Dining atmosphere", "wide"),
  galleryEntry("1571877227200-a0d98ea607e9", "A slice of tiramisu", "Desserts"),
  galleryEntry("1573080496219-bb080dd4f877", "Golden chips", "Chips"),
  galleryEntry("1514933651103-005eec06c04b", "A wood bar under warm hanging lights", "Bar atmosphere", "wide"),
];
