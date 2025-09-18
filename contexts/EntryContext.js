import React, { createContext, useContext, useState, useCallback } from 'react';

const EntryContext = createContext();

export const useEntryContext = () => {
  const context = useContext(EntryContext);
  if (!context) {
    throw new Error('useEntryContext must be used within an EntryProvider');
  }
  return context;
};

export const EntryProvider = ({ children }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentEntryData, setCurrentEntryData] = useState(null);

  const updateEntryState = useCallback((hasChanges, entryData) => {
    setHasUnsavedChanges(hasChanges);
    setCurrentEntryData(entryData);
  }, []);

  const clearEntryState = useCallback(() => {
    setHasUnsavedChanges(false);
    setCurrentEntryData(null);
  }, []);

  return (
    <EntryContext.Provider
      value={{
        hasUnsavedChanges,
        currentEntryData,
        updateEntryState,
        clearEntryState,
      }}
    >
      {children}
    </EntryContext.Provider>
  );
};
