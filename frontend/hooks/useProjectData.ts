'use client';

import { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '@/services/api';

export interface ProjectData {
  project: any;
  outputs: Record<string, any>;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useProjectData(id: string): ProjectData {
  const [project, setProject] = useState<any>(null);
  const [outputs, setOutputs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    try {
      const data = await projectsAPI.get(id);
      setProject(data);
      setOutputs(data.outputs || {});
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProject(); }, [loadProject]);

  return { project, outputs, loading, refresh: loadProject };
}