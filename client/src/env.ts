export const env = {
  // Default matches server (5050 avoids macOS AirPlay taking 5000).
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050',
}

