/**
 * Typed access to the single brand token (brand/brand.js — see the rename
 * checklist there). Every user-facing string that names the app interpolates
 * BRAND.appName; src/brand/__tests__/brandToken.test.ts fails the build on any
 * new hardcoded name in a string literal.
 */

// CommonJS source of truth shared with app.config.js.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const brand = require('../../brand/brand') as { appName: string };

export const BRAND: Readonly<{ appName: string }> = Object.freeze({
  appName: brand.appName,
});
