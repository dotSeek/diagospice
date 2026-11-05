// Source of truth: "Diago Bar Menue.docx" supplied by the restaurant.
// Spelling was tidied the same way as the main menu. Dishes and prices were not changed.
// Soup and soft drinks were added later from the owner's own message, not the document.
import type { ItemCategory } from "./menu.ts";

export const barCategories: ItemCategory[] = [
  {
    id: "bar-soup",
    label: "Soup",
    kind: "items",
    items: [
      { name: "Soup (Veg)", price: 4.99 },
      { name: "Soup (Non Veg)", price: 3.99 },
    ],
  },
  {
    id: "bar-soft-drinks",
    label: "Soft drinks",
    kind: "items",
    items: [
      { name: "Coca Cola", price: 1.99, note: "Tin" },
      { name: "Fanta", price: 1.99, note: "Tin" },
      { name: "Pepsi", price: 1.99, note: "Tin" },
    ],
  },
  {
    id: "bar-starters",
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
    id: "bar-mains",
    label: "Mains with rice or nan",
    kind: "items",
    items: [
      { name: "Chicken Roast", price: 7.99 },
      { name: "Mutton Korma", price: 8.99 },
      { name: "Butter Chicken", price: 7.99 },
      { name: "Chicken Tikka", price: 7.99 },
      { name: "Chicken Madras", price: 7.99 },
      { name: "Chicken Vindaloo", price: 7.99 },
      { name: "Thai Red Chicken Curry", price: 7.99 },
      { name: "Thai Green Chicken Curry", price: 7.99 },
      { name: "Diago Special Beef Stew", price: 8.99 },
      { name: "Beef Korma", price: 8.99 },
      { name: "Beef Roast", price: 8.99 },
      { name: "Chicken Piccata", price: 7.99 },
      { name: "Paneer Curry", price: 7.99 },
    ],
  },
  {
    id: "bar-rice",
    label: "Rice",
    kind: "items",
    items: [
      { name: "Chicken Dum Biriyani", price: 7.99 },
      { name: "Mutton Dum Biriyani", price: 8.99 },
      { name: "Chicken Fried Rice", price: 6.99 },
      { name: "Veg Fried Rice", price: 5.99 },
      { name: "Seafood Fried Rice", price: 8.99 },
      { name: "Mixed Fried Rice", price: 8.99 },
    ],
  },
  {
    id: "bar-specials",
    label: "Diago special foods",
    kind: "items",
    items: [
      { name: "Kottu", price: 7.99, note: "Chicken, mutton or beef" },
      { name: "Dum Parota", price: 4.99, note: "Chicken, mutton or beef" },
      { name: "Pad Thai", price: 6.99 },
      { name: "Singapore Vermicelli", price: 6.99 },
      { name: "Chowmein", price: 6.99 },
      { name: "Doner Kebab", price: 7.99 },
      { name: "Mixed Doner Kebab", price: 6.99 },
      { name: "Chicken Wrap", price: 5.99 },
      { name: "Doner Wrap", price: 5.99 },
      { name: "Mixed Kebab Wrap", price: 5.99 },
      { name: "Parmesan Chicken Wrap", price: 6.49 },
    ],
  },
  {
    id: "bar-burgers",
    label: "Burgers with chips",
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
    id: "bar-chips",
    label: "Chips",
    kind: "items",
    items: [
      { name: "Plain Chips", price: 2.5 },
      { name: "Curly Fries", price: 2.99 },
      { name: "Nacho Cheese & Chips", price: 3.99 },
      { name: "Cheesy Chips", price: 3.99 },
      { name: "Peri Peri Chips", price: 3.5 },
      { name: "Loaded Fries", price: 4.99, note: "Chicken" },
      { name: "Mixed Loaded Fries", price: 6.99, note: "Doner and chicken" },
    ],
  },
  {
    id: "bar-nan",
    label: "Nan",
    kind: "items",
    items: [
      { name: "Plain Nan", price: 1.99 },
      { name: "Butter Nan", price: 2.99 },
    ],
  },
  {
    id: "bar-desserts",
    label: "Desserts",
    kind: "items",
    items: [
      { name: "Tiramisu", price: 3.99 },
      { name: "Cheesecake", price: 3.99 },
      { name: "Caramel Pudding", price: 3.99 },
      { name: "Chocolate Fudge Cake", price: 3.99 },
    ],
  },
];

export const barCategoryById = (id: string): ItemCategory => {
  const found = barCategories.find((category) => category.id === id);
  if (!found) throw new Error(`Unknown bar category: ${id}`);
  return found;
};
