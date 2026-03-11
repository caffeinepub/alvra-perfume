# ALVRA Perfume

## Current State
- Two separate sections: LaunchOfferSection (₹199 flat) and EMISection (₹199 today + weekly installments)
- Scrolling ticker banner has 6 items; no dino game banner with perfume visual
- MiniProductCard shows product with small 'Add' button; cards are not clickable to open a detail page
- No product detail page exists

## Requested Changes (Diff)

### Add
- Dino game promo card to the horizontal scrolling banner (with perfume imagery/icon alongside game icon)
- Product detail page / modal: clicking a product card opens a full detail view showing name, image, description, price, EMI breakdown, and Buy Now + Add to Cart buttons
- "Buy Now" button on each product card

### Modify
- Merge LaunchOfferSection and EMISection into a single combined section
- The ₹75 discount (₹799 → ₹199) is only shown as applicable when buying via EMI — standard price without EMI does not show the deep discount framing
- MiniProductCard: entire card is clickable (opens product detail); Buy Now CTA added below Add to Cart
- Ticker TICKER_ITEMS: add a dino game + perfume banner item

### Remove
- Standalone LaunchOfferSection and EMISection (replaced by merged OfferSection)

## Implementation Plan
1. Replace TICKER_ITEMS to include a dino + perfume banner item (icon 🎮🌸 or similar)
2. Create merged `OfferAndEMISection` component:
   - Shows base product price ₹799 with regular ₹199 promo framing
   - EMI section clearly states: "EMI exclusive discount — pay only ₹199 today" with weekly breakdown
   - Discount badge/label indicates discount only applies when purchasing via EMI
3. Create `ProductDetailModal` component:
   - Full-screen or bottom-sheet style modal
   - Shows: large image, name, description, tag, stars, ₹199 price, EMI breakdown, Buy Now button, Add to Cart button
4. Update `MiniProductCard`:
   - Wrap card with onClick to open ProductDetailModal
   - Add "Buy Now" button alongside "Add" button
5. Update homepage render to use new merged section instead of two separate sections
