ALTER TABLE sales_tender_opportunities
  ADD COLUMN IF NOT EXISTS bidder_status text;

UPDATE sales_tender_opportunities
SET bidder_status = CASE
  WHEN LOWER(COALESCE(notes, '')) LIKE '%probable bidder%'
   AND LOWER(COALESCE(notes, '')) LIKE '%not confirmed%'
    THEN 'PROBABLE BIDDER — NOT CONFIRMED'
  WHEN LOWER(COALESCE(notes, '')) LIKE '%confirmed bidder%'
   AND LOWER(COALESCE(notes, '')) NOT LIKE '%not confirmed%'
    THEN 'CONFIRMED BIDDER'
  ELSE bidder_status
END
WHERE bidder_status IS NULL
  AND LOWER(COALESCE(notes, '')) LIKE '%bidder%';
