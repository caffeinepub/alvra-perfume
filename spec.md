# ALVRA Perfume

## Current State
Homepage: Header (hamburger, logo, search icon, profile, cart), PromoTicker, HeroCarousel, ProductsSection, GameSection (Win Free Perfume + DinoGame + Leaderboard), Footer.

## Requested Changes (Diff)

### Add
- Floating Reviews Section between ProductsSection and GameSection
- View All button at bottom of GameSection

### Modify
- Remove Search button from Header

### Remove
- Search icon button from header

## Implementation Plan
1. Remove search button from Header in App.tsx
2. Add FloatingReviews component with two marquee rows inserted before GameSection
3. Add View All button at bottom of GameSection
