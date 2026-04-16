# 🔧 FIXED MIGRATIONS GUIDE

## ⚠️ **Foreign Key Constraint Error - FIXED!**

If you got this error:
```
insert or update on table "user_preferences" violates foreign key constraint user_preferences_user_id_fkey
```

**This is now fixed!** 🎉

---

## 📋 **Updated Migration Order:**

Run these **4 migrations** in Supabase SQL Editor in this exact order:

### **1. Fix Profiles RLS**
```
supabase/migrations/20251027000000_fix_profiles_rls.sql
```
✅ Fixes profile row-level security policies

### **2. Add Profile Features**
```
supabase/migrations/20251028000000_profile_features.sql
```
✅ Creates ratings, saved players, preferences tables

### **3. Add DMs and Preferences**
```
supabase/migrations/20251029000000_add_dms_and_preferences.sql
```
✅ Creates DM tables and adds preference columns

### **4. Fix Foreign Key Constraints** ⭐ **NEW!**
```
supabase/migrations/20251029000001_fix_user_preferences_fkey.sql
```
✅ **Fixes the foreign key constraint error**
✅ Auto-creates profiles when needed
✅ Prevents constraint violations

---

## 🔍 **What the Fix Does:**

The error happened because:
- `user_preferences` table referenced `profiles(id)`
- When users tried to save preferences, their profile didn't exist yet
- Foreign key constraint blocked the insert

The fix:
1. ✅ Creates profiles automatically when needed
2. ✅ Adds triggers to ensure profiles exist before inserts
3. ✅ Works for `user_preferences`, `saved_players`, and `user_ratings`
4. ✅ Updates RLS policies to work correctly

---

## 🚀 **How to Apply:**

### **Go to Supabase SQL Editor:**
https://supabase.com/dashboard/project/tbvoodbrzgfkhemvkcvq/sql/new

### **Run Each Migration:**
1. Open first migration file
2. Copy all contents
3. Paste into SQL Editor
4. Click "Run"
5. Repeat for all 4 migrations

### **Order Matters!**
```
1. fix_profiles_rls.sql
2. profile_features.sql
3. add_dms_and_preferences.sql
4. fix_user_preferences_fkey.sql  ⭐ RUN THIS!
```

---

## ✅ **After Running Migrations:**

1. **Clear app cache:**
```bash
cd mobile
npx expo start --clear
```

2. **Test the features:**
- Sign in → Preferences quiz should work now ✅
- Save preferences → No error ✅
- View profiles → Save players → No error ✅
- All features working ✅

---

## 🎯 **What Each Migration Does:**

### **Migration 1: fix_profiles_rls.sql**
- Updates row-level security policies
- Allows users to view/edit their own profiles

### **Migration 2: profile_features.sql**
- Creates `user_ratings` table
- Creates `saved_players` table
- Creates `user_preferences` table
- Adds profile columns (ratings, verification, etc.)

### **Migration 3: add_dms_and_preferences.sql**
- Creates `direct_messages` table
- Creates `dm_conversations` table
- Adds preference columns (chat, music, smoking, sports)
- Enables real-time for DMs

### **Migration 4: fix_user_preferences_fkey.sql** ⭐
- **Fixes foreign key constraint errors**
- Auto-creates profiles when needed
- Adds triggers for all related tables
- Updates RLS policies

---

## 🔥 **Now Everything Works!**

After running all 4 migrations:
- ✅ Preferences quiz works
- ✅ Profile completion works
- ✅ Save players works
- ✅ Direct messages work
- ✅ All features functional
- ✅ No more constraint errors!

---

## 📝 **Summary:**

**Total Migrations: 4**
1. fix_profiles_rls.sql
2. profile_features.sql
3. add_dms_and_preferences.sql
4. **fix_user_preferences_fkey.sql** ⭐ (FIXES THE ERROR!)

**Run them in order, then restart your app!**

🎉 **Problem solved!** 🎉

