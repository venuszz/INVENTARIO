# Directorio Transfer UUID Type Fix

## Issue
Error during partial bienes transfer: `invalid input syntax for type uuid: "44"`

The error occurred because the transfer system was using mixed types (`string | number`) for bien IDs, but all three database tables (muebles, mueblesitea, mueblestlaxcala) use UUID strings as primary keys.

## Root Cause
1. The `allBienes` array in `TransferMode.tsx` was typed as `id: string | number`
2. The `SelectedBien` and `BienPreview` types allowed `id: string | number`
3. The API validation didn't enforce string types for IDs
4. Resguardo matching logic was attempting numeric conversions

## Changes Made

### 1. Type Definitions (`src/components/admin/directorio/types/transfer.ts`)
- Updated `SelectedBien.id` from `string | number` to `string`
- Updated `BienPreview.id` from `string | number` to `string`
- Updated `TransferPartialBienesRequest.bienIds` to use `string[]` instead of `Array<string | number>`

### 2. Transfer Mode Component (`src/components/admin/directorio/components/transfer/TransferMode.tsx`)
- Changed `allBienes` type definition to use `id: string`
- Added explicit `String()` conversion when building bienes arrays from stores
- Fixed resguardo matching logic to use string comparison instead of numeric conversion

### 3. Transfer Mode Hook (`src/components/admin/directorio/hooks/useTransferMode.ts`)
- Updated `deselectBienes` parameter type from `Array<string | number>` to `string[]`
- Updated return type interface to match

### 4. Transfer Actions Hook (`src/components/admin/directorio/hooks/useTransferActions.ts`)
- Updated `transferPartialBienes` parameter type to use `string[]` for bien IDs
- Updated interface definition to match

### 5. Source Selection Panel (`src/components/admin/directorio/components/transfer/SourceSelectionPanel.tsx`)
- Updated `Bien` interface to use `id: string`
- Updated `onDeselectBienes` prop type to use `string[]`

### 6. API Route (`src/app/api/admin/directorio/transfer-bienes/route.ts`)
- Added validation to ensure all bien IDs are strings (UUIDs)
- Added detailed error messages showing which IDs are invalid
- Added debug logging to show ID types in sample data

## Database Schema
All three tables use UUID primary keys:
- `muebles.id` → UUID (INEA)
- `mueblesitea.id` → UUID (ITEA)
- `mueblestlaxcala.id` → UUID (No Listado)

## Testing Recommendations
1. Test partial transfer with INEA bienes
2. Test partial transfer with ITEA bienes
3. Test partial transfer with No Listado bienes
4. Test mixed transfers (bienes from multiple sources)
5. Verify error messages show helpful information if invalid IDs are sent

## Impact
- Fixes UUID type mismatch errors in partial bienes transfers
- Improves type safety throughout the transfer system
- Better error messages for debugging
- No breaking changes to existing functionality
