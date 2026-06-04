import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban } from 'lucide-react';
import { getProjects } from '../api/projects';
import { Select } from '../ui/Select';
import { useWorkspace } from '../context/WorkspaceContext';

interface ProjectSwitcherProps {
  value: string;
  onChange: (projectId: string) => void;
  label?: string;
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({ value, onChange, label = 'Project' }) => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });
  const { selectedWorkspaceId } = useWorkspace();
  const visibleProjects = useMemo(
    () => selectedWorkspaceId
      ? projects.filter((project) => !project.workspaceId || project.workspaceId === selectedWorkspaceId)
      : projects,
    [projects, selectedWorkspaceId],
  );

  useEffect(() => {
    if (!value && visibleProjects.length > 0) {
      onChange(visibleProjects[0].id);
    }
    if (value && visibleProjects.length > 0 && !visibleProjects.some((project) => project.id === value)) {
      onChange(visibleProjects[0].id);
    }
  }, [onChange, visibleProjects, value]);

  return (
    <div className="min-w-[240px]">
      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || visibleProjects.length === 0}
        aria-label="Select project"
      >
        {visibleProjects.length === 0 ? (
          <option value="">No projects</option>
        ) : (
          visibleProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))
        )}
      </Select>
      {visibleProjects.length === 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <FolderKanban className="h-3.5 w-3.5" />
          Create a project to unlock planning tools.
        </p>
      )}
    </div>
  );
};

export default ProjectSwitcher;
