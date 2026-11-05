const addressQuery = encodeURIComponent("Pengwern Road, Clase, Swansea SA6 7LW");

export const restaurant = {
  name: "Diago Spice",
  descriptor: "Restaurant",
  addressLines: ["Pengwern Road", "Clase", "Swansea SA6 7LW"],
  addressInline: "Pengwern Road, Clase, Swansea SA6 7LW",
  phoneDisplay: "07901 024843",
  phoneHref: "tel:+447901024843",
  websiteDisplay: "diagospice.co.uk",
  websiteUrl: "https://diagospice.co.uk",
  facebookName: "Diago spice restaurant",
  // Where the QR code on the printed menu lands.
  facebookUrl: "https://www.facebook.com/people/DIAGO-SPICE/61596085807405/",
  whatsappUrl: "https://wa.me/447901024843",
  // Centre of the SA6 7LW postcode, from postcodes.io. [longitude, latitude]
  mapCenter: [-3.947813, 51.664091] as [number, number],
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`,
  menuPdfUrl: "/diago-spice-menu.pdf",
  menuPdfFilename: "Diago-Spice-Menu.pdf",
  // Share this rather than the PDF: only the page carries a social preview.
  menuPageUrl: "https://diagospice.co.uk/menu/",
} as const;

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About us", href: "#about" },
  { label: "Menu", href: "#menu" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
  { label: "Location", href: "#location" },
] as const;
