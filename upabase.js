[1mdiff --git a/auth-integration.js b/auth-integration.js[m
[1mindex c44f327..c6a598a 100644[m
[1m--- a/auth-integration.js[m
[1m+++ b/auth-integration.js[m
[36m@@ -155,6 +155,25 @@[m [mexport function getSession() {[m
  * Handle user sign-up with email confirmation[m
  */[m
 export async function handleSignUp(name, email, password) {[m
[32m+[m[32m    // DEV BYPASS CHECK[m
[32m+[m[32m    if (isDevBypassActive()) {[m
[32m+[m[32m        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign up (DEV ONLY)');[m
[32m+[m[41m        [m
[32m+[m[32m        const fakeUser = createDevBypassUser();[m
[32m+[m[32m        fakeUser.email = email;[m
[32m+[m[32m        fakeUser.user_metadata.full_name = name;[m
[32m+[m[32m        const fakeSession = createDevBypassSession(fakeUser);[m
[32m+[m[41m        [m
[32m+[m[32m        currentUser = fakeUser;[m
[32m+[m[32m        currentSession = fakeSession;[m
[32m+[m[41m        [m
[32m+[m[32m        return {[m
[32m+[m[32m            success: true,[m
[32m+[m[32m            requiresConfirmation: false,[m
[32m+[m[32m            user: fakeUser[m
[32m+[m[32m        };[m
[32m+[m[32m    }[m
[32m+[m
     try {[m
         console.log('📝 Signing up user:', email);[m
         [m
[36m@@ -220,6 +239,27 @@[m [mexport async function handleSignUp(name, email, password) {[m
  * Handle user sign-in[m
  */[m
 export async function handleSignIn(email, password) {[m
[32m+[m[32m    // DEV BYPASS CHECK[m
[32m+[m[32m    if (isDevBypassActive()) {[m
[32m+[m[32m        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign in (DEV ONLY)');[m
[32m+[m[41m        [m
[32m+[m[32m        // Create fake user if not exists (or reuse existing dev user logic)[m
[32m+[m[32m        if (!currentUser) {[m
[32m+[m[32m            const fakeUser = createDevBypassUser();[m
[32m+[m[32m            fakeUser.email = email; // Use entered email for realism[m
[32m+[m[32m            const fakeSession = createDevBypassSession(fakeUser);[m
[32m+[m[41m            [m
[32m+[m[32m            currentUser = fakeUser;[m
[32m+[m[32m            currentSession = fakeSession;[m
[32m+[m[32m        }[m
[32m+[m[41m        [m
[32m+[m[32m        return {[m
[32m+[m[32m            success: true,[m
[32m+[m[32m            user: currentUser,[m
[32m+[m[32m            session: currentSession[m
[32m+[m[32m        };[m
[32m+[m[32m    }[m
[32m+[m
     try {[m
         console.log('🔐 Signing in user:', email);[m
         [m
[36m@@ -274,6 +314,14 @@[m [mexport async function handleSignIn(email, password) {[m
  * Handle user sign-out[m
  */[m
 export async function handleSignOut() {[m
[32m+[m[32m    // DEV BYPASS CHECK[m
[32m+[m[32m    if (isDevBypassActive()) {[m
[32m+[m[32m        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign out (DEV ONLY)');[m
[32m+[m[32m        currentUser = null;[m
[32m+[m[32m        currentSession = null;[m
[32m+[m[32m        return { success: true };[m
[32m+[m[32m    }[m
[32m+[m
     try {[m
         console.log('👋 Signing out user');[m
         [m
[36m@@ -379,10 +427,15 @@[m [masync function createUserProfile(userId, name, email) {[m
  */[m
 export async function getUserProfile(userId) {[m
     // DEV BYPASS: Return fake profile for dev bypass users (no DB access)[m
[31m-    if (isDevBypassActive() && currentUser && currentUser.id.startsWith('dev-bypass-user-')) {[m
[32m+[m[32m    // Check if userId is provided and matches current dev user OR if dev bypass is simply active[m
[32m+[m[32m    // This ensures getProfile works even if called with ID directly[m
[32m+[m[32m    if (isDevBypassActive() && ([m
[32m+[m[32m        (currentUser && currentUser.id.startsWith('dev-bypass-user-')) ||[m[41m [m
[32m+[m[32m        (typeof userId === 'string' && userId.startsWith('dev-bypass-user-'))[m
[32m+[m[32m    )) {[m
         console.log('🔧 DEV BYPASS: Returning fake profile for dev bypass user');[m
         return {[m
[31m-            id: currentUser.id,[m
[32m+[m[32m            id: userId || currentUser?.id,[m
             email: 'dev@phasee.local',[m
             full_name: 'Dev User',[m
             display_name: 'Dev User',[m
[36m@@ -502,7 +555,10 @@[m [mexport async function hasCompletedOnboarding(userId) {[m
     console.log('🔍 isDevBypassActive():', isDevBypassActive());[m
     [m
     // DEV BYPASS: Always return true for dev bypass users (skip onboarding)[m
[31m-    if (isDevBypassActive() && currentUser && currentUser.id.startsWith('dev-bypass-user-')) {[m
[32m+[m[32m    if (isDevBypassActive() && ([m
[32m+[m[32m        (currentUser && currentUser.id.startsWith('dev-bypass-user-')) ||[m
[32m+[m[32m        (typeof userId === 'string' && userId.startsWith('dev-bypass-user-'))[m
[32m+[m[32m    )) {[m
         console.log('🔧 DEV BYPASS: Returning true for onboarding check');[m
         return true;[m
     }[m
[36m@@ -564,7 +620,10 @@[m [mexport async function startTrial(userId) {[m
  */[m
 export async function isTrialExpired(userId) {[m
     // DEV BYPASS: Always return false for dev bypass users (trial never expires)[m
[31m-    if (isDevBypassActive() && currentUser && currentUser.id.startsWith('dev-bypass-user-')) {[m
[32m+[m[32m    if (isDevBypassActive() && ([m
[32m+[m[32m        (currentUser && currentUser.id.startsWith('dev-bypass-user-')) ||[m
[32m+[m[32m        (typeof userId === 'string' && userId.startsWith('dev-bypass-user-'))[m
[32m+[m[32m    )) {[m
         console.log('🔧 DEV BYPASS: Returning false for trial expiration check');[m
         return false;[m
     }[m
[36m@@ -594,7 +653,10 @@[m [mexport async function isTrialExpired(userId) {[m
  */[m
 export async function hasActiveSubscription(userId) {[m
     // DEV BYPASS: Always return true for dev bypass users (allows full access)[m
[31m-    if (isDevBypassActive() && currentUser && currentUser.id.startsWith('dev-bypass-user-')) {[m
[32m+[m[32m    if (isDevBypassActive() && ([m
[32m+[m[32m        (currentUser && currentUser.id.startsWith('dev-bypass-user-')) ||[m
[32m+[m[32m        (typeof userId === 'string' && userId.startsWith('dev-bypass-user-'))[m
[32m+[m[32m    )) {[m
         console.log('🔧 DEV BYPASS: Returning true for subscription check');[m
         return true;[m
     }[m
