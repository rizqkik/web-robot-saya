const DEFAULT_BACKEND_URL = 'http://192.168.137.243:5000';
const BACKEND_STORAGE_KEY = 'robot-rescue-backend-url';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isPrivateHost = (host: string) => {
  const normalizedHost = host.toLowerCase();

  return (
    normalizedHost === 'localhost' ||
    normalizedHost.startsWith('127.') ||
    normalizedHost.startsWith('10.') ||
    normalizedHost.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalizedHost)
  );
};

const normalizeBackendUrl = (value?: string | null) => {
  if (!value) return undefined;

  const trimmedValue = stripTrailingSlash(value.trim());
  if (!trimmedValue) return undefined;

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  const host = trimmedValue.split('/')[0];
  const protocol = isPrivateHost(host) ? 'http' : 'https';
  return `${protocol}://${trimmedValue}`;
};

const readRuntimeBackendUrl = () => {
  if (typeof window === 'undefined') return undefined;

  const params = new URLSearchParams(window.location.search);
  const queryBackend = normalizeBackendUrl(params.get('backend') || params.get('api'));

  if (queryBackend) {
    window.localStorage.setItem(BACKEND_STORAGE_KEY, queryBackend);
    return queryBackend;
  }

  return normalizeBackendUrl(window.localStorage.getItem(BACKEND_STORAGE_KEY));
};

const getHostFromUrl = (value: string) => {
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
};

export const getBackendConfig = () => {
  const envBackendUrl = normalizeBackendUrl(import.meta.env.VITE_BACKEND_URL);
  const runtimeBackendUrl = readRuntimeBackendUrl();
  const backendUrl = runtimeBackendUrl || envBackendUrl || DEFAULT_BACKEND_URL;
  const socketUrl = normalizeBackendUrl(import.meta.env.VITE_SOCKET_IO_URL) || backendUrl;
  const videoFeedUrl = normalizeBackendUrl(import.meta.env.VITE_VIDEO_FEED_URL) || `${backendUrl}/video_feed`;

  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpBackend = backendUrl.startsWith('http://');
  const backendHost = getHostFromUrl(backendUrl);
  const isPrivateLanBackend = isPrivateHost(backendHost);

  return {
    backendUrl,
    socketUrl,
    videoFeedUrl,
    backendHost,
    isMixedContentRisk: isHttpsPage && isHttpBackend,
    isPrivateLanBackend,
  };
};

export const getBackendHelpText = () => {
  const { isMixedContentRisk, isPrivateLanBackend } = getBackendConfig();

  if (isMixedContentRisk) {
    return 'Vercel memakai HTTPS, jadi backend kamera/socket juga perlu HTTPS. Gunakan Cloudflare Tunnel/ngrok atau set VITE_BACKEND_URL ke domain HTTPS Raspi.';
  }

  if (isPrivateLanBackend) {
    return 'Backend masih memakai IP lokal. HP harus satu jaringan dengan Raspi, atau gunakan tunnel publik supaya bisa diakses dari luar.';
  }

  return null;
};
