/// <reference types="vite/client" />
interface Window {
  VC_CONFIG?: { SPOTIFY_CLIENT_ID?: string; API_BASE?: string };
  __vcLenis?: any;
  __vcIntroPending?: boolean;
  __vcIntro?: string;
}
interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_API_BASE?: string;
}
