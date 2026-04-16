import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { User, MessageCircle, Crown } from 'lucide-react-native';

export const GroupInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { groupId } = route.params as { groupId: string };

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadGroupInfo();
  }, [groupId, user]);

  const loadGroupInfo = async () => {
    setLoading(true);
    try {
      // Get group info
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      setGroup(groupData);

      // Get members
      const { data: memberRows } = await supabase
        .from('group_members')
        .select('user_id, is_admin, profiles:profiles!group_members_user_id_fkey(display_name, avatar_url)')
        .eq('group_id', groupId);
      setMembers(memberRows || []);

      // Check if current user is admin
      setIsAdmin(!!memberRows?.find(m => m.user_id === user?.id && m.is_admin));
    } catch (error) {
      Alert.alert('Error', 'Failed to load group info.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.groupName}>{group?.name}</Text>
        <Text style={styles.groupDesc}>{group?.description}</Text>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Crown size={18} color="#fbbf24" />
            <Text style={styles.adminText}>You are an admin</Text>
          </View>
        )}
      </View>
      <Text style={styles.sectionTitle}>Members</Text>
      {members.map((m) => (
        <TouchableOpacity
          key={m.user_id}
          style={styles.memberRow}
          onPress={() => navigation.navigate('ProfileScreen', { userId: m.user_id })}
        >
          {m.profiles?.avatar_url ? (
            <Image source={{ uri: m.profiles.avatar_url }} style={styles.avatar} />
          ) : (
            <User size={32} color="#94a3b8" />
          )}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{m.profiles?.display_name || 'User'}</Text>
            {m.is_admin && (
              <Text style={styles.adminLabel}>Admin</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.dmButton}
            onPress={() => navigation.navigate('DMChat', { userId: m.user_id, userName: m.profiles?.display_name })}
          >
            <MessageCircle size={20} color="#38bdf8" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', marginBottom: 8 },
  groupName: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  groupDesc: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  adminText: { marginLeft: 6, color: '#fbbf24', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginLeft: 16, marginTop: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 6, padding: 12, borderRadius: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, color: '#111827', fontWeight: '500' },
  adminLabel: { fontSize: 12, color: '#38bdf8', fontWeight: '600' },
  dmButton: { padding: 6 },
});
