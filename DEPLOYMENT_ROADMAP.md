# 🚀 Phasee Deployment Roadmap

## Current Status: ✅ Core Features Complete

### Completed Features:
- ✅ Auto-scrolling culture values carousel (3 rows, infinite scroll)
- ✅ Platform icon selection (onboarding & profile)
- ✅ Mobile swipe functionality (touch-optimized)
- ✅ Dice icon (2 dice rolling)
- ✅ Pinned ideas limit enforcement (7 max)
- ✅ Idea generator card with custom inputs
- ✅ All UI/UX components polished

---

## Phase 1: Capacitor iOS Wrapper 📱

### Prerequisites:
- Node.js & npm (already installed)
- Xcode (Mac required for iOS build)
- CocoaPods (iOS dependency manager)

### Step 1: Install Capacitor
```bash
cd C:\Users\T\Desktop\phaseeV1

# Install Capacitor CLI and iOS platform
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios

# Initialize Capacitor
npx cap init
# App name: Phasee
# App ID: com.phasee.app (or your preferred bundle ID)
```

### Step 2: Configure Capacitor
Create `capacitor.config.json`:
```json
{
  "appId": "com.phasee.app",
  "appName": "Phasee",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "ios": {
    "contentInset": "always"
  }
}
```

### Step 3: Build for Production
```bash
# Create production build
npm run build

# Add iOS platform
npx cap add ios

# Sync web assets to iOS
npx cap sync ios
```

### Step 4: Open in Xcode
```bash
npx cap open ios
```

### Xcode Configuration:
1. **Signing & Capabilities:**
   - Select your development team
   - Set bundle identifier: `com.phasee.app`
   - Enable capabilities: Push Notifications (future)

2. **Info.plist Settings:**
   - Display Name: Phasee
   - Version: 1.0.0
   - Build Number: 1
   - Privacy descriptions (camera, photos if needed)

3. **Assets:**
   - App Icon: 1024x1024 PNG
   - Launch Screen: Custom splash screen

### Step 5: Test on Device
1. Connect iPhone via USB
2. Select device in Xcode
3. Click Run (▶️)
4. App installs and launches

### Step 6: Prepare for App Store
1. Create App Store Connect account
2. Create app listing
3. Archive build in Xcode
4. Upload to App Store Connect
5. Submit for review

---

## Phase 2: Supabase Backend Integration 🗄️

### Prerequisites:
- Supabase account (free tier available)
- Project created on Supabase

### Step 1: Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Step 2: Database Schema

#### Tables to Create:

**1. users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  content_type TEXT,
  target_audience TEXT,
  culture_values TEXT[],
  platforms TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**3. ideas**
```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  action TEXT,
  setup TEXT,
  story TEXT,
  hook TEXT,
  why TEXT,
  platforms TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  is_scheduled BOOLEAN DEFAULT FALSE,
  scheduled_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**4. bookmarks**
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, idea_id)
);
```

### Step 3: Row Level Security (RLS)

Enable RLS on all tables:
```sql
-- Users can only read/update their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles policy
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Ideas policy
CREATE POLICY "Users can view own ideas"
  ON ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Bookmarks policy (similar pattern)
```

### Step 4: Initialize Supabase in App

Create `src/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 5: Authentication Integration

Replace mock auth with Supabase:
```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Step 6: Data Operations

**Save Profile:**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .upsert({
    id: user.id,
    full_name: name,
    content_type: contentType,
    platforms: selectedPlatforms,
    culture_values: selectedValues
  })
```

**Save Pinned Idea:**
```javascript
const { data, error } = await supabase
  .from('ideas')
  .insert({
    user_id: user.id,
    title: idea.title,
    summary: idea.summary,
    is_pinned: true,
    platforms: idea.platforms
  })
```

**Fetch Pinned Ideas:**
```javascript
const { data, error } = await supabase
  .from('ideas')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_pinned', true)
  .order('created_at', { ascending: false })
```

---

## Phase 3: OpenAI API Integration 🤖

### Prerequisites:
- OpenAI API account
- API key generated

### Step 1: Install OpenAI SDK
```bash
npm install openai
```

### Step 2: Create API Wrapper

Create `src/openai.js`:
```javascript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For development only
})

export async function generateIdeas(userProfile) {
  const prompt = `Generate 7 unique content ideas for a ${userProfile.contentType} creator.

Target Audience: ${userProfile.targetAudience}
Platforms: ${userProfile.platforms.join(', ')}
Culture Values: ${userProfile.cultureValues.join(', ')}

For each idea, provide:
- Title (catchy, under 10 words)
- Summary (1-2 sentences)
- Action/Story (what happens in the content)
- Shot/Setup (technical details)
- Story (narrative arc)
- Hook (opening line)
- Why (why this resonates)

Format as JSON array.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a creative content strategist specializing in social media and experiential storytelling.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.9,
    max_tokens: 2000
  })

  return JSON.parse(response.choices[0].message.content)
}
```

### Step 3: Integrate with Generate Function

Update `generateNewIdeas()`:
```javascript
async function generateNewIdeas() {
  // Show loading state
  showLoadingState()
  
  try {
    // Get user profile from Supabase
    const profile = await getUserProfile()
    
    // Generate ideas with OpenAI
    const ideas = await generateIdeas(profile)
    
    // Clear existing cards
    const cardStack = document.getElementById('card-stack')
    const existingCards = cardStack.querySelectorAll('.idea-card')
    existingCards.forEach(card => card.remove())
    
    // Create cards from generated ideas
    ideas.forEach(idea => {
      const card = createIdeaCard(idea)
      cardStack.insertBefore(card, generatorCard)
    })
    
    // Initialize swipe handlers
    initSwipeHandlers()
    
  } catch (error) {
    console.error('Error generating ideas:', error)
    showAlertModal('Error', 'Failed to generate ideas. Please try again.')
  } finally {
    hideLoadingState()
  }
}
```

### Step 4: Environment Variables

Create `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

Update `vite.config.js`:
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'process.env': process.env
  }
})
```

---

## Phase 4: Production Deployment Checklist ✅

### Security:
- [ ] Move API keys to environment variables
- [ ] Enable Supabase RLS policies
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Sanitize user inputs
- [ ] Enable HTTPS only

### Performance:
- [ ] Optimize images (compress, lazy load)
- [ ] Minify CSS/JS
- [ ] Enable caching
- [ ] Add service worker for offline support
- [ ] Optimize API calls (batch requests)

### Testing:
- [ ] Test on multiple iOS devices
- [ ] Test all user flows
- [ ] Test offline functionality
- [ ] Test payment integration
- [ ] Load testing

### App Store:
- [ ] Create app screenshots (6.5", 5.5")
- [ ] Write app description
- [ ] Set privacy policy URL
- [ ] Set support URL
- [ ] Choose app category
- [ ] Set pricing ($6.99/month)
- [ ] Configure in-app purchases

### Monitoring:
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Mixpanel/Amplitude)
- [ ] Set up crash reporting
- [ ] Monitor API usage
- [ ] Monitor costs

---

## Estimated Timeline 📅

- **Capacitor Setup:** 1-2 days
- **Supabase Integration:** 3-4 days
- **OpenAI Integration:** 2-3 days
- **Testing & Polish:** 2-3 days
- **App Store Submission:** 1-2 weeks (review time)

**Total: 2-3 weeks to launch**

---

## Next Immediate Steps 🎯

1. **Set up Capacitor** (Start here)
2. **Create Supabase project**
3. **Get OpenAI API key**
4. **Test on physical iOS device**
5. **Prepare App Store assets**

---

## Resources 📚

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

Ready to launch! 🚀

