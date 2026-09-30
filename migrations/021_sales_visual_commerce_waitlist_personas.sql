ALTER TABLE sales_visual_commerce_profiles
  DROP CONSTRAINT IF EXISTS sales_visual_commerce_customer_type_check,
  ADD CONSTRAINT sales_visual_commerce_customer_type_check CHECK (
    customer_type IN (
      'ECOMMERCE_BRAND',
      'CREATOR',
      'PUBLISHER',
      'VIDEO_PLATFORM',
      'RETAILER',
      'CREATOR_NETWORK',
      'SHOPPER',
      'DEVELOPER',
      'OTHER'
    )
  );
