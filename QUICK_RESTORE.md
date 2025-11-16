# ⚡ QUICK RESTORE - EMERGENCY ONLY

## 🚨 IF EVERYTHING BREAKS

Copy and paste these commands in order:

### Step 1: Restore Code
```bash
git checkout v7.1-STABLE
```

### Step 2: If that doesn't work
```bash
git reset --hard v7.1-STABLE
```

### Step 3: Clear Browser
Windows: `Ctrl + Shift + R`  
Mac: `Cmd + Shift + R`

### Step 4: Restart Server
Kill server (Ctrl+C) then:
```bash
npm run dev
```

## 🔍 Check Working State

Open: http://localhost:4000

Should see:
✅ Trend scroller full-width at top
✅ Cards centered and swipeable
✅ No overlapping elements
✅ Smooth animations

## Still Broken?

Read: `SAFETY_NET_V7.1.md` for detailed steps

