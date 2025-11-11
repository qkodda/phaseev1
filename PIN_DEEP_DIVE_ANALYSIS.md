# 🔴 CRITICAL: PIN/SCHEDULE PERSISTENCE ISSUE - DEEP DIVE

## Problem Statement
**Every time user logs in, 7 ideas are already pinned (even after deletion)**

## Hypothesis
1. Ideas are being saved to database with `is_pinned = true`
2. On login, `loadIdeasFromSupabase()` queries for `is_pinned = true`
3. Finds 7 old ideas and loads them
4. User deletes them from UI, but they're not deleted from database
5. On next login, same 7 ideas load again

## Investigation Steps

### Step 1: Verify Database Schema ✓
```sql
-- Required columns in ideas table:
- is_pinned BOOLEAN
- is_scheduled BOOLEAN
- action TEXT
- setup TEXT
- story TEXT
- hook TEXT
```

### Step 2: Check Save Flow
When user pins an idea:
1. `pinCard()` → `swipeCard(card, 'right')`
2. `addPinnedIdea(ideaData)` - adds to UI
3. `savePinnedIdeaToSupabase(ideaData)` - saves to DB with `is_pinned: true`

**POTENTIAL ISSUE:** Ideas are being saved correctly, but never unpinned/deleted from DB.

### Step 3: Check Load Flow
On login:
```javascript
const { data: pinnedIdeas } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_pinned', true)  // ← Finds ALL ideas with is_pinned=true
    .order('created_at', { ascending: false });
```

**CONFIRMED ISSUE:** This loads ALL ideas ever pinned, not just current session.

### Step 4: Check Delete Flow
When user deletes a pinned idea:
- `deleteIdeaFromExpanded()` or delete button
- Removes from UI
- **MISSING:** Does NOT update database to set `is_pinned = false` or delete the record

## Root Cause
**DELETE OPERATIONS DON'T UPDATE THE DATABASE**

When user:
- Deletes a pinned idea → Only removed from UI, still `is_pinned=true` in DB
- Schedules a pinned idea → Should set `is_pinned=false`, but may not be working
- Swipes left (skip) → Idea never saved, so not an issue

## Solution Required

### Fix 1: Delete from Database
When user deletes an idea, actually delete it from Supabase:
```javascript
async function deleteIdeaFromDatabase(ideaId) {
    const { supabase } = await import('./supabase.js');
    await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaId);
}
```

### Fix 2: Update on Schedule
When scheduling a pinned idea, set `is_pinned = false`:
```javascript
await supabase
    .from('ideas')
    .update({ 
        is_pinned: false,
        is_scheduled: true,
        scheduled_date: date
    })
    .eq('id', ideaId);
```

### Fix 3: Add Cleanup Helper
Add a function to clear all pinned ideas from DB:
```javascript
window.clearAllPinnedIdeasFromDB = async function() {
    const user = getUser();
    await supabase
        .from('ideas')
        .delete()
        .eq('user_id', user.id)
        .eq('is_pinned', true);
}
```

## Testing Plan
1. Run `clearAllPinnedIdeasFromDB()` in console
2. Pin a new idea
3. Verify it appears in UI
4. Delete it
5. Reload page
6. Verify it does NOT reappear
7. Pin another idea
8. Schedule it
9. Verify it moves from pinned to scheduled
10. Reload page
11. Verify it's in scheduled, not pinned

## Files to Modify
1. `app.js` - Add delete from DB in `removeCollapsedCard()`
2. `app.js` - Ensure schedule updates `is_pinned = false`
3. `supabase.js` - Add `deleteIdea(ideaId)` function
4. Add cleanup helpers for testing

