/**
 * Resolves the configuration base URL for API requests.
 * This supports decoupled deployments where the frontend is static (e.g. Vercel)
 * and the backend is an Express API service (e.g. Render).
 */
export function getApiUrl(subpath: string): string {
  const metaEnv = (import.meta as any).env || {};
  
  // Try custom API URL (e.g. Render URL) first, then try APP_URL, NEXT_PUBLIC_APP_URL, and fallback to relative paths
  const baseUrl = 
    metaEnv.VITE_API_URL || 
    metaEnv.VITE_APP_URL ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL) ||
    (typeof process !== 'undefined' && process.env?.APP_URL) ||
    '';
    
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanSubpath = subpath.startsWith('/') ? subpath : '/' + subpath;
  
  return `${cleanBase}${cleanSubpath}`;
}
