# 🔧 UPSERT DUPLICATE KEY FIX

## ⚠️ Error Fixed:
```
duplicate key value violates unique constraint "user_preferences_user_id_key"
```

## ✅ **What Was Fixed:**

The error happened because when inserting preferences, if a row already existed for that `user_id`, it would try to insert again instead of updating.

### **Fixed Files:**

1. **`PreferencesQuizScreen.tsx`** - Quiz submit & skip
2. **`CommunicationPreferencesScreen.tsx`** - Save preferences

### **The Fix:**

Changed from:
```typescript
await supabase
  .from('user_preferences')
  .upsert({
    user_id: user?.id,
    // ... other fields
  });
```

To:
```typescript
await supabase
  .from('user_preferences')
  .upsert(
    {
      user_id: user?.id,
      // ... other fields
    },
    {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    }
  );
```

This tells Supabase:
- If `user_id` already exists → **UPDATE** the row
- If `user_id` doesn't exist → **INSERT** new row
- Don't ignore duplicates, merge the data

---

## ✅ **What Works Now:**

1. **First time filling quiz:**
   - Creates new row ✅
   
2. **Filling quiz again:**
   - Updates existing row (no error!) ✅
   
3. **Skipping quiz:**
   - Creates/updates with `quiz_seen: true` ✅
   
4. **Changing communication preferences:**
   - Updates existing preferences ✅

---

## 🚀 **No Migration Needed!**

This is a **code-only fix**. Just:

```bash
cd mobile
npx expo start --clear
```

The app will now properly handle upserts without duplicate key errors!

---

## 📝 **Summary:**

| Before | After |
|--------|-------|
| Insert fails if row exists | Updates existing row |
| Duplicate key error | ✅ Works perfectly |
| Quiz breaks on retry | ✅ Can fill multiple times |

**Error completely fixed! 🎉**

