// src/config.js
const isProduction =
  window.location.hostname !== "localhost" &&
  !window.location.hostname.includes("127.0.0.1");

const API_BASE_URL = isProduction
  ? "" // Empty string for relative URLs in production
  : "http://localhost:8080";
export { API_BASE_URL };
export default API_BASE_URL;
