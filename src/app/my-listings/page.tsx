"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { SellerListings } from "@/components/SellerListings";

export default function MyListingsPage() {
  const { user, loading } = useAuth();

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-white">My Listings</h1>
      <p className="mt-2 text-sm text-white/50">See what you have posted, its status, views, saves, and buyer interest.</p>
      {loading ? <p className="mt-6 text-sm text-white/50">Checking your account…</p> : user ? (
        <SellerListings sellerId={user.uid} />
      ) : (
        <div className="cl-panel cl-panel-solid mt-6 p-6">
          <p className="text-sm text-white/60">Sign in to view and manage your listings.</p>
          <Link href="/login" className="cl-btn cl-btn-primary mt-4">Sign in</Link>
        </div>
      )}
    </section>
  );
}
