# 🔧 EMERGENCY RESTORE COMMANDS

If anything breaks, use these exact values to restore the working state.

## Quick Restore - CSS Critical Properties

### Trend Scroller Container
```css
.trend-strip-container {
    height: 36px !important;
    min-height: 36px !important;
    z-index: 150 !important;
}
```

### Trend Strip
```css
.trend-strip {
    height: 36px !important;
    align-items: center !important;
}
```

### Homepage Content
```css
.homepage-content {
    padding-top: 355px !important;
}
```

## Quick Restore - JavaScript

### In navigateTo() function (~line 510)
```javascript
if (pageId === 'homepage') {
    personalizeHeroSection();
    initTrendStrip(); // CRITICAL LINE
    loadIdeasFromSupabase().catch(err => {
        console.error('Failed to reload ideas:', err);
    });
```

## Version Numbers
```html
<link rel="stylesheet" href="style.css?v=7.0">
<script type="module" src="app.js?v=7.0">
```

## Hard Refresh
Windows: `Ctrl + Shift + R`  
Mac: `Cmd + Shift + R`

