CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT NOT NULL CHECK (char_length(trim(review)) BETWEEN 5 AND 2000),
  customer_name TEXT CHECK (customer_name IS NULL OR char_length(customer_name) <= 100),
  language TEXT NOT NULL CHECK (language IN ('en', 'pt')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.customer_reviews FROM PUBLIC, anon, authenticated;
GRANT INSERT (rating, review, customer_name, language)
  ON TABLE public.customer_reviews TO anon, authenticated;

DROP POLICY IF EXISTS "Public customer review submissions" ON public.customer_reviews;
CREATE POLICY "Public customer review submissions"
  ON public.customer_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND char_length(trim(review)) BETWEEN 5 AND 2000
    AND (customer_name IS NULL OR char_length(customer_name) <= 100)
    AND language IN ('en', 'pt')
  );
