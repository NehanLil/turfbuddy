# Supabase Real-Time WebSocket Setup Guide 🔥

This guide explains how to set up and use Supabase real-time subscriptions (WebSockets) in your React Native app.

## 🌐 What is Supabase Realtime?

Supabase Realtime uses **WebSockets** to listen to database changes in real-time. When data changes in your PostgreSQL database, your app automatically receives updates without polling!

### How It Works:
```
Database Change → Supabase Server → WebSocket Connection → Your App → UI Update
```

---

## ⚙️ Step 1: Enable Realtime in Supabase Dashboard

### 1. Go to your Supabase Dashboard
   - URL: https://supabase.com/dashboard/project/tbvoodbrzgfkhemvkcvq

### 2. Enable Realtime for your tables:
   
   **Navigate to**: Database → Replication
   
   Enable replication for these tables:
   - ✅ `game_plans`
   - ✅ `messages`
   - ✅ `plan_participants`
   - ✅ `join_requests`
   - ✅ `profiles`

   **How to enable:**
   - Click on each table
   - Toggle "Enable Realtime" to ON
   - Click "Save"

### 3. Set Row Level Security (RLS) Policies

Make sure your tables have proper RLS policies:

```sql
-- For messages table (already done, but verify)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read messages from plans they're part of
CREATE POLICY "Users can view messages from their plans"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plan_participants pp
    WHERE pp.plan_id = messages.plan_id 
    AND pp.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM game_plans gp
    WHERE gp.id = messages.plan_id 
    AND gp.organizer_id = auth.uid()
  )
);

-- Allow users to insert messages to plans they're part of
CREATE POLICY "Users can send messages to their plans"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plan_participants pp
    WHERE pp.plan_id = messages.plan_id 
    AND pp.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM game_plans gp
    WHERE gp.id = messages.plan_id 
    AND gp.organizer_id = auth.uid()
  )
);
```

---

## 🔌 Step 2: Client Configuration (Already Done!)

Your Supabase client in `mobile/src/lib/supabase.ts` is configured with:

```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Throttle events to prevent overwhelming the app
    },
  },
});
```

---

## 📡 Step 3: Using Real-Time Subscriptions

### Example 1: Listen to New Messages (ChatViewScreen)

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`plan-${planId}-messages`)  // Unique channel name
    .on(
      'postgres_changes',
      {
        event: 'INSERT',           // Listen for new rows
        schema: 'public',          // Database schema
        table: 'messages',         // Table name
        filter: `plan_id=eq.${planId}`, // Filter by plan_id
      },
      async (payload) => {
        // Handle the new message
        console.log('New message received:', payload.new);
        
        // Fetch full message with relations
        const { data } = await supabase
          .from('messages')
          .select('*, profiles(*)')
          .eq('id', payload.new.id)
          .single();
          
        if (data) {
          setMessages(prev => [...prev, data]);
        }
      }
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, [planId]);
```

### Example 2: Listen to Multiple Events

```typescript
const channel = supabase
  .channel('game-plans-changes')
  .on(
    'postgres_changes',
    {
      event: '*',              // Listen to INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'game_plans',
    },
    (payload) => {
      console.log('Change received!', payload);
      
      if (payload.eventType === 'INSERT') {
        // Handle new plan
      } else if (payload.eventType === 'UPDATE') {
        // Handle plan update
      } else if (payload.eventType === 'DELETE') {
        // Handle plan deletion
      }
    }
  )
  .subscribe();
```

### Example 3: Listen to Multiple Tables

```typescript
const channel = supabase
  .channel('my-plans-updates')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'game_plans' },
    handleGamePlanChange
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'plan_participants' },
    handleParticipantChange
  )
  .subscribe();
```

---

## 🎯 Step 4: Real-Time Patterns Used in This App

### ✅ 1. **ChatViewScreen** - Real-time chat messages
- Listens to: `messages` table
- Events: `INSERT`
- Auto-updates when new messages arrive

### ✅ 2. **MessagesScreen** - Chat list updates
- Listens to: `messages` table
- Events: `INSERT`, `UPDATE`
- Updates last message preview in real-time

### ✅ 3. **DashboardScreen** - Live game plan updates
- Listens to: `game_plans` table
- Events: `INSERT`, `UPDATE`, `DELETE`
- Shows new plans as they're created

### ✅ 4. **ExploreScreen** - Live search results
- Listens to: `game_plans` table
- Events: `INSERT`, `UPDATE`
- Updates available plans in real-time

### ✅ 5. **MyPlansScreen** - My plans & requests
- Listens to: `game_plans`, `join_requests`, `plan_participants`
- Events: `*` (all events)
- Updates created/joined plans and requests

---

## 🐛 Debugging Real-Time

### Check Connection Status:

```typescript
const channel = supabase.channel('my-channel');

channel.subscribe((status) => {
  console.log('Realtime status:', status);
  
  if (status === 'SUBSCRIBED') {
    console.log('✅ Successfully connected to realtime!');
  } else if (status === 'CHANNEL_ERROR') {
    console.log('❌ Error connecting to realtime');
  } else if (status === 'TIMED_OUT') {
    console.log('⏱️ Realtime connection timed out');
  } else if (status === 'CLOSED') {
    console.log('🔌 Realtime connection closed');
  }
});
```

### Enable Realtime Logs:

Add to your Supabase client config:

```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  // ... other config
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    log_level: 'debug', // Shows all realtime events in console
  },
});
```

---

## 🚀 Performance Tips

### 1. **Use Specific Filters**
```typescript
// ✅ Good - filters on server
filter: `plan_id=eq.${planId}`

// ❌ Bad - receives all rows, filters on client
// Don't filter in .on() callback
```

### 2. **Cleanup Subscriptions**
Always cleanup when component unmounts:
```typescript
return () => {
  supabase.removeChannel(channel);
};
```

### 3. **Throttle Updates**
Already configured with `eventsPerSecond: 10` to prevent overwhelming the UI.

### 4. **Use Unique Channel Names**
Prevents conflicts between different screens:
```typescript
// Good
supabase.channel(`chat-${planId}`)
supabase.channel(`dashboard-${userId}`)
```

---

## 📊 Real-Time Events Payload Structure

When a change occurs, you receive:

```typescript
{
  commit_timestamp: "2023-10-23T10:30:00Z",
  eventType: "INSERT" | "UPDATE" | "DELETE",
  new: { /* new row data */ },
  old: { /* old row data (for UPDATE/DELETE) */ },
  schema: "public",
  table: "messages",
}
```

### Access the data:
```typescript
.on('postgres_changes', {}, (payload) => {
  console.log('Event type:', payload.eventType);
  console.log('New data:', payload.new);
  console.log('Old data:', payload.old);  // Only for UPDATE/DELETE
})
```

---

## 🔒 Security Notes

1. **RLS is enforced** - Users only receive updates for data they have access to
2. **Auth required** - Realtime connections use your JWT token
3. **Automatic reconnection** - Supabase handles reconnection if connection drops
4. **Rate limiting** - Configured with `eventsPerSecond` to prevent abuse

---

## ✅ Verification Checklist

- [ ] Realtime enabled in Supabase Dashboard for all tables
- [ ] RLS policies set up correctly
- [ ] Supabase client configured with realtime settings
- [ ] Channel subscriptions implemented in screens
- [ ] Cleanup functions added to useEffect
- [ ] Connection status monitoring (optional)
- [ ] Tested with multiple devices/users

---

## 🎉 You're All Set!

Your app now has **real-time WebSocket connections** powered by Supabase! 

Changes in the database will automatically appear in your app without any manual refresh. This works great for:
- 💬 Live chat messages
- 🎮 Game plan updates
- 👥 Join requests
- 📢 Notifications
- 🔄 Any collaborative features

Happy coding! 🚀


