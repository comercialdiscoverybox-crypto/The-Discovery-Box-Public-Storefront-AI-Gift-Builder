export type AnalyticsEventName =
  | 'page_view'
  | 'product_view'
  | 'shop_search'
  | 'shop_filter'
  | 'gift_builder_step'
  | 'enquiry_submitted'
  | 'feedback_submitted'
  | 'assistant_open'
  | 'contact_click'
  | 'faq_expand';

type AnalyticsProperties = Record<string, string | number>;

let cachedSessionId = '';

function sessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  try {
    const key = 'discovery-analytics-session';
    const stored = window.sessionStorage.getItem(key);
    if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)) {
      cachedSessionId = stored;
      return stored;
    }
    cachedSessionId = window.crypto.randomUUID();
    window.sessionStorage.setItem(key, cachedSessionId);
    return cachedSessionId;
  } catch (error) {
    console.warn('Analytics session storage is unavailable', error);
    cachedSessionId = window.crypto.randomUUID();
    return cachedSessionId;
  }
}

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  pagePath: string,
  properties: AnalyticsProperties = {},
): void {
  let referrerOrigin = '';
  if (document.referrer) {
    try {
      referrerOrigin = new URL(document.referrer).origin;
    } catch (error) {
      console.warn('Analytics referrer could not be parsed', error);
    }
  }
  void fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId(),
      eventName,
      pagePath,
      referrerOrigin,
      properties,
    }),
    keepalive: true,
  }).then((response) => {
    if (!response.ok) console.warn('Analytics event could not be recorded', response.status);
  }).catch((error: unknown) => {
    console.warn('Analytics event could not be sent', error);
  });
}
