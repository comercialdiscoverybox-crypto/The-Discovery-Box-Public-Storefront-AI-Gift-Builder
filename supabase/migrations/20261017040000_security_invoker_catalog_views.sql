ALTER VIEW public.public_catalog_items
  SET (security_invoker = true);

ALTER VIEW public.public_catalog_collections
  SET (security_invoker = true);

ALTER VIEW public.public_catalog_categories
  SET (security_invoker = true);

REVOKE ALL ON TABLE
  public.catalog_items,
  public.catalog_collections,
  public.categories
FROM anon, authenticated;

GRANT SELECT (
  id,
  family,
  collection,
  category,
  name_en,
  name_pt,
  description_en,
  description_pt,
  active,
  price_mzn,
  images,
  image_crops,
  primary_image_index
) ON TABLE public.catalog_items TO anon, authenticated;

GRANT SELECT (
  id,
  family,
  name_en,
  name_pt,
  theme_en,
  theme_pt,
  tagline_en,
  tagline_pt,
  focus_en,
  focus_pt,
  image_url,
  image_crop
) ON TABLE public.catalog_collections TO anon, authenticated;

GRANT SELECT (
  id,
  family,
  name_en,
  name_pt,
  description_en,
  description_pt
) ON TABLE public.categories TO anon, authenticated;

DROP POLICY IF EXISTS "Public catalogue active items" ON public.catalog_items;
CREATE POLICY "Public catalogue active items"
  ON public.catalog_items
  FOR SELECT
  TO anon, authenticated
  USING (active = TRUE);

DROP POLICY IF EXISTS "Public catalogue active collections" ON public.catalog_collections;
CREATE POLICY "Public catalogue active collections"
  ON public.catalog_collections
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.catalog_items AS i
      WHERE i.active = TRUE
        AND i.family = catalog_collections.family
        AND i.collection IN (
          catalog_collections.id,
          catalog_collections.name_en,
          catalog_collections.name_pt
        )
    )
  );

DROP POLICY IF EXISTS "Public catalogue active categories" ON public.categories;
CREATE POLICY "Public catalogue active categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.catalog_items AS i
      WHERE i.active = TRUE
        AND i.family = categories.family
        AND i.category IN (
          categories.id,
          categories.name_en,
          categories.name_pt
        )
    )
  );

GRANT SELECT ON TABLE
  public.public_catalog_items,
  public.public_catalog_collections,
  public.public_catalog_categories
TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
