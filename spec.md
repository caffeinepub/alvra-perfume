# ALVRA Perfume

## Current State
- Dino game uses dark purple/space color theme (dark bg, neon greens/purples)
- Game has no sound
- Game is titled "ALVRA RUNNER" in modal header, play button, and game-over screen
- Hero carousel has a thumbnail strip just below the slide image with a "Shop Now" button
- Top scrolling ticker does not include "Free delivery on all orders"

## Requested Changes (Diff)

### Add
- Web Audio API sounds in DinoGame: jump sound, collision/death sound, score milestone sound, game-over sound
- "Free Delivery on All Orders" message to the top scrolling ticker (PromoTicker)
- "Discount Zone" as a collectible/visual element in the game canvas (glowing teal zone the dino passes through that awards bonus points)

### Modify
- DinoGame color theme: replace dark purple/space colors with website teal/emerald palette. Sky gradient → deep teal-to-dark-teal, ground glow → teal/emerald, speed tier indicators → teal shades, HUD colors → teal/gold matching site branding
- Replace all "ALVRA RUNNER" text with "DISCOUNT ZONE" (modal header, play button, game-over screen)
- Remove the thumbnail strip section just below the hero carousel image (lines 1058–1103 in App.tsx) — this is the "show now" section

### Remove
- The carousel thumbnail strip (the row of thumbnails + "Shop Now" button below the slide image)

## Implementation Plan
1. In App.tsx: remove thumbnail strip block from HeroCarousel (lines ~1058–1103)
2. In App.tsx: add "🚚 Free Delivery on All Orders" to the PromoTicker items
3. In DinoGame.tsx: update getBgColor to use teal/emerald gradients instead of purple/dark
4. In DinoGame.tsx: update ground glow, speed tier, HUD colors to match teal theme
5. In DinoGame.tsx: replace all "ALVRA RUNNER" text with "DISCOUNT ZONE"
6. In DinoGame.tsx: add Web Audio API sound effects (jump, collision, game-over, milestone)
7. In DinoGame.tsx: add a visual "Discount Zone" collectible/obstacle that grants bonus score
