import type { BehaviorEventName } from '@dianzi/shared';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
const COMPASS_SITE = 'com';

export function trackCompassEvent(event: BehaviorEventName, metadata: Record<string, unknown> = {}) {
  if (!event.startsWith('compass_') && event !== 'campus_to_compass_click') return;

  fetch(`${baseURL}/api/analytics/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-pangen-site': COMPASS_SITE,
    },
    body: JSON.stringify({
      site: COMPASS_SITE,
      event,
      metadata,
    }),
  }).catch((error) => {
    console.error('analytics event failed', error);
  });
}
