"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { SellForm } from "@/components/SellForm";
import { SellerListings } from "@/components/SellerListings";
import { db } from "@/lib/firebase/config";
import { readShopIdentity, SHOP_ADDRESS_MAX, SHOP_NAME_MAX } from "@/lib/shop";

/**
 * Shop dashboard (shopkeeper tab).
 *
 * Shopkeepers — accounts the admin promoted from the Admin panel — manage
 * everything they sell from here: their shop identity (name + address shown
 * to buyers on every listing), new listings across all categories, and live
 * buyer interest per listing with direct messaging. Admins always have access.
 */
function ShopIdentityCard() {
  const { profile } = useAuth();
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [edited, setEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Pre-fill from the saved profile until the shopkeeper starts typing, so
  // live updates (including an admin granting/refreshing the role) don't
  // clobber in-progress edits.
  useEffect(() => {
    if (edited) return;
    setShopName(profile?.shop_name ?? "");
    setShopAddress(profile?.shop_address ?? "");
  }, [profile, edited]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const identity = readShopIdentity({ shop_name: shopName, shop_address: shopAddress });
      await updateDoc(doc(db, "profiles", profile!.id), {
        shop_name: identity.shop_name,
        shop_address: identity.shop_address,
      });
      setEdited(false);
      setNotice("Shop details saved. They now appear on every listing you publish.");
    } catch (cause) {
      console.error("Failed to save shop details:", cause);
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Could not save your shop details. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="cl-panel cl-panel-solid p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-white">🏪 Your shop</h2>
        <span className="cl-chip cl-chip-mint">Shopkeeper</span>
      </div>
      <p className="mt-1 text-xs text-white/45">
        Buyers see this name and address on every listing you publish — items and homes alike.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">Shop name</span>
          <input
            className="cl-input"
            value={shopName}
            onChange={(event) => {
              setEdited(true);
              setShopName(event.target.value);
            }}
            placeholder="e.g. Gadget Junction"
            maxLength={SHOP_NAME_MAX}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">Shop address</span>
          <input
            className="cl-input"
            value={shopAddress}
            onChange={(event) => {
              setEdited(true);
              setShopAddress(event.target.value);
            }}
            placeholder="e.g. Shop 12, Main Market, Block C"
            maxLength={SHOP_ADDRESS_MAX}
            required
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="cl-btn cl-btn-primary disabled:opacity-50">
          {busy ? "Saving…" : "Save shop details"}
        </button>
        {notice ? <p role="status" className="text-xs text-mint-300">{notice}</p> : null}
        {error ? <p role="alert" className="text-xs text-rose-300">{error}</p> : null}
      </div>
    </form>
  );
}

function ShopDashboard({ userId }: { userId: string }) {
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const identityReady = Boolean(profile?.shop_name?.trim() && profile?.shop_address?.trim());

  return (
    <div className="mt-6 grid gap-6">
      <ShopIdentityCard />

      {!identityReady ? (
        <div className="rounded-xl border border-flare-400/30 bg-flare-500/10 px-4 py-3">
          <p className="text-xs leading-relaxed text-white/70">
            Add your shop name and address above — new listings will then display them to buyers.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Add a listing</h2>
          <p className="text-xs text-white/45">
            Books, phones, laptops, devices, rooms, flats, and PGs — all from your shop.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="cl-btn cl-btn-primary"
          aria-expanded={showForm}
        >
          {showForm ? "Close form" : "➕ New listing"}
        </button>
      </div>
      {showForm ? (
        <div className="mx-auto w-full max-w-xl">
          <SellForm initialKind="both" />
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-bold text-white">Your listings &amp; buyer interest</h2>
        <p className="text-xs text-white/45">
          Live count of interested buyers per listing, with their names — reply with one tap.
        </p>
        <SellerListings sellerId={userId} showMessageBuyers />
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { user, loading, isShopkeeper } = useAuth();

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12">
      <p className="text-xs font-semibold tracking-widest text-brand-300 uppercase">Shopkeeper</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Shop Dashboard</h1>
      <p className="mt-2 text-sm text-white/50">
        List everything your shop sells, and see exactly how many students are interested in each item.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-white/50">Checking your account…</p>
      ) : !user ? (
        <div className="cl-panel cl-panel-solid mt-6 p-6">
          <p className="text-sm text-white/60">Sign in with your shop&apos;s account to open the dashboard.</p>
          <Link href="/login" className="cl-btn cl-btn-primary mt-4">Sign in</Link>
        </div>
      ) : !isShopkeeper ? (
        <div className="cl-panel cl-panel-solid mt-6 p-6">
          <p className="text-sm text-white/60">
            This account is not a shopkeeper yet. The CampusLoop admin grants shop access from the
            Admin panel — ask them to approve this account, then reload.
          </p>
          <Link href="/" className="cl-btn cl-btn-ghost mt-4">Back home</Link>
        </div>
      ) : (
        <ShopDashboard userId={user.uid} />
      )}
    </section>
  );
}
