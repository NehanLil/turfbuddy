# Turf Mobile App - Setup Guide

## Quick Start

Your mobile app is ready to run! Follow these steps:

### 1. Navigate to the mobile2 folder
```bash
cd mobile2
```

### 2. Start the development server
```bash
npm start
```

### 3. Run on your device

**Option A: Using Expo Go app (Recommended for testing)**
1. Download "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in the terminal
3. The app will load on your device

**Option B: Android Emulator**
```bash
npm run android
```

**Option C: iOS Simulator (Mac only)**
```bash
npm run ios
```

## What's Included

✅ **Complete Feature Parity with Web App**
- All screens ported from web to mobile
- Same Supabase backend
- Authentication with persistent sessions
- Browse and create game plans
- Join requests
- Profile management

✅ **Mobile-Optimized UI**
- Native iOS and Android components
- Touch-friendly interfaces
- Responsive layouts
- Bottom tab navigation
- Stack navigation for details

✅ **Database Integration**
- Same Supabase instance as web app
- All data synced across platforms
- Real-time capabilities ready

## Testing Checklist

### Authentication
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Session persists after app restart
- [ ] Sign out works correctly

### Game Plans
- [ ] View list of available game plans
- [ ] Filter by sport
- [ ] Search game plans
- [ ] View plan details
- [ ] Create new game plan
- [ ] Send join request

### My Plans
- [ ] View organized plans
- [ ] View joined plans
- [ ] Switch between tabs

### Profile
- [ ] View profile information
- [ ] Update display name
- [ ] Update city and college
- [ ] Save changes

## Architecture

```
App.tsx (Entry Point)
  └─ SafeAreaProvider
      └─ AuthProvider (Authentication Context)
          └─ AppNavigator (Navigation)
              ├─ Auth Stack (Unauthenticated)
              │   └─ AuthScreen
              └─ Main Stack (Authenticated)
                  ├─ MainTabs (Bottom Tabs)
                  │   ├─ HomeScreen
                  │   ├─ ExploreScreen
                  │   ├─ MyPlansScreen
                  │   └─ ProfileScreen
                  ├─ CreatePlanScreen
                  └─ PlanDetailsScreen
```

## Key Files

- `App.tsx` - Main app component with providers
- `src/lib/supabase.ts` - Supabase client configuration
- `src/hooks/useAuth.tsx` - Authentication context and hooks
- `src/navigation/AppNavigator.tsx` - Navigation structure
- `src/screens/` - All screen components
- `src/types/database.ts` - TypeScript types from Supabase

## Environment

The app connects to your production Supabase instance:
- **URL**: https://tbvoodbrzgfkhemvkcvq.supabase.co
- **Tables**: game_plans, profiles, join_requests, plan_participants, messages

## Troubleshooting

**App won't start?**
- Clear Expo cache: `npm start --clear` or `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Can't connect to Supabase?**
- Check your internet connection
- Verify Supabase credentials in `src/lib/supabase.ts`

**Navigation not working?**
- Make sure all navigation dependencies are installed
- Restart the development server

## Next Steps

### Recommended Enhancements
1. **Location Features**
   - Add Google Maps integration
   - Location-based filtering
   - Map view of game plans

2. **Push Notifications**
   - Join request notifications
   - Game reminders

3. **Enhanced Chat**
   - Real-time messaging
   - Plan-specific chat rooms

4. **Images**
   - Profile pictures
   - Game plan photos

5. **Payments**
   - In-app payment integration
   - Payment tracking

## Production Build

When ready to deploy:

**Android**
```bash
expo build:android
```

**iOS**
```bash
expo build:ios
```

Or use EAS Build for modern builds:
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## Support

For issues or questions:
1. Check the README.md
2. Review Expo documentation: https://docs.expo.dev
3. Check React Navigation docs: https://reactnavigation.org
4. Supabase docs: https://supabase.com/docs

