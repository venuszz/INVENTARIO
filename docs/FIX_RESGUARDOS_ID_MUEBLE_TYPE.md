# Fix: Resguardos id_mueble Type Mismatch

## Problem
The `resguardos.id_mueble` column is defined as `integer`, but the muebles tables (`muebles`, `mueblesitea`, `mueblestlaxcala`) use `uuid` as their primary key type.

This causes the error:
```
invalid input syntax for type integer: "aee90d9f-4f5c-44e6-9ca0-22fbceb29155"
```

## Solution
Change the `resguardos.id_mueble` column type from `integer` to `uuid`.

## SQL Migration Script

```sql
-- Step 1: Drop the existing index on id_mueble
DROP INDEX IF EXISTS idx_resguardos_mueble;
DROP INDEX IF EXISTS idx_resguardos_mueble_origen;

-- Step 2: Change the column type from integer to uuid
ALTER TABLE resguardos 
ALTER COLUMN id_mueble TYPE uuid USING id_mueble::text::uuid;

-- Step 3: Recreate the indexes
CREATE INDEX idx_resguardos_mueble 
ON resguardos USING btree (id_mueble);

CREATE INDEX idx_resguardos_mueble_origen 
ON resguardos USING btree (id_mueble, origen);
```

## Verification

After running the migration, verify the change:

```sql
-- Check the column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'resguardos' 
  AND column_name = 'id_mueble';

-- Expected result: data_type = 'uuid'
```

## Update Trigger Function (REQUIRED)

The trigger function `validate_resguardo_mueble()` needs to be updated to:
1. Handle UUID type correctly
2. Map origen values to correct table names

**IMPORTANT**: The origen constraint uses 'NO_LISTADO' but the table is 'mueblestlaxcala'

```sql
    CREATE OR REPLACE FUNCTION validate_resguardo_mueble()
    RETURNS TRIGGER AS $$
    DECLARE
        v_exists BOOLEAN;
        v_table_name TEXT;
    BEGIN
        -- Determine which table to check based on origen
        -- IMPORTANT: NO_LISTADO maps to mueblestlaxcala table
        v_table_name := CASE NEW.origen
            WHEN 'INEA' THEN 'muebles'
            WHEN 'ITEA' THEN 'mueblesitea'
            WHEN 'NO_LISTADO' THEN 'mueblestlaxcala'
            ELSE NULL
        END;
        
        IF v_table_name IS NULL THEN
            RAISE EXCEPTION 'Invalid origen: %. Must be INEA, ITEA, or NO_LISTADO', NEW.origen;
        END IF;
        
        -- Check if the mueble exists in the corresponding table
        -- id_mueble is now UUID type
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)', v_table_name)
        INTO v_exists
        USING NEW.id_mueble;
        
        IF NOT v_exists THEN
            RAISE EXCEPTION 'Mueble with id % does not exist in table %', NEW.id_mueble, v_table_name;
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
```

## Complete Migration Script

Run this complete script to fix all issues:

```sql
-- Step 1: Drop the trigger temporarily
DROP TRIGGER IF EXISTS validate_resguardo_mueble_trigger ON resguardos;

-- Step 2: Drop existing indexes
DROP INDEX IF EXISTS idx_resguardos_mueble;
DROP INDEX IF EXISTS idx_resguardos_mueble_origen;

-- Step 3: Change column type from integer to uuid
ALTER TABLE resguardos 
ALTER COLUMN id_mueble TYPE uuid USING id_mueble::text::uuid;

-- Step 4: Recreate indexes
CREATE INDEX idx_resguardos_mueble 
ON resguardos USING btree (id_mueble);

CREATE INDEX idx_resguardos_mueble_origen 
ON resguardos USING btree (id_mueble, origen);

-- Step 5: Update trigger function with correct table mapping
CREATE OR REPLACE FUNCTION validate_resguardo_mueble()
RETURNS TRIGGER AS $$
DECLARE
    v_exists BOOLEAN;
    v_table_name TEXT;
BEGIN
    -- Map origen to actual table names
    v_table_name := CASE NEW.origen
        WHEN 'INEA' THEN 'muebles'
        WHEN 'ITEA' THEN 'mueblesitea'
        WHEN 'NO_LISTADO' THEN 'mueblestlaxcala'
        ELSE NULL
    END;
    
    IF v_table_name IS NULL THEN
        RAISE EXCEPTION 'Invalid origen: %. Must be INEA, ITEA, or NO_LISTADO', NEW.origen;
    END IF;
    
    -- Verify mueble exists (id_mueble is UUID)
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)', v_table_name)
    INTO v_exists
    USING NEW.id_mueble;
    
    IF NOT v_exists THEN
        RAISE EXCEPTION 'Mueble with id % does not exist in table %', NEW.id_mueble, v_table_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Recreate trigger
CREATE TRIGGER validate_resguardo_mueble_trigger 
BEFORE INSERT OR UPDATE ON resguardos 
FOR EACH ROW 
EXECUTE FUNCTION validate_resguardo_mueble();
```

## Testing

After migration, test inserting a resguardo:

```sql
-- Test insert (replace with actual values)
INSERT INTO resguardos (
    folio, 
    f_resguardo, 
    id_directorio, 
    id_mueble, 
    origen, 
    puesto_resguardo, 
    resguardante, 
    created_by
) VALUES (
    'TEST-001',
    CURRENT_DATE,
    1,
    'aee90d9f-4f5c-44e6-9ca0-22fbceb29155'::uuid,
    'INEA',
    'DIRECTOR',
    'TEST USER',
    'your-user-uuid'::uuid
);

-- Clean up test
DELETE FROM resguardos WHERE folio = 'TEST-001';
```

## Impact
- No data loss (if table is empty or you're doing this before production use)
- Indexes will be recreated automatically
- Foreign key behavior remains the same
- Application code already uses UUID, so no code changes needed

## Rollback (if needed)

```sql
-- Only if you need to rollback (not recommended)
ALTER TABLE resguardos 
ALTER COLUMN id_mueble TYPE integer USING NULL;
-- Note: This will set all existing values to NULL
```
