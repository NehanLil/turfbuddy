# Turf Mobile App

React Native mobile app for the Turf platform - find and organize sports games with friends.

## Features

✅ **Authentication**
- Sign up / Sign in with email & password
- Supabase authentication with AsyncStorage persistence

✅ **Game Plans**
- Browse available game plans
- Create new game plans
- View plan details
- Send join requests
- Filter by sport and search

✅ **My Plans**
- View organized plans
- View joined plans
- Track plan status

✅ **Profile Management**
- Update display name, city, college
- Add phone number
- Sign out

✅ **Navigation**
- Bottom tabs for main screens
- Stack navigation for details
- Protected routes for authenticated users

## Tech Stack

- **Framework**: Expo / React Native
- **Language**: TypeScript
- **Database**: Supabase
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Storage**: AsyncStorage
- **UI**: React Native built-in components

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on Android:
```bash
npm run android
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Web:
```bash
npm run web
```

## Project Structure

```
mobile2/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── types/
│   │   └── database.ts          # Database type definitions
│   ├── hooks/
│   │   └── useAuth.tsx          # Auth context and hook
│   ├── screens/
│   │   ├── AuthScreen.tsx       # Login/Signup
│   │   ├── HomeScreen.tsx       # Browse game plans
│   │   ├── ExploreScreen.tsx    # Map-based exploration
│   │   ├── CreatePlanScreen.tsx # Create new plans
│   │   ├── PlanDetailsScreen.tsx# View plan details
│   │   ├── MyPlansScreen.tsx    # User's plans
│   │   └── ProfileScreen.tsx    # User profile
│   └── navigation/
│       └── AppNavigator.tsx     # Navigation setup
├── App.tsx                       # Main app component
├── index.ts                      # Entry point
└── package.json
```

## Database

Connected to the same Supabase instance as the web app:
- **game_plans**: Sports game events
- **profiles**: User profiles
- **join_requests**: Join requests for game plans
- **plan_participants**: Confirmed participants
- **messages**: Chat messages (future)

## Features Comparison with Web App

| Feature | Web | Mobile |
|---------|-----|--------|
| Authentication | ✅ | ✅ |
| Browse Games | ✅ | ✅ |
| Create Plans | ✅ | ✅ |
| Join Requests | ✅ | ✅ |
| Profile Management | ✅ | ✅ |
| Location Filtering | ✅ | 🔄 Coming |
| Google Maps | ✅ | 🔄 Coming |
| Chat/Messages | ✅ | 🔄 Coming |

## Notes

- The app uses the same Supabase backend as the web app
- All data is synced across platforms
- Authentication state persists using AsyncStorage
- Built with Expo for easy development and deployment

