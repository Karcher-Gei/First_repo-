import { LEGACY_IMAGE } from '@/lib/queries';
import { shopQuery } from '@/lib/vendure';

/** PrestaShop image types mapped to Vendure asset presets. */
const PRESETS: Record<string, string> = {
  cart_default: 'thumb',
  small_default: 'small',
  home_default: 'medium',
  medium_default: 'medium',
  large_default: 'large',
};

/**
 * Old image URLs (/{imageId}-{size}/{slug}.jpg, rewritten here by the proxy) answer 301 to the
 * migrated Vendure asset, so Google Images and external links keep working.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ imageId: string; size: string }> }) {
  const { imageId, size } = await params;
  const id = Number(imageId);
  if (!Number.isSafeInteger(id)) {
    return new Response('Not found', { status: 404 });
  }
  const { legacyImage } = await shopQuery(LEGACY_IMAGE, { imageId: id }, 3600);
  if (!legacyImage) {
    return new Response('Not found', { status: 404 });
  }
  return Response.redirect(`${legacyImage.preview}?preset=${PRESETS[size] ?? 'large'}`, 301);
}
