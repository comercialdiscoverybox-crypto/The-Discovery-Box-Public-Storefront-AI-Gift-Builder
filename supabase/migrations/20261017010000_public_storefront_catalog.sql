ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS price_public BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS publicly_visible BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE VIEW public.public_catalog_items
WITH (security_barrier = true) AS
SELECT
  id,
  family,
  collection,
  category,
  name_en,
  name_pt,
  description_en,
  description_pt,
  CASE WHEN publicly_visible AND active AND price_public AND price_mzn > 0 THEN price_mzn ELSE NULL END AS price_mzn,
  images,
  image_crops,
  primary_image_index
FROM public.catalog_items
WHERE active = TRUE
  AND publicly_visible = TRUE;

CREATE OR REPLACE VIEW public.public_catalog_collections
WITH (security_barrier = true) AS
SELECT
  c.id,
  c.family,
  c.name_en,
  c.name_pt,
  c.theme_en,
  c.theme_pt,
  c.tagline_en,
  c.tagline_pt,
  c.focus_en,
  c.focus_pt,
  c.image_url,
  c.image_crop
FROM public.catalog_collections AS c
WHERE EXISTS (
  SELECT 1
  FROM public.catalog_items AS i
  WHERE i.active = TRUE
    AND i.publicly_visible = TRUE
    AND i.family = c.family
    AND i.collection IN (c.id, c.name_en, c.name_pt)
);

CREATE OR REPLACE VIEW public.public_catalog_categories
WITH (security_barrier = true) AS
SELECT
  c.id,
  c.family,
  c.name_en,
  c.name_pt,
  c.description_en,
  c.description_pt
FROM public.categories AS c
WHERE EXISTS (
  SELECT 1
  FROM public.catalog_items AS i
  WHERE i.active = TRUE
    AND i.publicly_visible = TRUE
    AND i.family = c.family
    AND i.category IN (c.id, c.name_en, c.name_pt)
);

REVOKE ALL ON TABLE
  public.catalog_items,
  public.catalog_collections,
  public.categories
FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Public catalog items read" ON public.catalog_items;
DROP POLICY IF EXISTS "Public catalog collections read" ON public.catalog_collections;
DROP POLICY IF EXISTS "Public catalog categories read" ON public.categories;

GRANT SELECT ON TABLE
  public.public_catalog_items,
  public.public_catalog_collections,
  public.public_catalog_categories
TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
