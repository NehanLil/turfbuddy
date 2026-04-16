import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const PlanDetailsScreen = () => {
  const [isPublic, setIsPublic] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const { planId } = route.params as { planId: string };
  const { user } = useAuth();

  const [plan, setPlan] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    loadPlanDetails();
  }, [planId]);

  const loadPlanDetails = async () => {
    try {
      const { data: planData, error: planError } = await supabase
        .from('game_plans')
        .select(`
          *,
          profiles!fk_game_plans_organizer(*)
        `)
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      setPlan(planData);
      setIsOrganizer(user?.id === planData.organizer_id);
      setIsPublic(!!planData.public);

      const { data: participantsData, error: participantsError } = await supabase
        .from('plan_participants')
        .select(`
          *,
          profiles!fk_plan_participants_user(*)
        `)
        .eq('plan_id', planId);

      if (participantsError) throw participantsError;

      setParticipants(participantsData || []);
      setIsParticipant(participantsData?.some((p) => p.user_id === user?.id) || false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    try {
      const { error } = await supabase
        .from('game_plans')
        .update({ public: !isPublic })
        .eq('id', planId);
      if (error) throw error;
      setIsPublic(!isPublic);
      Alert.alert('Success', `Plan is now ${!isPublic ? 'public' : 'private'}.`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleMarkPaid = async (participantId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('plan_participants')
        .update({ has_paid: !currentStatus })
        .eq('id', participantId);

      if (error) throw error;

      Alert.alert(
        'Updated',
        `Payment status ${!currentStatus ? 'marked as paid' : 'unmarked'}`
      );

      loadPlanDetails();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    Alert.alert(
      'Remove Participant',
      'Are you sure you want to remove this participant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('plan_participants')
                .delete()
                .eq('id', participantId);

              if (error) throw error;

              Alert.alert('Success', 'Participant has been removed from the plan');
              loadPlanDetails();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleCancelPlan = async () => {
    Alert.alert(
      'Cancel Plan',
      'Are you sure you want to cancel this plan? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('game_plans')
                .update({ status: 'cancelled' })
                .eq('id', planId);

              if (error) throw error;

              Alert.alert(
                'Plan Cancelled',
                'The game plan has been cancelled.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Plan not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const costPerPerson = Math.ceil(plan.total_cost / plan.max_players);
  const paidCount = participants.filter((p) => p.has_paid).length + (isOrganizer ? 1 : 0);
  const totalCollected = paidCount * costPerPerson;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Details</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Cancelled Banner */}
        {plan.status === 'cancelled' && (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledIcon}>✕</Text>
            <View style={styles.cancelledContent}>
              <Text style={styles.cancelledTitle}>This plan has been cancelled</Text>
              <Text style={styles.cancelledText}>The organizer has cancelled this game plan.</Text>
            </View>
          </View>
        )}

        {/* Plan Info Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>
                {plan.sport?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, plan.status === 'cancelled' && styles.statusCancelled]}>
                {plan.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.planTitle}>{plan.title}</Text>

          {plan.description && (
            <Text style={styles.planDescription}>{plan.description}</Text>
          )}

          <View style={styles.planDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{plan.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>
                {new Date(plan.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🕐</Text>
              <Text style={styles.detailText}>{plan.time?.slice(0, 5)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={styles.detailText}>
                {plan.current_players}/{plan.max_players} players
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.costSection}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Total Cost</Text>
              <Text style={styles.costValue}>₹{plan.total_cost}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Cost per Person</Text>
              <Text style={styles.costValue}>₹{costPerPerson}</Text>
            </View>
            {isOrganizer && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Collected</Text>
                <Text style={[styles.costValue, styles.costCollected]}>
                  ₹{totalCollected}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons & Public Toggle */}
          {isOrganizer && plan.status === 'open' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => (navigation as any).navigate('EditPlan', { planId })}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelPlan}
              >
                <Text style={styles.cancelButtonText}>Cancel Plan</Text>
              </TouchableOpacity>
            </View>
          )}
          {isOrganizer && (
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <TouchableOpacity
                style={{
                  backgroundColor: isPublic ? '#10b981' : '#f59e0b',
                  padding: 10,
                  borderRadius: 8,
                  minWidth: 120,
                }}
                onPress={handleTogglePublic}
              >
                <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
                  {isPublic ? 'Make Private' : 'Make Public'}
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {isPublic ? 'This plan is public.' : 'This plan is private.'}
              </Text>
            </View>
          )}
        </View>

        {/* Participants Card */}
        <View style={styles.participantsCard}>
          <View style={styles.participantsHeader}>
            <Text style={styles.participantsTitle}>
              Participants ({participants.length + 1})
            </Text>
            {(isOrganizer || isParticipant) && plan.status !== 'cancelled' && (
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => (navigation as any).navigate('ChatView', { planId })}
              >
                <Text style={styles.chatButtonText}>💬 Group Chat</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Organizer */}
          <View style={[styles.participantItem, styles.organizerItem]}>
            <View style={styles.participantInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(plan.profiles?.display_name || 'U')}
                </Text>
              </View>
              <View style={styles.participantDetails}>
                <Text style={styles.participantName}>
                  {plan.profiles?.display_name}
                </Text>
                <Text style={styles.participantRole}>Organizer</Text>
              </View>
            </View>
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>✓ Paid</Text>
            </View>
          </View>

          {/* Participants List */}
          {participants.map((participant) => (
            <View key={participant.id} style={styles.participantItem}>
              <View style={styles.participantInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(participant.profiles?.display_name || 'U')}
                  </Text>
                </View>
                <View style={styles.participantDetails}>
                  <Text style={styles.participantName}>
                    {participant.profiles?.display_name}
                  </Text>
                  <Text style={styles.participantDate}>
                    Joined {new Date(participant.joined_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.participantActions}>
                {isOrganizer ? (
                  <View style={styles.organizerActions}>
                    <TouchableOpacity
                      style={[
                        styles.paidButton,
                        participant.has_paid && styles.paidButtonActive,
                      ]}
                      onPress={() =>
                        handleMarkPaid(participant.id, participant.has_paid)
                      }
                    >
                      <Text
                        style={[
                          styles.paidButtonText,
                          participant.has_paid && styles.paidButtonTextActive,
                        ]}
                      >
                        {participant.has_paid ? '✓ Paid' : 'Mark Paid'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveParticipant(participant.id)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.statusBadgeSmall,
                      participant.has_paid
                        ? styles.statusBadgePaid
                        : styles.statusBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeSmallText,
                        participant.has_paid && styles.statusBadgeTextPaid,
                      ]}
                    >
                      {participant.has_paid ? '✓ Paid' : 'Pending'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cancelledBanner: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cancelledIcon: {
    fontSize: 24,
    color: '#ef4444',
    marginRight: 12,
  },
  cancelledContent: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  cancelledText: {
    fontSize: 13,
    color: '#6b7280',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportBadge: {
    backgroundColor: '#38bdf820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sportBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#10b98120',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  statusCancelled: {
    color: '#ef4444',
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  planDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
  },
  detailText: {
    fontSize: 14,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  costSection: {
    gap: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  costCollected: {
    color: '#10b981',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  participantsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  chatButton: {
    backgroundColor: '#38bdf820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  organizerItem: {
    backgroundColor: '#38bdf810',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  participantRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  participantDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  participantActions: {
    flexDirection: 'row',
    gap: 8,
  },
  organizerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  paidBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  paidButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paidButtonActive: {
    backgroundColor: '#10b98120',
    borderColor: '#10b981',
  },
  paidButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  paidButtonTextActive: {
    color: '#10b981',
  },
  removeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgePaid: {
    backgroundColor: '#10b98120',
  },
  statusBadgePending: {
    backgroundColor: '#f3f4f6',
  },
  statusBadgeSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusBadgeTextPaid: {
    color: '#10b981',
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
