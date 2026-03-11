# ALVRA Perfume

## Current State
The homepage is a large single-file App.tsx with multiple sections: scrolling promo banner, cinematic hero, Dino game, products, offers, EMI, reviews, Instagram grid, footer. The design uses teal/emerald branding with white cards.

## Requested Changes (Diff)

### Add
- Hero image carousel with large product photo, thumbnail strip, and dot indicators
- Category filter row: Floral, Woody, Oriental, Fresh pill buttons
- MEN / WOMEN product grid section with two-column layout
- Clean minimalist header: hamburger menu left, ALVRA logo centered, cart icon right

### Modify
- Redesign the entire homepage layout to match the user's mockup (unnamed-1.jpg): clean white background, modern e-commerce look similar to Myntra/Nykaa/Meesho
- Hero section becomes a swipeable image carousel with thumbnail navigation
- Product section becomes a two-column grid split by MEN / WOMEN with a divider
- Header simplified to minimal top bar

### Remove
- The current cinematic golden hero banner
- The current 4-card promo strip
- Cluttered promo cards in hero area

## Implementation Plan
1. Rebuild the header as a clean minimal top bar: hamburger icon left, ALVRA centered in teal, cart icon right
2. Add a side-scrolling promotional ticker strip just below header
3. Create a hero image carousel with large main image, thumbnail strip at bottom, and dot indicators
4. Add a horizontal category pill row: All, Floral, Woody, Oriental, Fresh
5. Rebuild the product section as MEN / WOMEN two-column grid with a center divider
6. Keep the Dino game section inline below the category row
7. Keep footer, reviews, and cart/checkout pages unchanged
