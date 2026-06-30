"use client";

import React, { createContext, useEffect, useContext, useState } from "react";

const TutorialContext = createContext();

const STORAGE_KEY = "tutorial-mode";

export function TutorialProvider({ children }) {
  const [isTutorialMode, setIsTutorialMode] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isTutorialMode));
    } catch (e) {
      console.warn("Failed to save tutorial mode to localStorage:", e);
    }
  }, [isTutorialMode]);

  const toggleTutorialMode = () => {
    setIsTutorialMode((prev) => !prev);
  };

  const exitTutorialMode = () => {
    setIsTutorialMode(false);
  };

  return (
    <TutorialContext.Provider
      value={{
        isTutorialMode,
        setIsTutorialMode,
        toggleTutorialMode,
        exitTutorialMode,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => {
  const context = useContext(TutorialContext);

  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }

  return context;
};