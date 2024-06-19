export function getBaseUrl() {
  // Check if NEXT_PUBLIC_BASE_URL is set
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Fallback to localhost with port 3000
  const host = process.env.NEXT_PUBLIC_HOST || "localhost";
  const port = parseInt(process.env.PORT || "3000", 10);

  return `http://${host}:${port}`;
}

async function apiFetch(endpoint: string, options?: RequestInit): Promise<any> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Failed to fetch: ${error.message}`);
    throw error;
  }
}

export default apiFetch;
