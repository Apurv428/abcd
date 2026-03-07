# DermAgent AI - Product Requirements Document

## Original Problem Statement
Build 'DermAgent AI,' a production-grade vertical AI agent that functions as a real-time digital dermatologist with:
- AI Vision Model (Gemini 3 Pro) for skin analysis
- FaceDefender privacy masking module
- Location-aware logic with OpenWeatherMap + browser geolocation
- Dynamic UV/humidity-based reminders
- Product recommendations based on skin type/concerns
- Virtual product shelf with expiry tracking
- Google OAuth + Email/Password authentication
- Glassmorphic UI with mandatory medical disclaimer

## User Personas
1. **Skincare Enthusiast** - Wants personalized routines and product recommendations
2. **Privacy-Conscious User** - Needs biometric privacy (FaceDefender)
3. **Frequent Traveler** - Benefits from location-aware UV/humidity alerts
4. **Product Organizer** - Tracks skincare product expiry dates

## Core Requirements (Static)
- [x] Gemini 3 Pro AI for skin image analysis
- [x] FaceDefender™ eye-region masking for privacy
- [x] OpenWeatherMap integration for weather data
- [x] Browser geolocation support
- [x] Dynamic UV alerts (high UV = reapply sunscreen)
- [x] Humidity-based recommendations (low humidity = hydrating serum)
- [x] Product recommendations (no affiliate bias)
- [x] Virtual product shelf with PAO/expiry tracking
- [x] Google OAuth via Supabase
- [x] Email/Password authentication
- [x] Medical disclaimer on all dashboard pages
- [x] Glassmorphic dark UI theme

## Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth + Email)
- **AI**: Google Gemini 2.5 Pro (vision model)
- **Weather API**: OpenWeatherMap

## What's Been Implemented (Jan 2026)

### Authentication System
- Google OAuth integration via Supabase
- Email/Password registration and login
- Protected dashboard routes with middleware
- Auth callback handler

### AI Skin Analysis
- Image upload with cropping (react-easy-crop)
- FaceDefender™ privacy mask (pixelates eye region)
- Gemini 2.5 Pro vision analysis
- Skin type detection (oily, dry, combination, normal, sensitive)
- Skin score (0-100)
- Concerns detection
- Personalized recommendations

### Weather-Adaptive Routines
- Browser geolocation integration
- OpenWeatherMap API for real-time weather
- UV index tracking with high-UV alerts
- Humidity-based product recommendations
- Morning & evening routine generation with Gemini AI
- Weather context displayed in routine

### Product System
- Product recommendations based on skin type/concerns
- Match scoring algorithm
- No affiliate bias - pure research-based recommendations
- Links to Amazon/Sephora for convenience

### Virtual Product Shelf
- Add/remove products
- Track opened date
- PAO (Period After Opening) support
- Automatic expiry calculation
- Expiry alerts (expired/expiring soon)
- Category organization

### Skin Journal
- Daily entries with mood tracking
- Self-rated skin score
- Notes
- Progress chart (Recharts)

### Reminder System
- Time-based routine reminders
- High UV alerts with location
- Low humidity alerts
- Dismissible banners

### UI/UX
- Glassmorphic dark theme
- Purple/pink gradient accents
- Responsive design
- Loading states and animations
- Medical disclaimer on all dashboard pages

## Database Schema
- profiles (user skin type, concerns, location)
- skin_analyses (analysis results, scores)
- routines (morning/evening, weather context)
- journal_entries (mood, notes, scores)
- product_recommendations
- shelf_products (expiry tracking) - **NEW**

## Prioritized Backlog

### P0 (Critical)
- [x] Core skin analysis flow
- [x] Authentication
- [x] Dashboard layout

### P1 (High Priority)
- [ ] Push notifications for UV alerts (requires service worker)
- [ ] Image storage in Supabase Storage
- [ ] Product shelf analytics

### P2 (Nice to Have)
- [ ] Social sharing of skin journey
- [ ] Dermatologist directory integration
- [ ] Multi-language support
- [ ] Dark/Light theme toggle

## Next Tasks
1. Run Supabase migration for shelf_products table
2. Test full authentication flow with real user
3. Add push notification support for UV alerts
4. Implement image storage to Supabase Storage
5. Add product barcode scanning feature

## Live URL
https://5170efd5-d913-4d8a-ace0-4282be6d0ba9.preview.emergentagent.com
