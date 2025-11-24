# Phazee - Experiential Storytelling Content Generator

🎨 AI-Powered content idea generator with swipe functionality, pinning, and scheduling capabilities for content creators.

**Status:** ✅ **Distribution Ready** | **Version:** 1.0.0

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase and OpenAI credentials

# Start development server
npm run dev
```

App will be available at:
- **Desktop:** http://localhost:4000
- **Mobile:** http://[YOUR-IP]:4000 (ensure same WiFi network)

**📖 For complete setup and distribution guide, see [`DISTRIBUTION_READY.md`](DISTRIBUTION_READY.md)**

## 📱 App Structure

### Page Navigation
All pages accessible via `navigateTo(pageId)` function:

| Page ID | Purpose | Access |
|---------|---------|--------|
| `sign-in-page` | Authentication (default) | Entry point |
| `onboarding-1-page` | User content preferences | After sign up |
| `onboarding-2-page` | Customization settings | After onboarding 1 |
| `paywall-page` | Subscription offer ($6.99/mo) | After onboarding |
| `homepage` | Main app interface | After auth/paywall |
| `profile-page` | User profile settings | Header icon |
| `settings-page` | App settings | Footer icon |
| `privacy-page` | Privacy policy | Settings menu |
| `terms-page` | Terms & conditions | Settings menu |
| `help-page` | Help center & FAQ | Settings menu |

## 🎨 Component Reference

### Sign In Page (`#sign-in-page`)
- **App Logo** (`.app-logo`) - "ContentGen" branding
- **Sign In Form** (`#sign-in-form`) - Email/password login
- **Sign Up Form** (`#sign-up-form`) - New account creation
- **Auth Toggle** (`#auth-toggle`) - Switch between sign in/up

### Onboarding Pages
**Page 1** (`#onboarding-1-page`)
- **Content Type Selector** (`#content-type`)
- **Platform Selector** (`#platform`)
- **Audience Input** (`#audience`)

**Page 2** (`#onboarding-2-page`)
- **Tone Selector** (`#tone`)
- **Topics Input** (`#topics`)
- **Goals Input** (`#goals`)

### Paywall Page (`#paywall-page`)
- **Paywall Card** (`.paywall-card`) - Subscription details
- **Feature List** (`.feature-list`) - Product benefits
- **Trial Button** - Start 3-day free trial

### Homepage (`#homepage`)
**Header Component** (`#app-header`)
- **Header Logo** (`.header-logo`) - Phazee brand logo
- **Profile Pill Button** (`.profile-pill-btn`) - Purple rounded square with white profile icon

**Four Main Components (Vertical Layout):**

1. **Hero Section** (`#hero-section`)
   - Hero Title (`.hero-title`) - "Welcome back, [Name]" with gradient & shine effect
   - Hero Subtitle (`.hero-subtitle`) - "Let's build some content...!"

2. **Idea Swiper** (`#idea-swiper`)
   - Card Stack (`.card-stack`) - Displays current idea
   - Idea Card (`.idea-card`) - Content preview with structured sections
   - Card Actions (inside card):
     - Skip Button (`.card-action-btn.skip-btn`) - Red X icon (top-left corner)
     - Pin Button (`.card-action-btn.pin-btn`) - Purple pin icon (top-right corner)
   - Card Content Structure:
     - Card Title (`.card-title`) - Idea name
     - Summary Section - Brief overview
     - Action/Story Section - What to film
     - Shot/Setup Section - Technical filming details
     - Story Section - Narrative structure
     - Hook Section - Opening line
     - Why Section - Purpose and value

3. **Pinned Ideas** (`#pinned-ideas`)
   - Title: "Pinned Ideas (count)"
   - Ideas Grid (`.ideas-grid`) - Saved ideas in collapsed view
   - Collapsed Idea Card (`.idea-card-collapsed`) - 320px × 75px horizontal card
     - Collapsed Content (`.collapsed-content`) - Title, summary, platform icons
     - Collapsed Actions (`.collapsed-actions`) - Action buttons
       - Schedule Button - Move to schedule section
       - Expand Button - View full details (coming soon)
       - Delete Button - Remove idea
   - Empty State - Shows when no pins

4. **Schedule Component** (`#schedule-component`)
   - Title: "Schedule"
   - Schedule List (`.schedule-list`) - Scheduled content in collapsed view
   - Collapsed Idea Card (same as Pinned Ideas, without schedule button)
   - Empty State - Shows when no scheduled items

**Footer Component** (`#app-footer`)
- **Settings Icon Button** - Navigate to settings

### Profile Page (`#profile-page`)
- **Page Header** (`.page-header`) - Back button + title
- **Avatar Circle** (`.avatar-circle`) - Profile photo
- **Profile Form** - Editable user information
- **Save Button** - Update profile

### Settings Page (`#settings-page`)
**Account Group** (`.settings-group`)
- Redo Onboarding
- Manage Subscription

**Legal Group**
- Privacy Policy link
- Terms & Conditions link

**Support Group**
- Help Center link
- Contact Support

**Sign Out Button** (`.btn-danger`)

### Help Center Page (`#help-page`)
- **FAQ Items** (`.faq-item`) - Collapsible Q&A
- **Contact Section** - Support email link

## 🎯 Key Features

### Current Implementation
✅ Complete page navigation system
✅ Sign in/sign up toggle
✅ Two-page onboarding flow
✅ Paywall with trial offer
✅ Homepage with three main components
✅ Collapsed idea cards (320px × 75px) for pinned/scheduled ideas
✅ Pin, schedule, expand, and delete functionality
✅ Dynamic platform icons based on content type
✅ Profile management
✅ Settings with legal pages
✅ Help center with FAQs
✅ Coordinate grid overlay for development
✅ Responsive design (390x844 iPhone 14+ dimensions)
✅ Smooth animations and transitions
✅ iOS-style UI with backdrop blur effects
✅ Shine effects on interactive elements

### Ready for Integration
- AI idea generation API
- User authentication backend
- Subscription payment processing
- Content scheduling system
- Idea editing functionality
- Swipe gesture detection
- Local storage for offline access

## 🏗️ File Structure

```
phazeeV1/
├── index.html          # All pages in single HTML file
├── style.css           # Complete styling (organized by sections)
├── app.js              # Navigation & interaction logic
├── vite.config.js      # Dev server configuration
├── package.json        # Dependencies
└── README.md          # This file
```

## 🎨 Design System

### Colors
- **Gradient Background**: Light blue (#a8d8ff) → Purple (#8b7fc7)
- **Primary Action**: White with purple text
- **Skip Action**: Red (#ef4444)
- **Generate Action**: Darker Blue (#1d4ed8)
- **Pin Action**: Green (#22c556)

### Typography
- **Font Family**: SF Pro Display (Apple system font)
- **Title Sizes**: 36px (logo), 24-32px (headings), 18px (component titles)
- **Body Text**: 14-16px

### Spacing
- **Container Padding**: 24px horizontal
- **Component Margins**: 40px vertical between sections
- **Input Spacing**: 20px between fields

## 📐 Development Tools

### Coordinate Grid
Toggle visibility of the coordinate grid by showing/hiding `.coordinate-grid` class.
- **X-axis**: 0-390px (horizontal)
- **Y-axis**: 0-844px (vertical)
- **Grid lines**: Every 50px
- **Origin**: Bottom-left corner

### Component Naming Convention
All major components have clear ID attributes and descriptive class names:
- Page containers: `#page-name-page`
- Components: `#component-name` or `.component-name`
- Actions: `.action-btn`, `.skip-btn`, `.pin-btn`, etc.

## 🔧 Code Quality

- ✅ No CSS/syntax errors
- ✅ Clean, organized code structure
- ✅ Scalable architecture
- ✅ Semantic HTML5
- ✅ Modern ES6+ JavaScript
- ✅ Mobile-first responsive design
- ✅ Accessibility considerations (ARIA labels)
- ✅ No workarounds or hacks

## 🚀 Distribution & Deployment

**This app is production-ready!** All core features are implemented and tested.

### Next Steps for Launch:

1. **Set up your environment** - Copy `env.example` to `.env.local` and add your API keys
2. **Run the database schema** - Execute `SUPABASE_FRESH_START.sql` in your Supabase project
   - Upgrading an existing Supabase project? Run `SUPABASE_MIGRATION_2024_11_09.sql` to add the latest idea columns (pin/schedule support)
3. **Test locally** - Run `npm run dev` and verify all features work
4. **Build for iOS** - Run `npm run cap:ios` to open in Xcode
5. **Submit to App Store** - Follow the complete guide in `DISTRIBUTION_READY.md`

### ✅ What's Complete:
- ✅ Authentication system (Supabase)
- ✅ AI content generation (OpenAI GPT-4)
- ✅ Idea pinning & scheduling
- ✅ Profile management
- ✅ iOS app wrapper (Capacitor)
- ✅ Production build system

### 📋 See [`DISTRIBUTION_READY.md`](DISTRIBUTION_READY.md) for:
- Complete deployment checklist
- App Store submission guide
- Security best practices
- Troubleshooting guide
- Post-launch monitoring

### 📚 Documentation:
- **[DISTRIBUTION_READY.md](DISTRIBUTION_READY.md)** - Complete deployment guide
- **[DOCS_INDEX.md](DOCS_INDEX.md)** - Documentation index
- **[env.example](env.example)** - Environment variables template

## 📱 Testing

### Local Testing:
```bash
npm run dev
# Access at http://localhost:4000
```

### Mobile Testing:
1. Ensure device is on same WiFi as development machine
2. Find your IP address (run `ipconfig` on Windows or `ifconfig` on Mac/Linux)
3. Navigate to: `http://[YOUR-IP]:4000` on mobile device
4. Test all pages and interactions

### iOS Device Testing:
```bash
npm run cap:ios
# Opens Xcode - select your device and click Run
```

## 🏗️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Build Tool:** Vite 5
- **Mobile:** Capacitor 7.4.4
- **Backend:** Supabase (Authentication, Database, Realtime)
- **AI:** OpenAI GPT-4 Turbo
- **Platform:** iOS (with Android support possible)

## 📄 License

Proprietary - All rights reserved

