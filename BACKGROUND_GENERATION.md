# Background Idea Generation - Morning Pre-Generation

## Goal
Generate fresh ideas every morning (e.g., 7 AM) so they're ready when the user opens the app, even if the app hasn't been opened.

## iOS Implementation Strategy

### 1. Background Fetch (Recommended)
iOS allows apps to periodically fetch new content in the background.

**Capacitor Plugin Needed**: `@capacitor/background-fetch`

```typescript
import { BackgroundFetch } from '@capacitor/background-fetch';

// Register background task
await BackgroundFetch.configure({
  minimumFetchInterval: 24 * 60, // 24 hours in minutes
  stopOnTerminate: false,
  enableHeadless: true,
  startOnBoot: true
}, async (taskId) => {
  console.log('[BackgroundFetch] Task started:', taskId);
  
  // Generate ideas
  await generateAndCacheIdeas();
  
  // Finish task
  BackgroundFetch.finish(taskId);
});

// Schedule for 7 AM daily
await BackgroundFetch.scheduleTask({
  taskId: 'morning-idea-generation',
  delay: getMillisecondsUntil7AM(),
  periodic: true,
  forceAlarmManager: true
});
```

### 2. Local Notifications as Trigger
Use a silent notification at 7 AM to wake the app and generate ideas.

**Capacitor Plugin Needed**: `@capacitor/local-notifications`

```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

// Schedule daily silent notification
await LocalNotifications.schedule({
  notifications: [
    {
      id: 1,
      title: 'Generating Ideas',
      body: 'Preparing your daily content ideas...',
      schedule: {
        every: 'day',
        at: new Date(new Date().setHours(7, 0, 0, 0))
      },
      sound: null, // Silent
      ongoing: true
    }
  ]
});

// Listen for notification trigger
LocalNotifications.addListener('localNotificationReceived', async (notification) => {
  if (notification.id === 1) {
    await generateAndCacheIdeas();
  }
});
```

### 3. Caching Strategy
Store generated ideas in local storage with timestamp.

```javascript
async function generateAndCacheIdeas() {
  try {
    const user = getUser();
    if (!user) return;
    
    const profile = await getUserProfile(user.id);
    const ideas = await generateContentIdeas(profile);
    
    // Cache ideas with timestamp
    localStorage.setItem('cached_ideas', JSON.stringify({
      ideas: ideas,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }));
    
    console.log('✅ Ideas pre-generated and cached');
  } catch (error) {
    console.error('❌ Background generation failed:', error);
  }
}

// On app open, check cache first
function loadIdeasFromCacheOrGenerate() {
  const cached = localStorage.getItem('cached_ideas');
  
  if (cached) {
    const { ideas, expiresAt } = JSON.parse(cached);
    
    if (new Date(expiresAt) > new Date()) {
      console.log('✅ Loading cached ideas');
      return ideas;
    }
  }
  
  // Cache expired or doesn't exist - generate fresh
  console.log('⚡ Generating fresh ideas');
  return generateNewIdeas();
}
```

## Implementation Steps

### Phase 1: Basic Caching (Immediate)
1. ✅ Implement progressive loading (3 + 4 split) - **DONE**
2. Add caching layer for generated ideas
3. Check cache on app open before generating

### Phase 2: Background Tasks (Next Sprint)
1. Install Capacitor Background Fetch plugin
2. Configure iOS background modes in `Info.plist`:
   ```xml
   <key>UIBackgroundModes</key>
   <array>
     <string>fetch</string>
     <string>processing</string>
   </array>
   ```
3. Register background task for 7 AM daily
4. Test background generation

### Phase 3: Optimization
1. Track generation success/failure rates
2. Implement retry logic for failed generations
3. Add user preference for generation time
4. Monitor battery impact

## iOS Limitations
- **Not Guaranteed**: iOS decides when to run background tasks based on:
  - Battery level
  - Network availability
  - User behavior patterns
  - System load
- **Minimum Interval**: iOS enforces minimum 15-minute intervals
- **User Permissions**: Requires background refresh to be enabled

## Alternative: Server-Side Pre-Generation
For more reliability, generate ideas server-side:

1. **Supabase Edge Function** runs at 7 AM (via cron)
2. Generates ideas for all active users
3. Stores in `pre_generated_ideas` table
4. App fetches from table instead of generating

**Pros**:
- ✅ Guaranteed execution
- ✅ No battery impact
- ✅ Faster app experience

**Cons**:
- ❌ Server costs for OpenAI API
- ❌ Need to manage user timezones
- ❌ Storage for all users' ideas

## Recommended Approach
**Hybrid Strategy**:
1. Try to load from server-side pre-generated ideas
2. Fall back to local cache if available
3. Generate fresh if both fail

This gives the best user experience with multiple fallbacks.

## Next Steps
1. Implement basic caching layer (quick win)
2. Test progressive loading on device
3. Decide: Client-side background tasks vs Server-side pre-generation
4. Implement chosen strategy

---

**Status**: Progressive loading implemented ✅  
**Next**: Caching layer + background task decision

