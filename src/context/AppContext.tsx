import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AccessRequest } from '../types/exam-flow-types';
import { mockAccessRequests } from '../data/mockData';

interface AppContextType {
  accessRequests: AccessRequest[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  approveRequest: (id: string) => void;
  denyRequest: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(mockAccessRequests);

  const unreadCount = accessRequests.filter(
    (req) => req.status === 'pending' && !req.read
  ).length;

  const markAsRead = (id: string) => {
    setAccessRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, read: true } : req))
    );
  };

  const approveRequest = (id: string) => {
    setAccessRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: 'approved', read: true } : req
      )
    );
  };

  const denyRequest = (id: string) => {
    setAccessRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: 'denied', read: true } : req
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        accessRequests,
        unreadCount,
        markAsRead,
        approveRequest,
        denyRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}