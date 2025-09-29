//API Utility – /utils/api.js

import axios from 'axios';
const api = axios.create({
  // Use an environment variable for the backend URL.
  // In Next.js, client-side env vars must be prefixed with NEXT_PUBLIC_.
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

export default api;