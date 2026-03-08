# ALVRA Perfume

## Current State
The app is a single-page perfume marketing website with:
- Sticky header with logo, nav, cart icon
- Hero section, Dino game, product cards, launch offer, EMI, why choose, reviews, Instagram, footer
- Backend: product catalog, cart, orders, coupon validation
- No authentication or admin functionality

## Requested Changes (Diff)

### Add
- **Sign Up page** (`/signup`): new user registration with email + password
- **Login page** (`/login`): existing user login with email + password; after login redirect to main site (or admin if admin role)
- **Admin page** (`/admin`): only accessible to the designated owner/admin; allows drag-and-drop editing of website content (hero text, section text blocks, product images/names/prices, section images)
- **Admin content management backend**: store editable content blocks (key-value text and image URL pairs) that the frontend reads dynamically; update content via admin-only calls
- **Authorization**: role-based access control using the `authorization` Caffeine component; one hardcoded admin principal

### Modify
- Main website sections (Hero, Products, Launch Offer, etc.) to read content from backend editable content store instead of hardcoded values where applicable
- Header to show Login/Logout button and optionally Admin link if user is admin

### Remove
- Nothing removed

## Implementation Plan
1. Select `authorization` component for role-based access control
2. Generate updated Motoko backend with:
   - Authorization integration (admin role check)
   - `ContentBlock` type: `{ key: Text; value: Text }` for text and image URL storage
   - `getContent()`: returns all content blocks (public query)
   - `updateContent(key, value)`: admin-only update
   - `getAdminPrincipal()`: returns whether caller is admin
3. Frontend:
   - Add React Router for `/`, `/login`, `/signup`, `/admin` routes
   - Login page: email/password form using Internet Identity / auth hook
   - Signup page: registration form
   - Admin page: protected route; drag-and-drop UI with editable text blocks and image upload areas per section (hero title, hero subtitle, product names, prices, images, offer text, etc.)
   - Admin drag-and-drop editor: simple section panels that can be reordered and each panel allows inline text edit + image upload (drag image file to replace)
   - Header: show Login button; if logged in show user avatar + logout; if admin show "Admin" link
