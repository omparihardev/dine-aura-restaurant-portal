"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({
    initialSearch = "",
    children,
}: {
    initialSearch?: string;
    children: React.ReactNode;
}) {
    const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

    // Sync state if initialSearch changes (e.g. Server Component pass-down or navigation)
    useEffect(() => {
        if (initialSearch !== undefined) {
            setSearchQuery(initialSearch);
        }
    }, [initialSearch]);

    // Inspect URL on client mount to capture ?search= if directly loaded
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const queryFromUrl = params.get("search");
            if (queryFromUrl) {
                setSearchQuery(queryFromUrl);
            }
        }
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
        if (typeof window !== "undefined" && window.history.replaceState) {
            const url = new URL(window.location.href);
            if (url.searchParams.has("search")) {
                url.searchParams.delete("search");
                window.history.replaceState({}, "", url.pathname + url.search + url.hash);
            }
        }
    }, []);

    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery, clearSearch }}>
            {children}
        </SearchContext.Provider>
    );
}

export function usePortalSearch() {
    return useContext(SearchContext);
}
