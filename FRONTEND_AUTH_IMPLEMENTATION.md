# 🔐 Frontend Authentication Implementation Guide

## Overview

This guide shows how to replace the localStorage-only authentication with real Supabase authentication.

---

## Files Created

1. **`auth-integration.js`** - Complete authentication module
2. **`SUPABASE_SETUP_GUIDE.md`** - Database setup instructions
3. **This file** - Implementation guide

---

## Implementation Steps

### Step 1: Import Auth Module in app.js

Add this at the top of `app.js`:

```javascript
import {
    initAuth,
    isAuthenticated,
    getUser,
    handleSignUp,
    handleSignIn,
    handleSignOut,
    handlePasswordReset,
    getUserProfile,
    updateUserProfile,
    hasCompletedOnboarding,
    markOnboardingComplete,
    startTrial,
    isTrialExpired,
    hasActiveSubscription,
    onAuthStateChange
} from './auth-integration.js';
```

### Step 2: Replace Sign-In Form Handler

**Find this code (around line 1051):**
```javascript
signInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    console.log('Sign In:', { email, password });
    
    // TODO: Add actual authentication with Supabase
    // For now, use local auth
    handleUserSignIn(email);
});
```

**Replace with:**
```javascript
signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    // Show loading state
    const submitBtn = signInForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
        const result = await handleSignIn(email, password);
        
        if (result.success) {
            console.log('✅ Sign in successful');
            
            // Check onboarding status
            const onboardingComplete = await hasCompletedOnboarding(result.user.id);
            
            if (onboardingComplete) {
                // Check trial/subscription
                const trialExpired = await isTrialExpired(result.user.id);
                const hasSubscription = await hasActiveSubscription(result.user.id);
                
                if (trialExpired && !hasSubscription) {
                    navigateTo('paywall-page');
                } else {
                    navigateTo('homepage');
                }
            } else {
                // Start trial and go to onboarding
                await startTrial(result.user.id);
                navigateTo('onboarding-1-page');
            }
        } else {
            // Show error
            showAlertModal('Sign In Failed', result.error || 'Invalid email or password');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Sign in error:', error);
        showAlertModal('Error', 'An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
```

### Step 3: Replace Sign-Up Form Handler

**Find this code (around line 1064):**
```javascript
signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    console.log('Sign Up:', { name, email, password });
    
    // TODO: Add actual authentication with Supabase
    // For now, treat as new user sign-in
    // Clear any existing data for fresh start
    localStorage.removeItem('onboardingComplete');
    localStorage.removeItem('trialStartedAt');
    
    handleUserSignIn(email);
});
```

**Replace with:**
```javascript
signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    // Validate password length
    if (password.length < 6) {
        showAlertModal('Invalid Password', 'Password must be at least 6 characters long');
        return;
    }
    
    // Show loading state
    const submitBtn = signUpForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    try {
        const result = await handleSignUp(name, email, password);
        
        if (result.success) {
            if (result.requiresConfirmation) {
                // Email confirmation required
                showAlertModal(
                    'Check Your Email',
                    'We sent you a confirmation email. Please click the link to verify your account.',
                    () => {
                        // Reset form
                        signUpForm.reset();
                        // Switch back to sign in
                        document.getElementById('auth-toggle').click();
                    }
                );
            } else {
                // Auto signed in, start trial and go to onboarding
                await startTrial(result.user.id);
                navigateTo('onboarding-1-page');
            }
        } else {
            // Show error
            showAlertModal('Sign Up Failed', result.error || 'Could not create account');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Sign up error:', error);
        showAlertModal('Error', 'An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
```

### Step 4: Replace handleUserSignOut Function

**Find this code (around line 3247):**
```javascript
function handleUserSignOut() {
    // Keep trial data but mark as not authenticated
    localStorage.setItem('userAuthenticated', 'false');
    navigateTo('sign-in-page');
}
```

**Replace with:**
```javascript
async function handleUserSignOutLocal() {
    try {
        const result = await handleSignOut();
        
        if (result.success) {
            // Clear any local data
            localStorage.clear();
            navigateTo('sign-in-page');
        } else {
            showAlertModal('Error', 'Could not sign out. Please try again.');
        }
    } catch (error) {
        console.error('Sign out error:', error);
        showAlertModal('Error', 'Could not sign out. Please try again.');
    }
}

// Update global reference
window.handleUserSignOut = handleUserSignOutLocal;
```

### Step 5: Update initializeApp Function

**Find this code (around line 3254):**
```javascript
function initializeApp() {
    // Check if user is authenticated
    if (!isUserAuthenticated()) {
        // Not authenticated, show sign-in page
        navigateTo('sign-in-page');
        return;
    }
    
    // User is authenticated
    // Check if onboarding is complete
    if (!isOnboardingComplete()) {
        // Onboarding not complete, return to start
        navigateTo('onboarding-1-page');
        return;
    }
    
    // Check if trial is expired
    if (isTrialExpired() && !hasActiveSubscription()) {
        // Trial expired, show paywall
        navigateTo('paywall-page');
        return;
    }
    
    // All good, go to homepage
    navigateTo('homepage');
}
```

**Replace with:**
```javascript
async function initializeApp() {
    try {
        // Check for existing session
        const user = await initAuth();
        
        if (!user) {
            // Not authenticated, show sign-in page
            navigateTo('sign-in-page');
            return;
        }
        
        console.log('✅ User authenticated:', user.email);
        
        // Check if onboarding is complete
        const onboardingComplete = await hasCompletedOnboarding(user.id);
        
        if (!onboardingComplete) {
            // Onboarding not complete, return to start
            navigateTo('onboarding-1-page');
            return;
        }
        
        // Check if trial is expired
        const trialExpired = await isTrialExpired(user.id);
        const hasSubscription = await hasActiveSubscription(user.id);
        
        if (trialExpired && !hasSubscription) {
            // Trial expired, show paywall
            navigateTo('paywall-page');
            return;
        }
        
        // All good, go to homepage
        navigateTo('homepage');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        navigateTo('sign-in-page');
    }
}
```

### Step 6: Update completeOnboarding Function

**Find the completeOnboarding function and update it:**

```javascript
async function completeOnboarding() {
    // Get form data from both pages
    const brandName = document.getElementById('brand-name')?.value;
    const role = document.getElementById('role')?.value;
    const foundedYear = document.getElementById('founded-year')?.value;
    const industry = document.getElementById('industry')?.value;
    
    // Validate required field
    if (!brandName || brandName.trim() === '') {
        showAlertModal('Required Field', 'Please enter your brand name to continue.');
        return;
    }
    
    // Get selected platforms
    const selectedPlatforms = Array.from(
        document.querySelectorAll('.platform-select-btn.selected')
    ).map(btn => btn.dataset.platform);
    
    // Get selected culture values
    const selectedValues = Array.from(
        document.querySelectorAll('.pill-btn.selected')
    ).map(btn => btn.textContent);
    
    try {
        const user = getUser();
        
        if (!user) {
            showAlertModal('Error', 'No user session found. Please sign in again.');
            navigateTo('sign-in-page');
            return;
        }
        
        // Save profile data to Supabase
        await updateUserProfile(user.id, {
            brand_name: brandName,
            role: role,
            founded_year: foundedYear ? parseInt(foundedYear) : null,
            industry: industry,
            platforms: selectedPlatforms,
            culture_values: selectedValues,
            onboarding_complete: true
        });
        
        console.log('✅ Onboarding complete, profile saved');
        
        // Navigate to paywall
        navigateTo('paywall-page');
        
    } catch (error) {
        console.error('Error completing onboarding:', error);
        showAlertModal('Error', 'Could not save profile. Please try again.');
    }
}
```

### Step 7: Add Auth State Listener

**Add this in the DOMContentLoaded event:**

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // ... existing code ...
    
    // Listen for auth state changes
    onAuthStateChange((event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_OUT') {
            localStorage.clear();
            navigateTo('sign-in-page');
        }
        
        if (event === 'SIGNED_IN') {
            console.log('User signed in:', session.user.email);
        }
        
        if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed');
        }
    });
    
    // Initialize app with auth check
    await initializeApp();
    
    // ... rest of existing code ...
});
```

---

## Testing Checklist

After implementation, test these flows:

### ✅ Sign Up Flow
1. [ ] Fill out sign-up form
2. [ ] Submit and check for email confirmation message
3. [ ] Check email inbox for confirmation link
4. [ ] Click confirmation link
5. [ ] Sign in with new account
6. [ ] Should go to onboarding

### ✅ Sign In Flow
1. [ ] Enter valid credentials
2. [ ] Should navigate based on onboarding/trial status
3. [ ] Invalid credentials should show error

### ✅ Onboarding Flow
1. [ ] Complete onboarding forms
2. [ ] Data should save to Supabase `profiles` table
3. [ ] Should navigate to paywall after completion

### ✅ Trial Flow
1. [ ] Trial should start on first sign-in
2. [ ] Trial countdown should show correctly
3. [ ] After 3 days, should show paywall

### ✅ Sign Out Flow
1. [ ] Click sign out in settings
2. [ ] Should return to sign-in page
3. [ ] Should clear session

---

## Database Verification

Check Supabase Table Editor:

1. **profiles** table should have:
   - User ID matching auth.users
   - Brand name, platforms, culture values
   - onboarding_complete = true
   - trial_started_at timestamp

2. **ideas** table should have:
   - Pinned and scheduled ideas
   - user_id matching the logged-in user

3. **generation_analytics** table should track:
   - Idea generation events

4. **app_analytics** table should track:
   - Page views and sessions

---

## Next Steps After Implementation

1. **Test thoroughly** with multiple accounts
2. **Set up email templates** in Supabase (optional)
3. **Add password reset UI** (forgot password link)
4. **Add email change functionality** in settings
5. **Implement payment integration** (Stripe)

---

**Ready to implement? Let me know if you want me to make these changes automatically!** 🚀

