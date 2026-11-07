// Dishes the kitchen has available on the in house restaurant and bar menus, from the owner's
// "Today Available menu list" (7 Nov 2026). Every other dish and every deal is hidden, not
// deleted: it keeps its price in private/data and comes back by adding its name here.
// Set AVAILABLE to null to show the full menus again. Soft drinks are not food and stay on.
// Names match private/data (Korama is Korma, Lorded is Loaded, Sea Food is Seafood).
// Run `npm run menu:dine-in` after a change, then deploy.
export const AVAILABLE: ReadonlySet<string> | null = new Set([
  // Starters
  "Papadam", "Mutton Rolls", "Onion Bhaji", "Garlic Chicken",
  // Mains with rice or nan (the bar menu calls Chicken Tikka Masala "Chicken Tikka")
  "Chicken Korma", "Butter Chicken", "Chicken Tikka Masala", "Chicken Tikka", "Chicken Madras", "Chicken Vindaloo",
  "Thai Red Chicken Curry", "Thai Green Chicken Curry", "Panang Curry", "Diago Special Beef Stew", "Beef Korma", "Beef Roast",
  // Rice
  "Mutton Dum Biriyani", "Chicken Fried Rice", "Veg Fried Rice", "Seafood Fried Rice", "Mixed Fried Rice",
  // Diago special foods
  "Kottu", "Dum Parota", "Doner Kebab", "Mixed Doner Kebab",
  // Chips
  "Plain Chips", "Nacho Cheese & Chips", "Cheesy Chips", "Peri Peri Chips", "Loaded Fries", "Mixed Loaded Fries",
  // Nan
  "Plain Nan", "Butter Nan",
  // Dessert
  "Tiramisu",
]);

/** Categories that are not food on the list and always stay on. */
export const ALWAYS_ON = new Set(["bar-soft-drinks"]);
