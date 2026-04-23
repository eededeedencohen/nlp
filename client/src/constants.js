export const DOMAIN = import.meta.env.PROD
  ? ""
  : import.meta.env.VITE_API_URL || "http://localhost:5000";
