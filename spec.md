# ALVRA Perfume

## Current State
- ProductDetailModal shows product image, description, star rating (static), EMI/full price, Buy Now + Add to Cart
- No size (ml) options on product detail
- No similar products section
- No customer feedback / review submission
- DinoGame has local high score only; no leaderboard

## Requested Changes (Diff)

### Add
- Size selector (100ml / 250ml / 500ml) with per-size pricing in ProductDetailModal
- "Similar Products" horizontal scroll section inside ProductDetailModal
- Customer Feedback section in ProductDetailModal: star rating picker + name/text inputs + submit (stored in localStorage)
- Dino Game Leaderboard: top-10 scores panel below the game, stored in localStorage with player name prompt on new high score

### Modify
- ProductDetailModal: widen to accommodate new sections, add tabs or stacked sections
- DinoGame: on game-over, if score is top-10, prompt for name and save to leaderboard

### Remove
- Nothing removed

## Implementation Plan
1. Add size options state + UI in ProductDetailModal (100ml/250ml/500ml with pricing tiers)
2. Add SimilarProducts horizontal scroll strip at bottom of ProductDetailModal (shows other products)
3. Add CustomerFeedback form at bottom of ProductDetailModal (name, rating, text; saves to localStorage)
4. Add Leaderboard component reading/writing from localStorage; render below DinoGameModal in PlayWin section
5. Update DinoGame to call a leaderboard save callback when game over with a top-10 score
