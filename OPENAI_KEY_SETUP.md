# OpenAI API Key Setup - IMPORTANT

## Current Status
The OpenAI API key is temporarily hardcoded in `openai-service.js` to get AI generation working immediately.

**⚠️ DO NOT COMMIT `openai-service.js` TO GITHUB WITH THE KEY EXPOSED**

## The Problem
- Vite's `import.meta.env` is not loading environment variables in the production build
- The `.env.local` file is being ignored during the build process
- This causes the AI to fail with "Cannot read properties of undefined"

## Temporary Solution (Current)
The API key is hardcoded with a fallback in `openai-service.js`:
```javascript
const OPENAI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) 
  || 'sk-proj-NELdng8kS6ATwGiDpbc6HP2-...'
```

## Production Solution (TODO - High Priority)
Move OpenAI API calls to **Supabase Edge Functions**:

1. Create edge function: `supabase/functions/generate-ideas/index.ts`
2. Store API key in Supabase secrets: `supabase secrets set OPENAI_API_KEY=sk-...`
3. Call edge function from frontend instead of direct OpenAI API
4. Remove hardcoded key from `openai-service.js`

### Benefits:
- ✅ API key stays server-side (secure)
- ✅ No exposure in client code
- ✅ Can be pushed to GitHub safely
- ✅ Better rate limiting and error handling
- ✅ Can add usage tracking and quotas

## For Now
The app works with AI generation! Just don't commit the file with the exposed key.

To test:
1. Build is already done: `npm run build`
2. iOS sync is done: `npx cap sync ios`
3. Open in Xcode and run on device
4. Generate ideas - AI should work!

## Next Steps
1. Test AI generation on device
2. If working, implement Supabase Edge Function
3. Remove hardcoded key
4. Push secure version to GitHub

