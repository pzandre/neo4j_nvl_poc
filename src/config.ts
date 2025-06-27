export const API_URL = import.meta.env.VITE_API_URL || "";
export const API_KEY = import.meta.env.VITE_API_KEY || "";
export const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

if (!API_URL || !API_KEY || !API_TOKEN) {
  throw new Error("Missing required environment variables: VITE_API_URL, VITE_API_KEY, or VITE_API_TOKEN");
}