// Types for Inconsistency Resolver Mode

export type ResolverMode = 'idle' | 'active' | 'completing';

export interface ResolverState {
  mode: ResolverMode;
  selectedIndex: number;
  resolvedIds: Set<string>;
  isResolving: boolean;
}

export interface ResolutionAction {
  type: 'keep_one' | 'remove_area' | 'delete_director' | 'delete_area' | 'skip';
  targetId: number;
  additionalData?: any;
}

export interface DirectorStats {
  bienesCount: number;
  resguardosCount: number;
}

export interface InconsistencyWithStats {
  id: string;
  type: 'duplicate_area' | 'empty_director' | 'empty_area';
  areaId?: number;
  areaName?: string;
  directorId?: number;
  directorName?: string;
  directors?: Array<{
    id: number;
    nombre: string;
    stats?: DirectorStats;
  }>;
  areas?: Array<{
    id: number;
    nombre: string;
    stats?: DirectorStats;
  }>;
  stats?: DirectorStats;
}

export interface ResolverContextValue {
  mode: ResolverMode;
  selectedIndex: number;
  selectedInconsistency: InconsistencyWithStats | null;
  inconsistencies: InconsistencyWithStats[];
  pendingCount: number;
  resolvedCount: number;
  enterResolverMode: () => void;
  exitResolverMode: () => void;
  selectInconsistency: (index: number) => void;
  nextInconsistency: () => void;
  previousInconsistency: () => void;
  markAsResolved: (id: string) => void;
}
