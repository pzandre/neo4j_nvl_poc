export const API_URL = process.env.REACT_APP_API_URL || "";
export const API_KEY = process.env.REACT_APP_API_KEY || "";
export const API_TOKEN = process.env.REACT_APP_API_TOKEN || "";

if (!API_URL || !API_KEY || !API_TOKEN) {
  throw new Error("Missing required environment variables: REACT_APP_API_URL, REACT_APP_API_KEY, or REACT_APP_API_TOKEN");
}