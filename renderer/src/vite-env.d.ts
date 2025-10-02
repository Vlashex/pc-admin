/// <reference types="vite/client" />

declare global {
  interface Window {
    electron: {
      startTailscale: () => Promise<string>;
      stopTailscale: () => Promise<string>;
      getTailscaleStatus: () => Promise<{ isActive: boolean }>;
      getTailscaleConntectionStatus: () => Promise<{
        isActive: boolean;
        ping: string | null;
        loss: string | null;
      }>;
      sendFlagRequest: () => Promise<string>;
    };
  }
}

export {};
