import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // Ensure we're in a browser environment and window exists
    if (typeof window !== 'undefined') {
      // Create a promise that resolves when the framework is ready
      const readyPromise = new Promise<void>((resolve) => {
        if (window.frameworkReady) {
          window.frameworkReady();
        }
        resolve();
      });

      // Handle the ready state
      readyPromise.catch((error) => {
        console.error('Framework initialization error:', error);
      });
    }
  }, []);
}