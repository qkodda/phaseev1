# ⚡ PHASEE - QUICK REFERENCE

## 🚀 YOUR NEXT 3 STEPS

### 1️⃣ Copy Environment Template (30 seconds)
```bash
cp env.example .env.local
```

### 2️⃣ Add Your OpenAI API Key (2 minutes)
Edit `.env.local` and add:
```
VITE_OPENAI_API_KEY=sk-your-actual-key-here
```
Get key from: https://platform.openai.com/api-keys

### 3️⃣ Test It! (5 minutes)
```bash
npm install
npm run dev
```
Visit: http://localhost:4000

---

## 🔑 Where to Get API Keys

### OpenAI (Required for idea generation)
1. Go to https://platform.openai.com
2. Sign up / Log in
3. Go to API Keys section
4. Create new secret key
5. Copy immediately (shown only once!)
6. Add payment method + credits ($10 minimum)

### Supabase (Already configured with test credentials)
- Current app uses existing test database
- For production, create your own at https://supabase.com
- Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`

---

## 📱 Available Commands

```bash
# Development
npm run dev              # Start local server (http://localhost:4000)

# Production Build
npm run build           # Create production build

# iOS Development
npm run cap:sync        # Sync web assets to iOS
npm run cap:ios         # Build and open in Xcode
```

---

## ✅ Quick Test Checklist

Once server is running:
- [ ] Sign up with test email
- [ ] Complete onboarding
- [ ] Click dice icon to generate ideas
- [ ] Swipe cards (use mouse drag on desktop)
- [ ] Pin an idea
- [ ] Schedule an idea
- [ ] Check profile page
- [ ] Sign out

---

## 📖 Full Documentation

- **`LAUNCH_SUMMARY.md`** - Complete launch guide
- **`DISTRIBUTION_READY.md`** - Deployment & App Store guide
- **`README.md`** - Project overview
- **`DOCS_INDEX.md`** - All documentation index

---

## 🆘 Quick Troubleshooting

### "OpenAI API error"
→ Add your API key to `.env.local`

### "No ideas generated"
→ Check OpenAI has credits

### "Can't sign up"
→ Check Supabase project is active

### "Port 4000 in use"
→ Change port in `vite.config.js`

---

## 🎯 Current Status

✅ App is **100% ready** for development and testing  
✅ Just add your OpenAI key to generate ideas  
✅ Everything else works out of the box

---

**That's it! You're ready to go. 🚀**

