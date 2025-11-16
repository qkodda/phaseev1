# 🔒 LOCKED STATE - VERSION 7.0 - DO NOT MODIFY

**Date:** Current Session  
**Status:** ✅ WORKING - LOCKED  
**Version:** 7.0

---

## 🎯 CRITICAL SUCCESS - TREND SCROLLER IS VISIBLE

### **What's Working:**
✅ Trend scroller is visible and functional  
✅ Proper spacing between header and content  
✅ All content moves as a cohesive unit  
✅ No overlapping elements  
✅ Swipe cards functioning correctly  
✅ Background containers properly positioned  

---

## 📐 EXACT VALUES - DO NOT CHANGE

### **HERO/HEADER** (`.hero-header`)
```css
height: 140px !important;
min-height: 140px !important;
max-height: 140px !important;
padding: 16px 20px 20px 20px !important;
gap: 4px !important;
position: fixed !important;
top: 0 !important;
width: 390px !important;
z-index: 1000 !important;
```

### **TREND SCROLLER CONTAINER** (`.trend-strip-container`)
```css
width: 390px !important;
max-width: 390px !important;
height: 36px !important; /* CRITICAL - Without this, container collapses */
min-height: 36px !important; /* CRITICAL - Prevents collapse */
overflow-x: auto !important;
overflow-y: hidden !important;
position: relative !important;
margin: 2px auto 2px auto !important;
z-index: 150 !important;
```

### **TREND STRIP** (`.trend-strip`)
```css
display: flex !important;
gap: 10px !important;
height: 36px !important; /* CRITICAL - Match container height */
align-items: center !important; /* CRITICAL - Center chips vertically */
min-width: 300vw !important;
animation: trendScroll 30s linear infinite !important;
```

### **HOMEPAGE CONTENT** (`.homepage-content`)
```css
padding-top: 355px !important; /* CRITICAL - Creates space for header + trend scroller + buffer */
padding-left: 20px !important;
padding-right: 20px !important;
padding-bottom: 40px !important;
```

### **IDEA SWIPER** (`.idea-swiper`)
```css
margin-top: -8px !important;
position: relative !important;
display: flex !important;
justify-content: center !important;
```

### **IDEA CARD** (`.idea-card`)
```css
width: 300px !important;
height: 270px !important;
position: absolute !important;
top: 25px !important; /* Relative to swiper container */
background: #FFFFFF !important;
border: none !important;
box-shadow: 0 0 30px rgba(0, 0, 0, 0.15) !important;
```

### **SHADOW CONTAINERS** (`.card-shadow-container`)
```css
width: 350px !important;
height: 220px !important;
position: absolute !important;
top: 50px !important; /* Relative to swiper container */
```

### **PINNED/SCHEDULE CONTAINERS**
```css
padding: 24px 16px; /* Top/bottom: 24px, Left/right: 16px */
box-shadow: 0 0 30px rgba(0, 0, 0, 0.06);
```

---

## 🔧 JAVASCRIPT - CRITICAL INITIALIZATION

### **app.js - navigateTo() Function**
```javascript
if (pageId === 'homepage') {
    // Personalize hero section
    personalizeHeroSection();
    
    // Initialize trend strip (CRITICAL - must be called on every homepage navigation)
    initTrendStrip();
    
    // Reload saved ideas from Supabase
    loadIdeasFromSupabase().catch(err => {
        console.error('Failed to reload ideas:', err);
    });
```

**LINE ~510-511:** `initTrendStrip();` MUST be called inside `navigateTo('homepage')`

### **app.js - DOMContentLoaded**
```javascript
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initVibeSelector();
        initTrendStrip(); // Also called here for initial page load
    });
} else {
    initVibeSelector();
    initTrendStrip();
}
```

**LINES ~5065-5072:** `initTrendStrip();` also called on DOM ready

---

## 📦 FILE VERSIONS

### **index.html**
```html
<link rel="stylesheet" href="style.css?v=7.0">
<script type="module" src="app.js?v=7.0">
```

**Current Version:** 7.0  
**Increment When:** Any CSS or JS change is made

---

## 🚫 FORBIDDEN ACTIONS

### **NEVER DO THESE:**

❌ Remove `height: 36px` from `.trend-strip-container`  
❌ Remove `height: 36px` from `.trend-strip`  
❌ Remove `initTrendStrip()` call from `navigateTo('homepage')`  
❌ Change `.homepage-content` padding-top from 355px  
❌ Move individual child elements (like `.idea-card`) instead of parent containers  
❌ Remove `!important` flags from any locked properties  
❌ Change z-index values  
❌ Modify animation speeds  

### **IF TREND SCROLLER DISAPPEARS:**

1. ✅ Check if `.trend-strip-container` has `height: 36px`
2. ✅ Check if `.trend-strip` has `height: 36px`
3. ✅ Check if `initTrendStrip()` is being called
4. ✅ Check browser cache (hard refresh with Ctrl+Shift+R)
5. ✅ Check version numbers match in index.html

---

## 📊 LAYOUT FLOW (Top to Bottom)

```
┌─────────────────────────────────────┐
│ HERO HEADER (Fixed)                 │ ← 0px (top: 0)
│ Height: 140px                        │
└─────────────────────────────────────┘
         ↓ (355px padding-top)
┌─────────────────────────────────────┐
│ TREND SCROLLER                      │ ← Inside homepage-content
│ Height: 36px                         │
└─────────────────────────────────────┘
         ↓ (margin + spacing)
┌─────────────────────────────────────┐
│ IDEA SWIPER (relative)              │
│ ├─ Idea Cards                       │
│ └─ Shadow Containers                │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ PINNED IDEAS                        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ SCHEDULED IDEAS                     │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ FOOTER BUTTONS (Settings/Help)      │
└─────────────────────────────────────┘
```

---

## 🎯 SUCCESS CRITERIA

This state is locked because:

✅ **Trend scroller is VISIBLE** (has height)  
✅ **Proper spacing** between all elements  
✅ **No overlapping** content  
✅ **All elements move together** as units  
✅ **No individual component positioning** breaking layout  
✅ **JavaScript initialization** working correctly  
✅ **Cache busting** enabled (v7.0)  

---

## 🔐 MODIFICATION PROTOCOL

**To make ANY change:**

1. Read this document first
2. Identify what you're changing
3. Check if it's a locked property
4. Ask user for explicit approval
5. Document the change
6. Increment version number
7. Test thoroughly
8. Update this document

---

## 📝 BACKUP VALUES (In Case of Emergency)

If something breaks, restore these exact values:

**Trend Scroller:**
- Container height: `36px`
- Strip height: `36px`
- Container z-index: `150`

**Homepage Content:**
- Padding-top: `355px`

**Idea Cards:**
- Top position: `25px` (relative to swiper)
- Box-shadow: `0 0 30px rgba(0, 0, 0, 0.15)`

**JavaScript:**
- `initTrendStrip()` called in `navigateTo('homepage')` at line ~511
- `initTrendStrip()` called in DOMContentLoaded at line ~5067

---

**LAST VERIFIED:** Current Session  
**STATUS:** ✅ WORKING PERFECTLY  
**NEXT ACTION:** None - Do not modify unless explicitly requested by user

🔒 **THIS STATE IS LOCKED - DO NOT MODIFY** 🔒

