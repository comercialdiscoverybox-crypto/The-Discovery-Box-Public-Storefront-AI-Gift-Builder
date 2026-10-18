ALTER TABLE public.customer_reviews
  RENAME COLUMN review TO message;

ALTER TABLE public.customer_reviews
  ALTER COLUMN rating DROP NOT NULL,
  ADD COLUMN submission_type TEXT NOT NULL DEFAULT 'review',
  ADD COLUMN email TEXT,
  ADD COLUMN order_reference TEXT;

ALTER TABLE public.customer_reviews
  DROP CONSTRAINT customer_reviews_rating_check,
  DROP CONSTRAINT customer_reviews_review_check,
  ADD CONSTRAINT customer_reviews_rating_check
    CHECK (
      (submission_type = 'review' AND rating BETWEEN 1 AND 5)
      OR (submission_type = 'problem' AND rating IS NULL)
    ),
  ADD CONSTRAINT customer_reviews_message_check
    CHECK (char_length(trim(message)) BETWEEN 5 AND 2000),
  ADD CONSTRAINT customer_reviews_submission_type_check
    CHECK (submission_type IN ('review', 'problem')),
  ADD CONSTRAINT customer_reviews_email_check
    CHECK (
      email IS NULL
      OR email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
  ADD CONSTRAINT customer_reviews_order_reference_check
    CHECK (order_reference IS NULL OR char_length(order_reference) <= 120);

REVOKE ALL ON TABLE public.customer_reviews FROM PUBLIC, anon, authenticated;
GRANT INSERT (rating, message, customer_name, language, submission_type, email, order_reference)
  ON TABLE public.customer_reviews TO anon, authenticated;

DROP POLICY IF EXISTS "Public customer review submissions" ON public.customer_reviews;
CREATE POLICY "Public customer review submissions"
  ON public.customer_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    submission_type IN ('review', 'problem')
    AND char_length(trim(message)) BETWEEN 5 AND 2000
    AND (customer_name IS NULL OR char_length(customer_name) <= 100)
    AND (order_reference IS NULL OR char_length(order_reference) <= 120)
    AND language IN ('en', 'pt')
    AND (
      (submission_type = 'review' AND rating BETWEEN 1 AND 5 AND email IS NULL AND order_reference IS NULL)
      OR (
        submission_type = 'problem'
        AND rating IS NULL
        AND email IS NOT NULL
        AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    )
  );
