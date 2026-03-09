# ALVRA Perfume

## Current State
Full-stack perfume e-commerce site with hero, dino game, products, cart, checkout, admin panel, and auth pages. Three known broken flows:
1. "Add to Cart" fails silently for unauthenticated users or shows a toast error because `addToCart` requires user role.
2. Checkout page may fail when `couponCode` is null (type mismatch between frontend null and Motoko `?Text`).
3. Admin page shows "Access Denied" with no way for the owner to self-promote, making the admin panel completely inaccessible.

## Requested Changes (Diff)

### Add
- "Claim Admin" button in AdminPage (visible when signed in but not yet admin) — uses `_initializeAccessControlWithSecret` with the admin token from URL params to self-register as admin.
- Login prompt / redirect in App when user clicks "Add to Cart" while not signed in.

### Modify
- `handleAddToCart` in App.tsx: if not authenticated, navigate to `/login` with a toast explaining why.
- `placeOrderWithAddress` call in CheckoutPage: ensure null coupon is passed correctly (already matches backend, but verify the mutation handles it properly).
- AdminPage "Access Denied" screen: add a "Claim Admin Access" button that calls `_initializeAccessControlWithSecret` and refreshes the admin check.
- `useActor` hook: `_initializeAccessControlWithSecret` is already called on login — verify this registers the user properly and that the admin token is available.

### Remove
- Nothing removed.

## Implementation Plan
1. Fix App.tsx: add `identity` check to `handleAddToCart`; if not logged in, show toast and navigate to `/login`.
2. Fix AdminPage: on "Access Denied" screen, add a "Claim Admin Access" button that calls `actor._initializeAccessControlWithSecret(adminToken)` then invalidates the `isAdmin` query, giving the owner a path to become admin.
3. Fix CheckoutPage: verify coupon null passing, add error handling so the order attempt gracefully handles network/auth errors.
4. Validate and deploy.
