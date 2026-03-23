/// <reference types="vite/client" />

declare module 'svgo/dist/svgo.browser.js' {
  export function optimize(
    input: string,
    config?: {
      multipass?: boolean;
      plugins?: Array<string | { name: string; params?: Record<string, unknown> }>;
    }
  ): { data: string };
}
