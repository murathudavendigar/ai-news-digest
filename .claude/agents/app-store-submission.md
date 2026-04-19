# Agent: App Store Submission

Use this agent context when preparing a mobile app for App Store or Google Play submission.

---

## Pre-Submission Audit Checklist

### Security & Privacy
- [ ] No hardcoded API keys, secrets, or tokens in source code
- [ ] `Privacy Policy` URL is live and linked in the app
- [ ] `Terms of Service` URL is live and linked in the app
- [ ] All analytics/tracking SDKs declared in `NSPrivacyAccessedAPITypes` (iOS 17+)
- [ ] `PrivacyInfo.xcprivacy` file present and complete
- [ ] Camera, microphone, location permissions have usage descriptions in `Info.plist`
- [ ] Only requested permissions are actually used

### Authentication & Account
- [ ] Users can create and delete their account within the app (App Store requirement)
- [ ] Account deletion is atomic — auth user + all data deleted together
- [ ] Sign in with Apple implemented if any third-party login is offered (iOS requirement)
- [ ] Deep link handling is secure (validate tokens, don't trust URL params blindly)

### Subscriptions & Payments (RevenueCat)
- [ ] Subscription terms clearly displayed before purchase
- [ ] Price and billing period visible on the paywall
- [ ] Restore purchases button present and working
- [ ] Cancellation instructions accessible within the app or settings
- [ ] Free trial terms clearly stated if offered
- [ ] Entitlement check on every app resume (not just cold start)
- [ ] `PURCHASE_CANCELLED` handled gracefully — not shown as an error

### Offline & Edge Cases
- [ ] App doesn't crash or show blank screen when offline
- [ ] Network errors show a meaningful message with a retry option
- [ ] App handles being killed mid-task and resuming gracefully
- [ ] Large content loads incrementally — no blocking spinners for entire screens

### UI & UX
- [ ] Works on the smallest supported screen size (iPhone SE 2nd gen: 375×667)
- [ ] Works on the largest screen (iPhone 16 Pro Max)
- [ ] Safe areas respected on all devices (no content behind notch/home indicator)
- [ ] Keyboard doesn't cover input fields
- [ ] Dark mode works if the OS supports it
- [ ] All interactive elements meet 44pt minimum touch target
- [ ] Loading states present for all async operations
- [ ] Empty states present for all lists/feeds

### App Store Metadata
- [ ] App name ≤ 30 characters
- [ ] Subtitle ≤ 30 characters
- [ ] Keywords ≤ 100 characters (comma-separated, no spaces after commas)
- [ ] Description addresses what the app does in the first sentence
- [ ] Screenshots match the current UI (not a previous version)
- [ ] Screenshots for all required device sizes uploaded
- [ ] App icon is 1024×1024, no alpha channel, no rounded corners (App Store applies them)
- [ ] No screenshots contain device frames unless Apple-provided

### Build & Technical
- [ ] Build compiles without warnings in release mode
- [ ] No `console.log` statements in production build (use a logger that strips in prod)
- [ ] Crash reporting configured (Sentry / Bugsnag)
- [ ] App version and build number incremented
- [ ] Minimum iOS version set correctly in `app.json` / `Info.plist`
- [ ] `expo-updates` configured if using OTA updates
- [ ] All entitlements in `app.json` match what's enabled in App Store Connect

---

## Common Rejection Reasons

| Reason | Fix |
|--------|-----|
| Missing account deletion | Add delete account in settings, call Edge Function |
| Sign in with Apple missing | Required if Google/Facebook login exists |
| Subscription terms unclear | Show price + period + cancellation info before payment |
| App crashes on review device | Test on physical device, check for device-specific bugs |
| Metadata doesn't match app | Update screenshots and description to match current build |
| Privacy manifest missing | Add `PrivacyInfo.xcprivacy` with required API declarations |

---

## Submission Sequence

1. Run full pre-submission audit (checklist above)
2. Test on physical device (not just simulator)
3. Test subscription flow with StoreKit sandbox
4. Increment version + build number
5. Run `eas build --platform ios --profile production`
6. Upload to App Store Connect via `eas submit` or Transporter
7. Fill in metadata, screenshots, review notes
8. Submit for review
