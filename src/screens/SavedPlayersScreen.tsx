import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { User, Trash2 } from 'lucide-react-native';

export const SavedPlayersScreen = () => {
  const [savedPlayers, setSavedPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadSavedPlayers();
  }, []);

  const loadSavedPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_players')
        .select(`
          id,
          saved_user:profiles!saved_players_saved_user_id_fkey(
            id,
            display_name,
            avatar_url,
            average_rating,
            total_ratings
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPlayers(data || []);
    } catch (error: any) {
      console.error('Error loading saved players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    Alert.alert(
      'Remove Player',
      'Are you sure you want to remove this player from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('saved_players')
                .delete()
                .eq('id', id);

              if (error) throw error;
              loadSavedPlayers();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderPlayer = ({ item }: any) => (
    <View style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <View style={styles.avatar}>
          <User size={24} color="#94a3b8" />
        </View>
        <View style={styles.playerDetails}>
          <Text style={styles.playerName}>
            {item.saved_user?.display_name || 'Unknown Player'}
          </Text>
          <Text style={styles.playerRating}>
            ⭐ {item.saved_user?.average_rating?.toFixed(1) || '0.0'} ({item.saved_user?.total_ratings || 0})
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemove(item.id)}
      >
        <Trash2 size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Players</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={savedPlayers}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved players yet</Text>
            <Text style={styles.emptySubtext}>
              Save players you'd like to play with again!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 28,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 28,
  },
  list: {
    padding: 16,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  playerRating: {
    fontSize: 14,
    color: '#6b7280',
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

