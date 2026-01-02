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
        sort: "created_at",
        order: "desc",
      };
    }

    const searchParams = new URLSearchParams(window.location.search);

    return {
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : isMobile ? 25 : 50,
      search: searchParams.get("search") || undefined,
      subject: searchParams.get("subject") || undefined,
      sort: (searchParams.get("sort") as "created_at" | "next_review_at") || "created_at",
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
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
