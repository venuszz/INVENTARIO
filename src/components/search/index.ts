// Main component
export { default as UniversalSearchBar } from './UniversalSearchBar';

// Sub-components
export { default as SearchResultGroup } from './SearchResultGroup';
export { default as SearchResultItem } from './SearchResultItem';
export { default as SearchEmptyState } from './SearchEmptyState';
export { default as SearchLoadingState } from './SearchLoadingState';
export { default as SearchHistory } from './SearchHistory';
export { default as QuickActions } from './QuickActions';

// Re-export types
export type { SearchResult, SearchResultsByOrigin, MatchType } from './types';
