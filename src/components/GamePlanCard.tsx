import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface GamePlan {
  id: string;
  sport: string;
  location: string;
  date: string;
  time: string;
  totalCost: number;
  maxPlayers: number;
  currentPlayers: number;
  organizer: string;
  organizerInitials: string;
  status: 'open' | 'full' | 'closed';
}

interface GamePlanCardProps {
  plan: GamePlan;
  onJoin?: (planId: string) => void;
  showJoinButton?: boolean;
}

const sportEmojis: Record<string, string> = {
  football: '⚽',
  cricket: '🏏',
  badminton: '🏸',
  basketball: '🏀',
  tennis: '🎾',
  volleyball: '🏐',
  'table tennis': '🏓',
};

export const GamePlanCard: React.FC<GamePlanCardProps> = ({ 
  plan, 
  onJoin, 
  showJoinButton = true 
}) => {
  const navigation = useNavigation();
  const costPerPlayer = Math.ceil(plan.totalCost / plan.maxPlayers);
  const spotsLeft = plan.maxPlayers - plan.currentPlayers;
  const sportKey = plan.sport.toLowerCase().replace(/\s+/g, ' ');
  const sportEmoji = sportEmojis[sportKey] || '🏃';

  const getStatusColor = () => {
    switch (plan.status) {
      case 'open':
        return '#10b981';
      case 'full':
        return '#6b7280';
      case 'closed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => (navigation as any).navigate('PlanDetails', { planId: plan.id })}
      activeOpacity={0.7}
    >
      {/* Sport Header Indicator */}
      <View style={[styles.headerIndicator, { backgroundColor: '#38bdf8' }]} />
      
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>{sportEmoji}</Text>
          <View style={styles.headerText}>
            <Text style={styles.sport} numberOfLines={1}>{plan.sport}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.location} numberOfLines={1}>{plan.location}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {plan.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.content}>
        {/* Time & Date */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={[styles.iconBox, { backgroundColor: '#38bdf820' }]}>
              <Text style={styles.infoIcon}>📅</Text>
            </View>
            <Text style={styles.infoText}>{plan.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.iconBox, { backgroundColor: '#8b5cf620' }]}>
              <Text style={styles.infoIcon}>🕐</Text>
            </View>
            <Text style={styles.infoText}>{plan.time}</Text>
          </View>
        </View>

        {/* Players & Cost */}
        <View style={styles.playersAndCost}>
          <View style={styles.playersInfo}>
            <Text style={styles.playersIcon}>👥</Text>
            <Text style={styles.playersText}>
              {plan.currentPlayers}/{plan.maxPlayers}
            </Text>
            {spotsLeft > 0 && (
              <Text style={styles.spotsLeft}>({spotsLeft} left)</Text>
            )}
          </View>
          <View style={styles.costInfo}>
            <Text style={styles.rupee}>₹</Text>
            <Text style={styles.cost}>{costPerPlayer}</Text>
            <Text style={styles.perPerson}>/person</Text>
          </View>
        </View>

        {/* Organizer */}
        <View style={styles.organizerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{plan.organizerInitials}</Text>
          </View>
          <Text style={styles.organizerText}>
            by <Text style={styles.organizerName}>{plan.organizer}</Text>
          </Text>
        </View>
      </View>

      {/* Join Button */}
      {showJoinButton && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.joinButton,
              { 
                backgroundColor: plan.status === 'open' ? '#38bdf8' : '#6b7280',
                opacity: plan.status === 'open' ? 1 : 0.6
              }
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (plan.status === 'open') {
                onJoin?.(plan.id);
              }
            }}
            disabled={plan.status !== 'open'}
            activeOpacity={0.8}
          >
            <Text style={styles.joinButtonText}>
              {plan.status === 'open' 
                ? 'Request to Join →' 
                : plan.status === 'cancelled' 
                ? 'Cancelled' 
                : 'Not Available'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  headerIndicator: {
    height: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  emoji: {
    fontSize: 36,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  sport: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  location: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  playersAndCost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  playersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playersIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  playersText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    marginRight: 4,
  },
  spotsLeft: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rupee: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  cost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  perPerson: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 2,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  organizerText: {
    fontSize: 11,
    color: '#6b7280',
  },
  organizerName: {
    fontWeight: '500',
    color: '#111827',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  joinButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

