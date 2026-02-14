# Resguardos Consultar - Component Structure

## ✅ STATUS: Fully Integrated Orchestrator

The orchestrator component (`index.tsx`) has been successfully implemented and integrates all modular pieces (hooks, components, modals) to provide complete resguardos consultation functionality.

## Features

- ✅ Search resguardos by folio with debounced input
- ✅ Filter by date, director, and resguardante
- ✅ Sort by folio, fecha, or director
- ✅ Paginated list view with customizable rows per page
- ✅ Detailed resguardo view with articles grouped by resguardante
- ✅ Edit resguardante names for articles
- ✅ Delete individual articles, multiple selected articles, or entire resguardo
- ✅ Generate PDF for entire resguardo or specific resguardante
- ✅ Generate PDF de baja after deletion operations
- ✅ Load resguardo automatically from URL parameter (?folio=XXX)
- ✅ Real-time data synchronization with indexation system
- ✅ Dark mode support throughout
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Role-based access control for admin operations

## Architecture

The component follows a modular architecture with clear separation of concerns:

## Directory Structure

```
src/components/resguardos/consultar/
├── index.tsx                    # Main orchestrator component (✅ IMPLEMENTED)
├── components/                  # UI Components
│   ├── Header.tsx
│   ├── SearchBar.tsx
│   ├── AdvancedFilters.tsx
│   ├── Pagination.tsx
│   ├── ResguardosTable.tsx
│   ├── ResguardoDetailsPanel.tsx
│   └── ArticulosListPanel.tsx
├── modals/                      # Modal Components
│   ├── ErrorAlert.tsx
│   ├── DeleteAllModal.tsx
│   ├── DeleteItemModal.tsx
│   └── DeleteSelectedModal.tsx
├── hooks/                       # Custom Hooks
│   ├── useResguardosData.ts
│   ├── useResguardoDetails.ts
│   ├── useResguardantesEdit.ts
│   ├── useResguardoDelete.ts
│   └── usePDFGeneration.ts
├── types.ts                     # TypeScript interfaces
├── utils.ts                     # Utility functions
└── README.md                    # This file
```

## Implementation Details

### State Management

The orchestrator coordinates state across 5 custom hooks:

1. **useResguardosData**: Manages the resguardos list with search, filters, sorting, and pagination
2. **useResguardoDetails**: Handles loading and displaying details for a selected resguardo
3. **useResguardantesEdit**: Manages editing of resguardante names
4. **useResguardoDelete**: Handles deletion operations (single, multiple, all)
5. **usePDFGeneration**: Manages PDF generation for resguardos and bajas

### Component Integration

All UI components are properly integrated with the hooks:

- **Header**: Displays total resguardos count
- **SearchBar**: Connected to search state with debouncing
- **AdvancedFilters**: Connected to filter states
- **ResguardosTable**: Displays paginated list with sorting
- **Pagination**: Controls page navigation and rows per page
- **ResguardoDetailsPanel**: Shows selected resguardo details
- **ArticulosListPanel**: Displays articles grouped by resguardante

### Modal Integration

All modals are properly integrated:

- **ErrorAlert**: Auto-dismissing error messages
- **DeleteAllModal**: Confirmation for deleting entire resguardo
- **DeleteItemModal**: Confirmation for deleting single article
- **DeleteSelectedModal**: Confirmation for deleting multiple articles
- **PDF Baja Modal**: Custom modal for downloading baja PDFs

## Usage

```tsx
import ConsultarResguardos from '@/components/resguardos/consultar';

// Basic usage
<ConsultarResguardos />

// With URL parameter
<ConsultarResguardos folioParam="RES-2024-001" />
```

## Benefits of Modular Architecture

1. **Maintainability**: Each component and hook has a single responsibility
2. **Testability**: Hooks and components can be tested in isolation
3. **Reusability**: Components can be reused in other parts of the app
4. **Performance**: Easier to optimize individual components with React.memo
5. **Developer Experience**: Easier to understand and modify specific features

## Technical Notes

- All TypeScript types are properly defined with no `any` types
- Dark mode support is maintained throughout all components
- All accessibility features are preserved
- Responsive design works on mobile, tablet, and desktop
- Role-based access control is enforced for admin operations
