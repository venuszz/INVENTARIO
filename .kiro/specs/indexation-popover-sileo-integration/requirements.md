# Requirements Document

## Introduction

This document specifies the requirements for integrating the Sileo toast notification library into the IndexationPopover component. The integration will replace custom real-time change notification cards with professional, physics-based toast notifications while maintaining all existing indexation progress functionality.

Sileo (https://sileo.aaryan.design) is a modern toast notification library featuring spring physics animations and SVG morphing. The integration will improve code maintainability by reducing custom animation code and provide a more standard toast notification UX.

## Glossary

- **IndexationPopover**: The floating component that displays indexation progress and real-time database change notifications
- **Sileo**: A physics-based toast notification library with SVG morphing animations
- **Toaster**: The Sileo component that manages and displays toast notifications
- **Toast**: An individual notification displayed by Sileo
- **RealtimeChangeEvent**: An event object representing a database change (INSERT, UPDATE, DELETE)
- **IndexationStore**: Zustand store managing indexation state and realtime changes
- **Module**: A data module being indexed (INEA, ITEA, Resguardos, etc.)
- **Dark_Mode**: The application's dark theme setting

## Requirements

### Requirement 1: Install Sileo Library

**User Story:** As a developer, I want to install the Sileo library, so that I can use its toast notification components in the application.

#### Acceptance Criteria

1. THE System SHALL install the sileo package via npm
2. THE System SHALL verify the package is added to package.json dependencies
3. THE System SHALL ensure the package is compatible with the existing Next.js and React versions

### Requirement 2: Add Toaster Component to Layout

**User Story:** As a developer, I want to add the Sileo Toaster component to the application layout, so that toasts can be displayed globally throughout the application.

#### Acceptance Criteria

1. THE System SHALL add the Sileo Toaster component to the root layout or main app component
2. THE Toaster SHALL be configured to support dark mode based on the useTheme hook
3. THE Toaster SHALL be positioned to avoid conflicts with existing UI elements
4. THE Toaster SHALL render on the client side only (not during SSR)

### Requirement 3: Replace Realtime Change Notification Cards

**User Story:** As a user, I want to see database changes as Sileo toast notifications, so that I have a consistent and professional notification experience.

#### Acceptance Criteria

1. WHEN a realtime change event occurs, THE System SHALL display a Sileo toast instead of a custom notification card
2. THE System SHALL remove the custom AnimatePresence notification card rendering code from IndexationPopover
3. THE System SHALL maintain the existing realtimeChanges array filtering logic (showing only non-dismissed changes, limited to 3)
4. THE System SHALL preserve the auto-dismiss behavior (5 seconds timeout)

### Requirement 4: Display Event Type Information in Toasts

**User Story:** As a user, I want to see the type of database change in the toast, so that I understand what action occurred.

#### Acceptance Criteria

1. WHEN an INSERT event occurs, THE Toast SHALL display "Agregado" text with a Plus icon and green color (#10b981)
2. WHEN an UPDATE event occurs, THE Toast SHALL display "Actualizado" text with an Edit2 icon and blue color (#3b82f6)
3. WHEN a DELETE event occurs, THE Toast SHALL display "Eliminado" text with a Trash2 icon and red color (#ef4444)
4. THE Toast SHALL display the module name or "CONFIGURACIÓN" for config table changes
5. THE Toast SHALL use the existing getEventIcon, getEventColor, and getEventText utility functions

### Requirement 5: Support Manual Toast Dismissal

**User Story:** As a user, I want to manually dismiss toast notifications, so that I can clear notifications I've already seen.

#### Acceptance Criteria

1. THE Toast SHALL include a close button or dismiss action
2. WHEN the user dismisses a toast, THE System SHALL call the dismissRealtimeChange function from IndexationStore
3. THE System SHALL remove the dismissed toast from the display
4. THE System SHALL maintain the existing dismiss animation behavior

### Requirement 6: Display Module Completion Success Toasts

**User Story:** As a user, I want to see a toast notification when a module completes indexation, so that I'm informed of successful operations.

#### Acceptance Criteria

1. WHEN a module transitions from isIndexing=true to isIndexed=true without errors, THE System SHALL display a success toast
2. THE Success_Toast SHALL include the module name and completion message
3. THE Success_Toast SHALL use the module's configured glowColor for visual consistency
4. THE Success_Toast SHALL auto-dismiss after 5 seconds

### Requirement 7: Display Connection Error Toasts

**User Story:** As a user, I want to see toast notifications for connection errors, so that I'm aware of connectivity issues.

#### Acceptance Criteria

1. WHEN a module's reconnectionStatus changes to 'failed', THE System SHALL display an error toast
2. THE Error_Toast SHALL include the module name and "Conexión perdida" message
3. THE Error_Toast SHALL suggest reindexing as a recovery action
4. THE Error_Toast SHALL use red/orange color scheme for error indication
5. THE Error_Toast SHALL remain visible until manually dismissed or reconnection succeeds

### Requirement 8: Display Reconnection Status Toasts

**User Story:** As a user, I want to see toast notifications during reconnection attempts, so that I understand the system is attempting to recover.

#### Acceptance Criteria

1. WHEN a module's reconnectionStatus changes to 'reconnecting', THE System SHALL display an info toast
2. THE Reconnection_Toast SHALL show "Reconectando..." message with attempt count
3. WHEN a module's reconnectionStatus changes to 'reconciling', THE System SHALL display "Sincronizando..." message
4. THE Reconnection_Toast SHALL auto-dismiss when reconnection completes successfully

### Requirement 9: Maintain Dark Mode Support

**User Story:** As a user, I want toast notifications to respect my dark mode preference, so that the UI remains consistent with my theme choice.

#### Acceptance Criteria

1. THE Toaster SHALL use the isDarkMode value from useTheme hook
2. WHEN isDarkMode is true, THE Toasts SHALL use dark background colors and light text
3. WHEN isDarkMode is false, THE Toasts SHALL use light background colors and dark text
4. THE Toast colors SHALL maintain sufficient contrast for accessibility in both modes

### Requirement 10: Preserve Indexation Popover Functionality

**User Story:** As a user, I want the indexation progress popover to continue working as before, so that I can monitor module indexation status.

#### Acceptance Criteria

1. THE IndexationPopover SHALL continue to display module indexation progress bars
2. THE IndexationPopover SHALL continue to show module states (indexing, completed, error)
3. THE IndexationPopover SHALL continue to display reconnection status indicators
4. THE IndexationPopover SHALL continue to auto-hide after 5 seconds when all modules complete
5. THE IndexationPopover SHALL NOT display realtime change notification cards (moved to Sileo toasts)

### Requirement 11: Maintain IndexationStore Integration

**User Story:** As a developer, I want the IndexationStore to continue managing realtime changes, so that the state management architecture remains consistent.

#### Acceptance Criteria

1. THE System SHALL continue to use the realtimeChanges array from IndexationStore
2. THE System SHALL continue to call addRealtimeChange when new events occur
3. THE System SHALL continue to call dismissRealtimeChange when toasts are dismissed
4. THE System SHALL NOT modify the IndexationStore interface or state structure
5. THE System SHALL maintain the existing auto-dismiss timeout behavior (5 seconds)

### Requirement 12: Remove Custom Animation Code

**User Story:** As a developer, I want to remove custom framer-motion animation code for notification cards, so that the codebase is simpler and more maintainable.

#### Acceptance Criteria

1. THE System SHALL remove the custom AnimatePresence block for realtimeChanges rendering
2. THE System SHALL remove the custom motion.div notification card components
3. THE System SHALL remove unused animation variants and transition configurations for notification cards
4. THE System SHALL preserve framer-motion animations for the indexation popover itself
5. THE System SHALL reduce the overall lines of code in IndexationPopover.tsx

### Requirement 13: Handle Toast Positioning

**User Story:** As a user, I want toast notifications positioned appropriately, so that they don't overlap with the indexation popover or other UI elements.

#### Acceptance Criteria

1. THE Toaster SHALL be positioned in a corner that doesn't conflict with the IndexationPopover (top-right)
2. THE Toasts SHALL stack vertically without overlapping
3. THE Toasts SHALL remain visible and readable on all screen sizes
4. THE Toasts SHALL appear below the header component (z-index coordination)

### Requirement 14: Preserve Event Metadata

**User Story:** As a developer, I want toast notifications to include all relevant event metadata, so that debugging and monitoring remain effective.

#### Acceptance Criteria

1. THE Toast SHALL include the moduleKey from the RealtimeChangeEvent
2. THE Toast SHALL include the moduleName from the RealtimeChangeEvent
3. THE Toast SHALL include the table name from the RealtimeChangeEvent
4. THE Toast SHALL include the eventType from the RealtimeChangeEvent
5. THE Toast SHALL optionally include recordId and recordName when available

### Requirement 15: Maintain Performance Characteristics

**User Story:** As a user, I want toast notifications to perform smoothly, so that the application remains responsive.

#### Acceptance Criteria

1. THE System SHALL limit the number of simultaneously displayed toasts to 3 or fewer
2. THE System SHALL use Sileo's built-in animation optimizations
3. THE System SHALL not cause layout shifts when toasts appear or disappear
4. THE System SHALL maintain 60fps animation performance on modern browsers
5. THE System SHALL clean up dismissed toasts from memory within 1 second
