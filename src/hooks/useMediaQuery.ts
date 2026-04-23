import { useState, useEffect } from "react";

const useMediaQuery = (query: string): boolean => {
  // Initialize with null during SSR to avoid hydration mismatch
  const [matches, setMatches] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only run on client-side
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia(query);

      // Set initial value
      setMatches(mediaQuery.matches);

      // Create event listener function
      const handler = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Add event listener
      mediaQuery.addEventListener("change", handler);

      // Cleanup
      return () => {
        mediaQuery.removeEventListener("change", handler);
      };
    }
  }, [query]);

  // Return false during SSR, actual value after mounting
  return mounted ? matches : false;
};

export default useMediaQuery;
