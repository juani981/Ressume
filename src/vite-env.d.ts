/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_TWO_COLUMN_MODE?: string;
  readonly VITE_ENABLE_BITACORA?: string;
  readonly VITE_ENABLE_BITACORA_TOUR?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
