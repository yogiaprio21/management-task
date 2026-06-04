import { BriefcaseBusiness, UserRound } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const WorkspaceSwitcher = () => {
  const { workspaces, selectedWorkspaceId, selectedWorkspace, setSelectedWorkspaceId, isLoading } = useWorkspace();

  return (
    <div className="space-y-2">
      <label htmlFor="workspace-switcher" className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        Workspace
      </label>
      <div className="relative">
        {selectedWorkspace?.type === 'personal' ? (
          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        ) : (
          <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <select
          id="workspace-switcher"
          value={selectedWorkspaceId}
          onChange={(event) => setSelectedWorkspaceId(event.target.value)}
          disabled={isLoading || workspaces.length === 0}
          className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
        >
          {workspaces.length === 0 ? (
            <option value="">No workspace</option>
          ) : (
            workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};

export default WorkspaceSwitcher;
