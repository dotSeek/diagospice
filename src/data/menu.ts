// Source of truth: "Diago Menue.docx" supplied by the restaurant.
// Spelling was tidied (for example Pices to pieces, Chichen to Chicken,
// Lorded to Loaded). Dishes and prices were not changed, apart from the
// confirmed typo marked below.

export interface MenuItemData {
  name: string;
  price: number;
  note?: string;
}

export interface DealData {
  name: string;
  price: number;
  includes: string[];
}

export interface ItemCategory {
  id: string;
  label: string;
  kind: "items";
  items: MenuItemData[];
}

export interface DealCategory {
  id: string;
  label: string;
  kind: "deals";
  deals: DealData[];
}

export type MenuCategoryData = ItemCategory | DealCategory;

export interface BuffetGroup {
  title: string;
  items: string[];
}

export const formatPrice = (price: number): string => `£${price.toFixed(2)}`;

export const menuCategories: MenuCategoryData[] = [
  {
    id: "starters",
    label: "Starters",
    kind: "items",
    items: [
      { name: "Papadam", price: 1 },
      { name: "Vegi Rolls", price: 1.99, note: "2 pieces" },
      { name: "Chicken Spring Rolls", price: 2.5, note: "2 pieces" },
      { name: "Mutton Rolls", price: 2.99, note: "2 pieces" },
      { name: "Onion Bhaji", price: 2, note: "4 pieces" },
      { name: "Paneer Tikka", price: 4.5 },
      { name: "Potato Tuna Cheese Balls", price: 1.99, note: "2 pieces" },
      { name: "Chicken Lollipop", price: 4.99 },
      { name: "Chicken Strips", price: 3.99, note: "4 pieces" },
      { name: "Chicken Nuggets", price: 2.99, note: "6 pieces" },
      { name: "Garlic Chicken", price: 4.99 },
      { name: "Honey BBQ Chicken Bites", price: 4.99, note: "6 pieces" },
      { name: "Chilli Chicken", price: 4.99 },
      { name: "Garlic Parmesan Wings", price: 3.99 },
      { name: "Sweet Chilli Wings", price: 3.99 },
      { name: "BBQ Wings", price: 3.99 },
      { name: "Crispy Chicken Wings", price: 3.99 },
    ],
  },
  {
    id: "mains",
    label: "Mains",
    kind: "items",
    items: [
      { name: "Egg Roast", price: 5.99 },
      { name: "Chicken Roast", price: 6.99 },
      { name: "Mutton Korma", price: 7.99 },
      { name: "Butter Chicken", price: 6.99 },
      { name: "Chicken Tikka", price: 6.99 },
      { name: "Chicken Madras", price: 6.99 },
      { name: "Chicken Vindaloo", price: 6.99 },
      { name: "Thai Red Chicken Curry", price: 6.99 },
      { name: "Thai Green Chicken Curry", price: 6.99 },
      { name: "Diago Special Beef Stew", price: 8.99 },
      { name: "Beef Korma", price: 8.99 },
      { name: "Beef Roast", price: 7.99 },
      { name: "Chicken Piccata", price: 6.99 },
      { name: "Paneer Curry", price: 6.99 },
    ],
  },
  {
    id: "rice",
    label: "Rice",
    kind: "items",
    items: [
      { name: "Steam Rice", price: 2.99 },
      { name: "Pilaw Rice", price: 3.99 },
      { name: "Garlic Rice", price: 3.99 },
      { name: "Chicken Dum Biriyani", price: 8.99 },
      { name: "Mutton Dum Biriyani", price: 10.99 },
      { name: "Chicken Fried Rice", price: 7.99 },
      { name: "Veg Fried Rice", price: 6.99 },
      { name: "Seafood Fried Rice", price: 9.99 },
      { name: "Mixed Fried Rice", price: 10.99 },
    ],
  },
  {
    id: "specials",
    label: "Diago special foods",
    kind: "items",
    items: [
      { name: "Kottu", price: 8.99, note: "Chicken, mutton or beef" },
      { name: "Dum Parota", price: 5.99, note: "Chicken, mutton or beef" },
      { name: "Pad Thai", price: 7.99 },
      { name: "Singapore Vermicelli", price: 7.99 },
      { name: "Chowmein", price: 7.99 },
      { name: "Doner Kebab", price: 8.99 },
      // The document reads "£799". Confirmed as £7.99.
      { name: "Mixed Doner Kebab", price: 7.99 },
      { name: "Chicken Wrap", price: 5.99 },
      { name: "Doner Wrap", price: 5.99 },
      { name: "Mixed Kebab Wrap", price: 5.99 },
      { name: "Parmesan Chicken Wrap", price: 6.49 },
    ],
  },
  {
    id: "burgers",
    label: "Burgers",
    kind: "items",
    items: [
      { name: "Beef Burger", price: 5.99 },
      { name: "Chicken Burger", price: 4.99 },
      { name: "Doner Burger", price: 5.99 },
      { name: "Chicken Fillet Burger", price: 4.49 },
      { name: "Garlic Parmesan Dipped Cheese Burger", price: 6.99 },
    ],
  },
  {
    id: "chips",
    label: "Chips",
    kind: "items",
    items: [
      { name: "Plain Chips", price: 2.5 },
      { name: "Curly Fries", price: 2.99 },
      { name: "Nacho Cheese & Chips", price: 3.99 },
      { name: "Cheesy Chips", price: 3.99 },
      { name: "Peri Peri Chips", price: 3.5 },
      { name: "Loaded Fries", price: 4.99 },
      { name: "Mixed Loaded Fries", price: 6.99 },
    ],
  },
  {
    id: "nan",
    label: "Nan",
    kind: "items",
    items: [
      { name: "Plain Nan", price: 1.99 },
      { name: "Butter Nan", price: 2.99 },
    ],
  },
  {
    id: "desserts",
    label: "Desserts",
    kind: "items",
    items: [
      { name: "Tiramisu", price: 3.99 },
      { name: "Cheesecake", price: 3.99 },
      { name: "Caramel Pudding", price: 3.99 },
      { name: "Chocolate Fudge Cake", price: 3.99 },
    ],
  },
  {
    id: "meal-deals",
    label: "Meal deals",
    kind: "deals",
    deals: [
      {
        name: "Classic Burger Meal",
        price: 7.49,
        includes: ["Chicken Burger or Chicken Fillet Burger", "Plain Chips", "Drink"],
      },
      {
        name: "Premium Burger Meal",
        price: 8.99,
        includes: ["Beef Burger or Doner Burger", "Plain Chips", "Drink"],
      },
      {
        name: "Wrap Meal",
        price: 8.49,
        includes: ["Chicken Wrap, Doner Wrap or Mixed Kebab Wrap", "Plain Chips", "Drink"],
      },
    ],
  },
  {
    id: "rice-curry-deals",
    label: "Rice & curry deals",
    kind: "deals",
    deals: [
      {
        name: "Curry & Rice Meal",
        price: 9.99,
        includes: [
          "Choice of Butter Chicken, Chicken Madras, Chicken Tikka or Chicken Roast",
          "Steam Rice or Pilaw Rice",
          "Drink",
        ],
      },
      {
        name: "Beef Special Meal",
        price: 11.99,
        includes: ["Beef Roast or Diago Special Beef Stew", "Steam Rice, Chips or Nan"],
      },
      {
        name: "Wings Combo",
        price: 6.99,
        includes: [
          "Choice of Garlic Parmesan, Sweet Chilli, BBQ or Crispy Chicken Wings",
          "Plain Chips",
          "Drink",
        ],
      },
      {
        name: "Diago Sharing Deal",
        price: 13.99,
        includes: ["2 Chicken Burgers", "2 Portions of Plain Chips", "6 Chicken Strips", "2 Drinks"],
      },
    ],
  },
];

export const buffet = {
  id: "buffet",
  label: "Buffet",
  days: "Friday, Saturday, Sunday",
  hours: "2pm to 12am",
  bookingPhone: "07901 024843",
  adultPrice: 13.99,
  kidsPrice: 6.99,
  kidsNote: "Kids under 10 years",
  groups: [
    {
      title: "Starters",
      items: [
        "Papadam",
        "Vegi Rolls",
        "Chicken Spring Rolls",
        "Mutton Rolls",
        "Onion Bhaji",
        "Paneer Tikka",
        "Potato Tuna Cheese Balls",
        "Chicken Lollipop",
        "Chicken Strips",
        "Chicken Nuggets",
        "Garlic Chicken",
        "Honey BBQ Chicken Bites",
        "Chilli Chicken",
        "Garlic Parmesan Wings",
        "Sweet Chilli Wings",
        "BBQ Wings",
        "Crispy Chicken Wings",
      ],
    },
    {
      title: "Mains",
      items: [
        "Egg Roast",
        "Chicken Roast",
        "Mutton Korma",
        "Butter Chicken",
        "Chicken Tikka",
        "Chicken Madras",
        "Chicken Vindaloo",
        "Thai Red Chicken Curry",
        "Thai Green Chicken Curry",
      ],
    },
    {
      title: "Rice",
      items: [
        "Pilaw Rice",
        "Chicken Dum Biriyani",
        "Mutton Dum Biriyani",
        "Chicken Fried Rice",
        "Seafood Fried Rice",
        "Mixed Fried Rice",
      ],
    },
    {
      title: "Diago special foods",
      items: [
        "Kottu",
        "Pad Thai",
        "Singapore Vermicelli",
        "Chowmein",
        "Doner Kebab",
        "Mixed Doner Kebab",
        "Chicken Wrap",
        "Doner Wrap",
        "Mixed Kebab Wrap",
        "Chips",
      ],
    },
    {
      title: "Vegetarian options",
      items: ["Aloo Keema", "Paneer Curry", "Daal Makhni", "Cauliflower 65"],
    },
  ] satisfies BuffetGroup[],
  // Listed with prices in the buffet section of the document.
  desserts: [
    { name: "Tiramisu", price: 3.99 },
    { name: "Cheesecake", price: 3.99 },
    { name: "Caramel Pudding", price: 3.99 },
    { name: "Chocolate Fudge Cake", price: 3.99 },
  ] satisfies MenuItemData[],
};

export const categoryById = (id: string): MenuCategoryData => {
  const found = menuCategories.find((category) => category.id === id);
  if (!found) throw new Error(`Unknown menu category: ${id}`);
  return found;
};
