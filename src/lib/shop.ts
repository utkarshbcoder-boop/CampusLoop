/**
 * Shopkeeper role (shop sellers).
 *
 * A shopkeeper is an ordinary CampusLoop account the admin has promoted by
 * writing `role: "shopkeeper"` onto its `profiles/{uid}` document. Firestore
 * rules are the real enforcement layer: only an admin can set/clear `role`,
 * and only a shopkeeper (or admin) may attach `shop_name` / `shop_address`
 * to listings or edit their own shop profile fields.
 */

export const SHOP_NAME_MAX = 120;
export const SHOP_ADDRESS_MAX = 300;

/** The subset of a Firestore profile document the client relies on. */
export interface AccountProfile {
  id: string;
  name?: string;
  email?: string;
  /** Absent for regular students; "shopkeeper" once the admin grants it. */
  role?: string;
  shop_name?: string;
  shop_address?: string;
}

/** Shopkeepers can use the Shop tab; admins always can (full access). */
export function computeIsShopkeeper(
  profile: AccountProfile | null | undefined,
  isAdmin: boolean,
): boolean {
  return isAdmin || profile?.role === "shopkeeper";
}

export interface ShopIdentity {
  shop_name: string;
  shop_address: string;
}

/** Trim and validate the shop identity form; throws a friendly error on bad input. */
export function readShopIdentity(input: {
  shop_name: string;
  shop_address: string;
}): ShopIdentity {
  const shop_name = input.shop_name.trim();
  const shop_address = input.shop_address.trim();
  if (!shop_name) throw new Error("Enter your shop name.");
  if (shop_name.length > SHOP_NAME_MAX) {
    throw new Error(`Shop name must be at most ${SHOP_NAME_MAX} characters.`);
  }
  if (!shop_address) throw new Error("Enter your shop address.");
  if (shop_address.length > SHOP_ADDRESS_MAX) {
    throw new Error(`Shop address must be at most ${SHOP_ADDRESS_MAX} characters.`);
  }
  return { shop_name, shop_address };
}

/**
 * Fields to stamp onto a listing the shopkeeper is publishing, or `null`
 * when the shop identity has not been filled in yet.
 */
export function shopFieldsForListing(
  profile: AccountProfile | null | undefined,
  isShopkeeper: boolean,
): Partial<ShopIdentity> | null {
  if (!isShopkeeper || !profile?.shop_name?.trim() || !profile.shop_address?.trim()) return null;
  return {
    shop_name: profile.shop_name.trim(),
    shop_address: profile.shop_address.trim(),
  };
}
