import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban } from 'lucide-react';
import { getProjects } from '../api/projects';
import { Select } from '../ui/Select';

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

  useEffect(() => {
    if (!value && projects.length > 0) {
      onChange(projects[0].id);
    }
  }, [onChange, projects, value]);

  return (
    <div className="min-w-[240px]">
      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || projects.length === 0}
        aria-label="Select project"
      >
        {projects.length === 0 ? (
          <option value="">No projects</option>
        ) : (
          projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))
        )}
      </Select>
      {projects.length === 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <FolderKanban className="h-3.5 w-3.5" />
          Create a project to unlock planning tools.
        </p>
      )}
    </div>
  );
};

export default ProjectSwitcher;
