/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_LEAD_WEBHOOK?: string
  readonly VITE_CHECKOUT_STARTER_URL?: string
  readonly VITE_CHECKOUT_MACHINE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
