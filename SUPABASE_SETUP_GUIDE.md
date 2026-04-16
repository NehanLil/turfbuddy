# 🚀 Fresh Supabase Setup Guide

## ✅ Step 1: Create New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: turfbuddy-mobile (or whatever you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup...

---

## 📝 Step 2: Run Migration Files

### Go to SQL Editor:
https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

### Run each file in order:

#### 1️⃣ First Migration:
- Open `supabase/migrations/01_create_enums_and_profiles.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"** (or press Ctrl+Enter)

#### 2️⃣ Second Migration:
- Open `supabase/migrations/02_create_groups.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"**

#### 3️⃣ Third Migration:
- Open `supabase/migrations/03_create_game_plans.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"**

#### 4️⃣ Fourth Migration:
- Open `supabase/migrations/04_setup_realtime.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"**

---

## 🔌 Step 3: Enable Realtime

1. Go to **Database → Replication** in your Supabase dashboard
2. Enable replication for these tables (toggle each ON):
   - ✅ `game_plans`
   - ✅ `messages`
   - ✅ `plan_participants`
   - ✅ `join_requests`
   - ✅ `group_messages`
   - ✅ `profiles`

---

## 🔑 Step 4: Get Your Credentials

1. Go to **Settings → API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

---

## 📱 Step 5: Update Your App

Update `src/lib/supabase.ts` with your new credentials:

```typescript
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'your-anon-key-here'
```

---

## 🎯 Step 6: Test It!

```bash
cd mobile
npx expo start
```

Create an account and start using the app!

---

## 📊 What Was Created:

**8 Tables:**
- `profiles` - User profiles
- `game_plans` - Sports game events
- `plan_participants` - Who joined which plans
- `join_requests` - Pending join requests
- `messages` - Plan chat messages
- `groups` - User groups
- `group_members` - Group membership
- `group_messages` - Group chat messages

**Features:**
- ✅ Row Level Security (RLS) on all tables
- ✅ Auto-create profile on signup
- ✅ Auto-add organizer to their plans
- ✅ Auto-update player counts
- ✅ Realtime subscriptions ready
- ✅ Proper foreign keys & relationships
- ✅ Indexes for performance

---

## 📝 Database Schema Overview:

```
auth.users (Supabase Auth)
    ↓
profiles (user_id → auth.users.id)
    ↓
game_plans (organizer_id → profiles.user_id)
    ↓
├── plan_participants (plan_id, user_id)
├── join_requests (plan_id, user_id)
└── messages (plan_id, user_id)

groups (created_by → profiles.user_id)
    ↓
├── group_members (group_id, user_id)
└── group_messages (group_id, user_id)
```

---

## 🐛 Troubleshooting:

**Error: "relation already exists"**
- Your database already has some tables. Drop them or use a fresh project.

**Error: "permission denied"**
- Make sure you're running migrations as the postgres user in SQL Editor.

**Realtime not working?**
- Check Database → Replication is enabled for all tables
- Verify RLS policies allow your user to SELECT from tables

**App can't connect?**
- Double-check your URL and anon key in `src/lib/supabase.ts`
- Make sure the URL starts with `https://`
- Verify the anon key is the **anon/public** key, not service_role key

---

## 🎉 You're Done!

Your Supabase database is now fully configured and ready to use!
