/**
 * imageMap.ts
 *
 * Centralised import of every product image that lives in src/images/.
 * Because these are static ES-module imports, Vite will:
 *  - hash the filenames for cache-busting
 *  - bundle them into the build output
 *  - make them available on every machine after a simple `npm install && npm run dev`
 *
 * HOW IT WORKS
 * Each key is a lowercase substring that may appear in a product name.
 * getProductImage() does a greedy match against the product name, so the
 * longest / most-specific key wins.  Order the map from most-specific to
 * least-specific if two keys could match the same product.
 */

// ── static imports ────────────────────────────────────────────────────────────
import brakepadImg        from '../images/Front Brake Pad Set.webp';
import brakerotorImg      from '../images/Front Brake Rotor.jpg';
import shockabsorberImg   from '../images/Front Shock Absorber.jpg';
import airfilterImg       from '../images/Engine Air Filter.jpg';
import airintakeImg       from '../images/Engine Air Intake Kit.jpg';
import cabinfilterImg     from '../images/Cabin Microfilter.jpg';
import ignitioncoilImg    from '../images/Ignition Coil.jpg';
import batteryImg         from '../images/Ignition Starter Battery.jpg';
import floormatsImg       from '../images/Premium Floor Mat Set.jpg';
import wiperbladeImg      from '../images/Windshield Wiper Blade Set.jpg';
import keyfobImg          from '../images/BMW Key Fob Cover.jpg';

// ── name → image map ─────────────────────────────────────────────────────────
// Keys: lowercase substrings from the product name (most-specific first)
const NAME_IMAGE_MAP: Record<string, string> = {
  // Brakes
  'brake pad':          brakepadImg,
  'brake rotor':        brakerotorImg,
  'brake disc':         brakerotorImg,
  'vented front brake': brakerotorImg,

  // Suspension
  'shock absorber':     shockabsorberImg,
  'control arm':        shockabsorberImg,   // closest visual match available

  // Filters
  'air intake':         airintakeImg,
  'air filter':         airfilterImg,
  'engine air':         airfilterImg,
  'cabin':              cabinfilterImg,
  'microfilter':        cabinfilterImg,
  'oil filter':         airfilterImg,       // closest visual match

  // Engine / Electrical
  'ignition coil':      ignitioncoilImg,
  'spark plug':         ignitioncoilImg,    // closest visual match
  'battery':            batteryImg,
  'alternator':         batteryImg,         // closest visual match

  // Exterior
  'wiper':              wiperbladeImg,
  'floor mat':          floormatsImg,

  // Accessories
  'key fob':            keyfobImg,
  'mirror cap':         keyfobImg,          // closest visual match
};

/**
 * Returns the bundled local image URL for a product by name.
 * Falls back to `undefined` when no keyword matches (caller uses picsum or
 * whatever default makes sense).
 */
export function getProductImage(productName: string | null | undefined): string | undefined {
  if (!productName) return undefined;
  const lower = productName.toLowerCase();

  // Sort keys by length (desc) so longer / more-specific keys are tested first
  const sortedKeys = Object.keys(NAME_IMAGE_MAP).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return NAME_IMAGE_MAP[key];
    }
  }
  return undefined;
}

export default NAME_IMAGE_MAP;
