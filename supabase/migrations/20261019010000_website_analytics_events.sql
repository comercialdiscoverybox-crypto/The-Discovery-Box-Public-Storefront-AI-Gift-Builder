CREATE TABLE IF NOT EXISTS public.website_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  event_name TEXT NOT NULL CHECK (
    event_name IN (
      'page_view',
      'product_view',
      'shop_search',
      'shop_filter',
      'gift_builder_step',
      'enquiry_submitted',
      'feedback_submitted',
      'assistant_open',
      'contact_click',
      'faq_expand'
    )
  ),
  page_path TEXT NOT NULL CHECK (
    char_length(page_path) BETWEEN 1 AND 300
    AND left(page_path, 1) = '/'
    AND left(page_path, 2) <> '//'
    AND position('?' IN page_path) = 0
    AND position('#' IN page_path) = 0
  ),
  referrer_origin TEXT CHECK (
    referrer_origin IS NULL
    OR (
      char_length(referrer_origin) <= 300
      AND referrer_origin ~ '^https?://[^/?#@[:space:]]+$'
    )
  ),
  properties JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(properties) = 'object'
    AND pg_column_size(properties) <= 1024
    AND CASE event_name
      WHEN 'page_view' THEN
        properties - 'language' = '{}'::jsonb
        AND properties ? 'language'
        AND properties->'language' IN ('"en"'::jsonb, '"pt"'::jsonb)
      WHEN 'product_view' THEN
        properties - 'product_id' - 'family' = '{}'::jsonb
        AND properties ?& ARRAY['product_id', 'family']
        AND jsonb_typeof(properties->'product_id') = 'string'
        AND properties->>'product_id' ~ '^[A-Za-z0-9_-]{1,120}$'
        AND properties->'family' IN ('"PLAY"'::jsonb, '"HOME"'::jsonb, '"BUSINESS"'::jsonb)
      WHEN 'shop_search' THEN
        properties - 'query_length' - 'result_count' = '{}'::jsonb
        AND properties ?& ARRAY['query_length', 'result_count']
        AND jsonb_typeof(properties->'query_length') = 'number'
        AND properties->>'query_length' ~ '^[0-9]+$'
        AND properties->'query_length' BETWEEN '0'::jsonb AND '200'::jsonb
        AND jsonb_typeof(properties->'result_count') = 'number'
        AND properties->>'result_count' ~ '^[0-9]+$'
        AND properties->'result_count' BETWEEN '0'::jsonb AND '10000'::jsonb
      WHEN 'shop_filter' THEN
        properties - 'filter_type' = '{}'::jsonb
        AND properties ? 'filter_type'
        AND properties->'filter_type' IN ('"family"'::jsonb, '"collection"'::jsonb, '"category"'::jsonb, '"sort"'::jsonb)
      WHEN 'gift_builder_step' THEN
        properties - 'step' = '{}'::jsonb
        AND properties ? 'step'
        AND jsonb_typeof(properties->'step') = 'number'
        AND properties->>'step' ~ '^[0-9]+$'
        AND properties->'step' BETWEEN '1'::jsonb AND '3'::jsonb
      WHEN 'enquiry_submitted' THEN
        properties - 'product_count' - 'language' = '{}'::jsonb
        AND properties ?& ARRAY['product_count', 'language']
        AND jsonb_typeof(properties->'product_count') = 'number'
        AND properties->>'product_count' ~ '^[0-9]+$'
        AND properties->'product_count' BETWEEN '0'::jsonb AND '5'::jsonb
        AND properties->'language' IN ('"en"'::jsonb, '"pt"'::jsonb)
      WHEN 'feedback_submitted' THEN
        properties - 'submission_type' = '{}'::jsonb
        AND properties ? 'submission_type'
        AND properties->'submission_type' IN ('"review"'::jsonb, '"problem"'::jsonb)
      WHEN 'assistant_open' THEN properties = '{}'::jsonb
      WHEN 'contact_click' THEN
        properties - 'method' = '{}'::jsonb
        AND properties ? 'method'
        AND properties->'method' IN ('"email"'::jsonb, '"whatsapp"'::jsonb)
      WHEN 'faq_expand' THEN
        properties - 'question_index' = '{}'::jsonb
        AND properties ? 'question_index'
        AND jsonb_typeof(properties->'question_index') = 'number'
        AND properties->>'question_index' ~ '^[0-9]+$'
        AND properties->'question_index' BETWEEN '0'::jsonb AND '20'::jsonb
      ELSE FALSE
    END
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.website_analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.website_analytics_events FROM PUBLIC, anon, authenticated;
GRANT INSERT (session_id, event_name, page_path, referrer_origin, properties)
  ON TABLE public.website_analytics_events TO anon, authenticated;

DROP POLICY IF EXISTS "Public website analytics event submissions" ON public.website_analytics_events;
CREATE POLICY "Public website analytics event submissions"
  ON public.website_analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_name IN (
      'page_view',
      'product_view',
      'shop_search',
      'shop_filter',
      'gift_builder_step',
      'enquiry_submitted',
      'feedback_submitted',
      'assistant_open',
      'contact_click',
      'faq_expand'
    )
    AND char_length(page_path) BETWEEN 1 AND 300
    AND left(page_path, 1) = '/'
    AND left(page_path, 2) <> '//'
    AND position('?' IN page_path) = 0
    AND position('#' IN page_path) = 0
    AND jsonb_typeof(properties) = 'object'
    AND pg_column_size(properties) <= 1024
  );

CREATE INDEX IF NOT EXISTS website_analytics_events_created_at_idx
  ON public.website_analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS website_analytics_events_event_name_created_at_idx
  ON public.website_analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS website_analytics_events_session_id_created_at_idx
  ON public.website_analytics_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS website_analytics_events_page_path_created_at_idx
  ON public.website_analytics_events (page_path, created_at DESC);
