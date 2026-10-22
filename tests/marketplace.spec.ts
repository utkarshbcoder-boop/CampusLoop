import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("campusloop_session", "1");
  });
});

test("homepage links only to second-hand items and homes", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Find second-hand items and a place to live/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Browse second-hand items/ }).first()).toHaveAttribute("href", "/marketplace");
  await expect(page.getByRole("link", { name: /Find rooms, flats & PGs/ }).first()).toHaveAttribute("href", "/homes");
  await expect(page.getByText(/teammates|skills exchange|opportunities|campus events/i)).toHaveCount(0);
});

test("unrelated business pages and device rentals redirect out of the product", async ({ page }) => {
  for (const path of ["/business", "/college", "/premium"]) {
    await page.goto(path);
    await expect(page).toHaveURL("http://127.0.0.1:3100/");
  }

  await page.goto("/devices", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL("http://127.0.0.1:3100/marketplace");
});

test("visitor can browse books, save a listing, and find it again", async ({ page }) => {
  await page.goto("/books");

  await expect(page.getByRole("heading", { name: "Find a pre-owned book" })).toBeVisible();
  const saveButton = page.getByRole("button", { name: "Add to favorites" }).first();
  await expect(saveButton).toBeVisible();
  await saveButton.click();
  await expect(page.getByRole("button", { name: "Remove from favorites" }).first()).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.getByRole("button", { name: "Remove from favorites" }).first()).toBeVisible();
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "Your saved listings" })).toBeVisible();
  await expect(page.getByText("Second-hand item", { exact: true })).toBeVisible();
});

test("visitor can browse rooms, flats, and PGs", async ({ page }) => {
  await page.goto("/homes");

  await expect(page.getByRole("heading", { name: "Find a place to live" })).toBeVisible();
  await expect(page.getByText("homes for rent", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "List a room, flat, or PG" })).toHaveAttribute("href", "/sell?type=home");

  await page.getByRole("link", { name: "Single AC room in students' PG with mess" }).click();
  await expect(page).toHaveURL(/\/homes\/h1$/);
  await expect(page.getByRole("heading", { name: "Single AC room in students' PG with mess" })).toBeVisible();
  await expect(page.getByText("Koramangala Block C")).toBeVisible();
  await expect(page.getByText("This is a sample listing.", { exact: false })).toBeVisible();
});

test("listing creation is gated and the sign-in form validates required fields", async ({ page }) => {
  await page.goto("/sell?type=home");

  await expect(page.getByRole("heading", { name: "Sign in to list an item" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Enter your email and password.", { exact: true })).toBeVisible();
});
