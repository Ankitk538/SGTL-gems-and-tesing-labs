-- ═══════════════════════════════════════════════════════
-- SG&TL Enquiry System Redesign — Database Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL)
-- ═══════════════════════════════════════════════════════

-- 1. Add enquiry_no column (unique enquiry number like ENQ-260527-GEN-001)
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS enquiry_no TEXT;

-- 2. Add category column (GEN, CERT, TECH, BILL, SHIP, COMP, OTHER)
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'GEN';

-- 3. Add priority column (low, medium, high, urgent)
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- 4. Normalize all status values to lowercase and map legacy values
UPDATE enquiries SET query_status = 'new' WHERE LOWER(query_status) = 'pending' OR query_status IS NULL;
UPDATE enquiries SET query_status = LOWER(query_status) WHERE query_status != LOWER(query_status);

-- 5. Backfill enquiry numbers for existing rows that don't have one
-- (These will get sequential numbers with today's date)
DO $$
DECLARE
  r RECORD;
  seq INT := 1;
  prefix TEXT;
BEGIN
  prefix := 'ENQ-' || TO_CHAR(NOW(), 'YYMMDD') || '-GEN-';
  FOR r IN SELECT id FROM enquiries WHERE enquiry_no IS NULL ORDER BY id ASC
  LOOP
    UPDATE enquiries SET enquiry_no = prefix || LPAD(seq::TEXT, 3, '0') WHERE id = r.id;
    seq := seq + 1;
  END LOOP;
END $$;

-- 6. Allow anon role to insert the new columns (for public enquiry form)
-- This updates RLS policies if needed. If your RLS already allows all columns on insert, skip this.

-- Done! The admin panel will now use:
--   enquiry_no: Auto-generated ENQ-YYMMDD-CAT-### format
--   category:   GEN, CERT, TECH, BILL, SHIP, COMP, OTHER
--   priority:   low, medium, high, urgent
--   query_status: new, in_review, awaiting_customer, escalated, resolved, archived
