import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const CreateGroupScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  // Accept selected DM userIds from params
  const selectedUserIds = route?.params?.selectedUserIds || [];

  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Missing Info', 'Please enter a group name.');
      return;
    }
    setCreating(true);
    try {
      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim(),
          description: groupDesc.trim(),
          created_by: user?.id,
        })
        .select()
        .single();
      if (groupError) throw groupError;
      // Add creator as admin
      await supabase.from('group_members').insert({
        group_id: groupData.id,
        user_id: user?.id,
        is_admin: true,
      });
      // Add selected DM users as members
      for (const uid of selectedUserIds) {
        await supabase.from('group_members').insert({
          group_id: groupData.id,
          user_id: uid,
          is_admin: false,
        });
      }
      Alert.alert('Success', 'Group created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Group</Text>
      <TextInput
        style={styles.input}
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Group Description (optional)"
        value={groupDesc}
        onChangeText={setGroupDesc}
        multiline
        numberOfLines={3}
      />
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateGroup}
        disabled={creating}
      >
        <Text style={styles.createButtonText}>{creating ? 'Creating...' : 'Create Group'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827', marginBottom: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  createButton: { backgroundColor: '#38bdf8', borderRadius: 8, padding: 16, alignItems: 'center' },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
