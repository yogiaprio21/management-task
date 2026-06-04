import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaces } from '../api/workspaces';
import { useAuth } from './AuthContext';
import type { Workspace } from '../types';

interface WorkspaceContextType {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  selectedWorkspace?: Workspace;
  setSelectedWorkspaceId: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = 'taskflow:selected-workspace';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState(() => localStorage.getItem(STORAGE_KEY) || '');

  const { data: workspaces = [], isError, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!workspaces.length) {
      setSelectedWorkspaceIdState('');
      return;
    }
    const stillExists = workspaces.some((workspace) => workspace.id === selectedWorkspaceId);
    if (!selectedWorkspaceId || !stillExists) {
      setSelectedWorkspaceIdState(workspaces[0].id);
      localStorage.setItem(STORAGE_KEY, workspaces[0].id);
    }
  }, [selectedWorkspaceId, workspaces]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId),
    [selectedWorkspaceId, workspaces],
  );

  const setSelectedWorkspaceId = (id: string) => {
    setSelectedWorkspaceIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces, selectedWorkspaceId, selectedWorkspace, setSelectedWorkspaceId, isLoading, isError }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};
