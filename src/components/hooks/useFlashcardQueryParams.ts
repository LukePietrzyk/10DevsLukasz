import { useMemo, useState, useEffect, useCallback } from "react";
import type { FlashcardQueryDto } from "@/types";
import { useMediaQuery } from "./useMediaQuery";

/**
 * Custom hook for managing flashcard query parameters from URL.
 * Reads query parameters from window.location.search and provides
 * a way to update them.
 * @returns Object with queryParams and updateQueryParams function
 */
export function useFlashcardQueryParams() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [urlKey, setUrlKey] = useState(0);

  // Listen to URL changes (browser back/forward)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      setUrlKey((prev) => prev + 1);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Read query parameters from URL
  const queryParams: FlashcardQueryDto = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        page: 1,
        pageSize: isMobile ? 25 : 50,
        // No sort/order - backend will use defaults (created_at desc - newest first)
      };
    }

    const searchParams = new URLSearchParams(window.location.search);

    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    return {
      page: pageParam ? parseInt(pageParam, 10) : 1,
      pageSize: pageSizeParam ? parseInt(pageSizeParam, 10) : isMobile ? 25 : 50,
      search: searchParams.get("search") || undefined,
      subject: searchParams.get("subject") || undefined,
      // No sort/order - backend will use defaults (created_at desc - newest first)
    };
  }, [isMobile, urlKey]);

  const updateQueryParams = useCallback((updates: Partial<FlashcardQueryDto>) => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        searchParams.delete(key);
      } else {
        searchParams.set(key, value.toString());
      }
    });

    // Update URL without page reload
    const newUrl = `${window.location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    window.history.pushState({}, "", newUrl);

    // Force re-render to update queryParams
    setUrlKey((prev) => prev + 1);
  }, []);

  return { queryParams, updateQueryParams };
}
