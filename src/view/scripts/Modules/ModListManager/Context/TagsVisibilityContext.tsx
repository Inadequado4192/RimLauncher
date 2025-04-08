import React from "react";

export const TagsVisibilityContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const [tagsV, setTagsV] = React.useState(new Set<string>());
    return { tagsV, setTagsV };
}

export function TagsVisibilityContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <TagsVisibilityContext.Provider value={useDate()}>{children}</TagsVisibilityContext.Provider>
    )
}