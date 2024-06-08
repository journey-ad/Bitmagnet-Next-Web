export function getBaseUrl() {
  // Check if NEXT_PUBLIC_BASE_URL is set
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Fallback to using localhost with a dynamic port
  const port = process.env.PORT || 3000;

  return `http://localhost:${port}`;
}

async function apiFetch(endpoint: string, options?: RequestInit) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  return response.json();
}

export default apiFetch;
