import 'server-only';

import config from '@payload-config';
import { getPayload } from 'payload';

import type { Media } from '@/payload-types';

/** Payload's local API: reads the CMS database directly, no HTTP round trip. */
export function getCms() {
  return getPayload({ config });
}

export function mediaOf(value: number | Media | null | undefined): Media | null {
  return value && typeof value === 'object' ? value : null;
}
