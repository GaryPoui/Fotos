import type { PlaceCategory } from "./types.js";
export const placeCategories: {
  id: PlaceCategory;
  label: string;
  color: string;
}[] = [
  { id: "cafe", label: "Cafés", color: "#765136" },
  { id: "restaurant", label: "Restaurantes", color: "#924869" },
  { id: "shopping", label: "Shoppings", color: "#705495" },
  { id: "visit", label: "Lugares a visitar", color: "#345c78" },
  { id: "important", label: "Lugares importantes", color: "#b13c63" },
  { id: "park", label: "Parques y paseos", color: "#37785d" },
  { id: "other", label: "Otros", color: "#536b7b" },
];
export const validPoint = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;
export const mapsLink = (lat: number, lng: number) =>
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(lat + "," + lng);
