// Source of truth: "Diago Menue delivery.docx" supplied by the restaurant.
// The website shows the delivery (online) menu only. The restaurant and bar
// menus are for dine in and are not published here.
// Spelling was tidied (for example Pices to pieces, Chichen to Chicken,
// Lorded to Loaded, Kurma to Korma). Dishes and prices were not changed.

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
      { name: "Vegi Rolls", price: 2.5, note: "2 pieces" },
      { name: "Chicken Spring Rolls", price: 2.99, note: "2 pieces" },
      { name: "Mutton Rolls", price: 3.5, note: "2 pieces" },
      { name: "Onion Bhaji", price: 2.5, note: "4 pieces" },
      { name: "Paneer Tikka", price: 4.5 },
      { name: "Potato Tuna Cheese Balls", price: 2.5, note: "2 pieces" },
      { name: "Chicken Lollipop", price: 4.99 },
      { name: "Chicken Strips", price: 3.99, note: "4 pieces" },
      { name: "Chicken Nuggets", price: 3.99, note: "6 pieces" },
      { name: "Garlic Chicken", price: 5.99 },
      { name: "Honey BBQ Chicken Bites", price: 5.99, note: "6 pieces" },
      { name: "Chilli Chicken", price: 5.99 },
      { name: "Garlic Parmesan Wings", price: 4.99 },
      { name: "Sweet Chilli Wings", price: 4.99 },
      { name: "BBQ Wings", price: 4.99 },
      { name: "Crispy Chicken Wings", price: 4.99 },
    ],
  },
  {
    id: "mains",
    label: "Mains",
    kind: "items",
    items: [
      { name: "Egg Roast", price: 6.99 },
      { name: "Chicken Roast", price: 7.99 },
      { name: "Mutton Korma", price: 8.99 },
      { name: "Chicken Korma", price: 7.99 },
      { name: "Butter Chicken", price: 7.99 },
      { name: "Chicken Tikka Masala", price: 7.99 },
      { name: "Chicken Madras", price: 7.99 },
      { name: "Chicken Vindaloo", price: 7.99 },
      { name: "Thai Red Chicken Curry", price: 7.99 },
      { name: "Thai Green Chicken Curry", price: 7.99 },
      { name: "Panang Curry", price: 7.99 },
      { name: "Diago Special Beef Stew", price: 10.99 },
      { name: "Beef Korma", price: 9.99 },
      { name: "Beef Roast", price: 9.99 },
      { name: "Chicken Piccata", price: 7.99 },
      { name: "Paneer Curry", price: 7.99 },
    ],
  },
  {
    id: "rice",
    label: "Rice",
    kind: "items",
    items: [
      { name: "Steam Rice", price: 2.99 },
      { name: "Pilaw Rice", price: 4.99 },
      { name: "Garlic Rice", price: 4.99 },
      { name: "Chicken Dum Biriyani", price: 9.99 },
      { name: "Mutton Dum Biriyani", price: 10.99 },
      { name: "Chicken Fried Rice", price: 8.99 },
      { name: "Veg Fried Rice", price: 7.99 },
      { name: "Seafood Fried Rice", price: 9.99 },
      { name: "Mixed Fried Rice", price: 10.99 },
    ],
  },
  {
    id: "specials",
    label: "Diago special foods",
    kind: "items",
    items: [
      { name: "Kottu", price: 9.99, note: "Chicken, mutton or beef" },
      { name: "Dum Parota", price: 7.99, note: "Chicken, mutton or beef" },
      { name: "Pad Thai", price: 8.99 },
      { name: "Singapore Vermicelli", price: 8.99 },
      { name: "Chowmein", price: 8.99 },
      { name: "Doner Kebab", price: 9.99 },
      { name: "Mixed Doner Kebab", price: 8.99 },
      { name: "Chicken Wrap", price: 6.99 },
      { name: "Doner Wrap", price: 6.99 },
      { name: "Mixed Kebab Wrap", price: 6.99 },
      { name: "Parmesan Chicken Wrap", price: 7.49 },
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
      { name: "Chicken Fillet Burger", price: 5.49 },
      { name: "Garlic Parmesan Dipped Cheese Burger", price: 7.99 },
    ],
  },
  {
    id: "chips",
    label: "Chips",
    kind: "items",
    items: [
      { name: "Plain Chips", price: 3.5 },
      { name: "Curly Fries", price: 3.99 },
      { name: "Nacho Cheese & Chips", price: 4.99 },
      { name: "Cheesy Chips", price: 4.99 },
      { name: "Peri Peri Chips", price: 4.5 },
      { name: "Loaded Fries", price: 5.99, note: "Chicken" },
      { name: "Mixed Loaded Fries", price: 7.99, note: "Chicken and doner" },
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
      { name: "Tiramisu", price: 4.99 },
      { name: "Cheesecake", price: 4.99 },
      { name: "Caramel Pudding", price: 4.99 },
      { name: "Chocolate Fudge Cake", price: 4.99 },
    ],
  },
  {
    id: "meal-deals",
    label: "Meal deals",
    kind: "deals",
    deals: [
      {
        name: "Classic Burger Meal",
        price: 8.49,
        includes: ["Chicken Burger or Chicken Fillet Burger", "Plain Chips", "Drink"],
      },
      {
        name: "Premium Burger Meal",
        price: 9.99,
        includes: ["Beef Burger or Doner Burger", "Plain Chips", "Drink"],
      },
      {
        name: "Wrap Meal",
        price: 9.49,
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
        price: 10.99,
        includes: [
          "Choice of Butter Chicken, Chicken Madras, Chicken Tikka or Chicken Roast",
          "Steam Rice or Pilaw Rice",
          "Drink",
        ],
      },
      {
        name: "Beef Special Meal",
        price: 12.99,
        includes: ["Beef Roast or Diago Special Beef Stew", "Steam Rice, Chips or Nan"],
      },
      {
        name: "Wings Combo",
        price: 7.99,
        includes: [
          "Choice of Garlic Parmesan, Sweet Chilli, BBQ or Crispy Chicken Wings",
          "Plain Chips",
          "Drink",
        ],
      },
      {
        name: "Diago Sharing Deal",
        price: 14.99,
        includes: ["2 Chicken Burgers", "2 Portions of Plain Chips", "6 Chicken Strips", "2 Drinks"],
      },
    ],
  },
];

export const delivery = {
  howToOrder: "Call us or place your order via WhatsApp.",
  headline: "Enjoy free delivery within 3 miles!",
  beyond: "Orders beyond 3 miles are subject to a small £2 delivery charge.",
  freeDelivery: "Free delivery within 3 miles",
  minimumOrder: "£15 to £20",
};

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
        "Potato Tuna Cheese Balls",
        "Chicken Lollipop",
        "Chicken Strips",
        "Chicken Nuggets",
        "Honey BBQ Chicken Bites",
        "Sweet Chilli Wings",
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
        "Thai Red Chicken Curry",
        "Thai Green Chicken Curry",
      ],
    },
    {
      title: "Rice",
      items: ["Pilaw Rice", "Chicken Dum Biriyani", "Mutton Dum Biriyani", "Chicken Fried Rice", "Mixed Fried Rice"],
    },
    {
      title: "Diago special foods",
      items: ["Kottu", "Pad Thai", "Singapore Vermicelli", "Mixed Doner Kebab", "Chips"],
    },
    {
      title: "Vegetarian options",
      items: ["Aloo Keema", "Paneer Curry", "Daal Makhni", "Cauliflower 65"],
    },
    {
      title: "Desserts",
      items: ["Tiramisu", "Cheesecake", "Caramel Pudding", "Chocolate Fudge Cake"],
    },
  ] satisfies BuffetGroup[],
};

export const categoryById = (id: string): MenuCategoryData => {
  const found = menuCategories.find((category) => category.id === id);
  if (!found) throw new Error(`Unknown menu category: ${id}`);
  return found;
};
