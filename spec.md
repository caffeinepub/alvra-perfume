# ALVRA Perfume

## Current State
New project. No existing frontend or backend code.

## Requested Changes (Diff)

### Add
- Full ALVRA perfume brand website with 10 sections
- Sticky header with centered logo, left hamburger menu, right cart icon, nav links (Home, Shop, Play & Win, Offers, Contact)
- Hero section: black premium background, large perfume image, "BE UNFORGETTABLE" headline, subtitle, Shop Now + Play & Win buttons
- Dino game section: canvas-based game in a modal popup with dark overlay; player controls a dino jumping over cacti; score tracking; on game over, show reward popup with coupon code based on score
- Reward system: 500pts=₹20 OFF (DINO20), 1000pts=₹50 OFF (DINO50), 2000pts=₹100 OFF (DINO100), 3000pts=₹150 OFF (DINO150), 5000pts=₹200 OFF (DINO200), 10000pts=FREE PERFUME (FREEALVRA)
- Product section: 4 perfume cards (Men Formal, Men Party, Women Formal, Women Party) with image, name, description, ₹799 price, Buy button
- Launch Offer section: ₹199 launch offer with bundled items list
- EMI / Buy Now Pay Later section: ₹199 today + ₹150/week breakdown
- Why Choose ALVRA: 4 trust signal bullet points
- Customer Reviews: testimonial cards with star ratings
- Instagram section: "Follow Our Journey" with placeholder grid
- Footer: brand name, WhatsApp/email/Instagram contact, nav links (Privacy Policy, Terms, Support)

### Modify
- None

### Remove
- None

## Implementation Plan
1. Generate perfume product images (hero + 4 product images)
2. Generate Motoko backend with cart/product data support
3. Build React frontend with all 10 sections
4. Implement Dino game using Canvas API inside a modal
5. Implement reward/coupon popup on game over
6. Wire cart icon with item count state
7. Add smooth scroll navigation from header links
8. Deploy
