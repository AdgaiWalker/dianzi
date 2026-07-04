import type { BehaviorEventName } from '@dianzi/shared';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

export function trackCampusEvent(eventType: BehaviorEventName, metadata: Record<string, unknown> = {}) {
  if (!eventType.startsWith('campus_') && eventType !== 'campus_to_compass_click') return;

  fetch(`${baseURL}/api/analytics/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-pangen-site': 'cn',
    },
    body: JSON.stringify({ site: 'cn', event: eventType, metadata }),
  }).catch((error) => {
    console.error('analytics event failed', error);
  });
}
