import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Mail,
  Clock,
  Settings,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import type { Profile, Event } from '@/lib/supabase';

type ExtendedProfile = Profile & {
  organized_events: (Event & { attendees_count: number })[];
  attended_events: (Event & { attendees_count: number })[];
};

const EventCard = ({ event }: { event: Event & { attendees_count: number } }) => {
  const { colors } = useTheme();
  
  const handlePress = () => {
    router.push(`/event/${event.id}`);
  };

  return (
    <Pressable 
      style={[styles.eventCard, { backgroundColor: colors.surface }]}
      onPress={handlePress}>
      <Image
        source={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80'}
        style={styles.eventImage}
        contentFit="cover"
      />
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
        <View style={styles.eventDetails}>
          <View style={styles.eventDetail}>
            <Calendar size={16} color={colors.icon} />
            <Text style={[styles.eventDetailText, { color: colors.textSecondary }]}>
              {format(new Date(event.start_time), 'EEE, MMM d')}
            </Text>
          </View>
          <View style={styles.eventDetail}>
            <MapPin size={16} color={colors.icon} />
            <Text style={[styles.eventDetailText, { color: colors.textSecondary }]}>
              {event.location}
            </Text>
          </View>
          <View style={styles.eventDetail}>
            <Users size={16} color={colors.icon} />
            <Text style={[styles.eventDetailText, { color: colors.textSecondary }]}>
              {event.attendees_count} {event.attendees_count === 1 ? 'attendee' : 'attendees'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function ProfileScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : null;
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = session?.user?.id === id;

  useEffect(() => {
    if (!id) {
      setError('Invalid profile ID');
      setLoading(false);
      return;
    }
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      if (!id) {
        throw new Error('Invalid profile ID');
      }

      setLoading(true);
      setError(null);

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error('Invalid profile ID format');
      }

      // Get profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      if (!profileData) {
        throw new Error('Profile not found');
      }

      // Get organized events
      const { data: organizedEvents, error: organizedError } = await supabase
        .from('events')
        .select(`
          *,
          attendees_count:event_attendees(count)
        `)
        .eq('organizer_id', id)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (organizedError) throw organizedError;

      // First get the event IDs where the user is an attendee
      const { data: attendeeEventIds, error: attendeeIdsError } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', id)
        .eq('status', 'attending');

      if (attendeeIdsError) throw attendeeIdsError;

      // Then fetch the full event details for those IDs
      const { data: attendedEvents, error: attendedError } = await supabase
        .from('events')
        .select(`
          *,
          attendees_count:event_attendees(count)
        `)
        .in('id', attendeeEventIds?.map(row => row.event_id) || [])
        .neq('organizer_id', id)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (attendedError) throw attendedError;

      setProfile({
        ...profileData,
        organized_events: organizedEvents.map(event => ({
          ...event,
          attendees_count: event.attendees_count[0]?.count || 0,
        })),
        attended_events: attendedEvents.map(event => ({
          ...event,
          attendees_count: event.attendees_count[0]?.count || 0,
        })),
      });
    } catch (e) {
      if (e.message.includes('invalid input syntax for type uuid')) {
        setError('Invalid profile ID format');
      } else {
        setError(e.message);
      }
      console.error('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // If this is the user's own profile and they came from the profile tab,
    // navigate back to the tabs
    if (isOwnProfile) {
      router.replace('/(tabs)');
    } else {
      // Otherwise, try to go back in history
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || 'Profile not found'}
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={handleBack}>
          <ArrowLeft size={20} color={colors.surface} />
          <Text style={[styles.backButtonText, { color: colors.surface }]}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back
          </Text>
        </Pressable>
        {isOwnProfile && (
          <Pressable 
            style={[styles.editButton, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/profile/edit')}>
            <Settings size={20} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              Edit Profile
            </Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
        <Image
          source={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.username)}`}
          style={styles.profileImage}
          contentFit="cover"
        />
        <Text style={[styles.username, { color: colors.text }]}>
          {profile.username}
        </Text>
        {profile.full_name && (
          <Text style={[styles.fullName, { color: colors.textSecondary }]}>
            {profile.full_name}
          </Text>
        )}
        {profile.location && (
          <View style={styles.locationContainer}>
            <MapPin size={16} color={colors.icon} />
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {profile.location}
            </Text>
          </View>
        )}
        {profile.bio && (
          <Text style={[styles.bio, { color: colors.text }]}>
            {profile.bio}
          </Text>
        )}
        <View style={styles.joinDate}>
          <Clock size={16} color={colors.icon} />
          <Text style={[styles.joinDateText, { color: colors.textSecondary }]}>
            Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
          </Text>
        </View>
      </View>

      {profile.organized_events.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Organizing
          </Text>
          <View style={styles.eventsList}>
            {profile.organized_events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        </View>
      )}

      {profile.attended_events.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Attending
          </Text>
          <View style={styles.eventsList}>
            {profile.attended_events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    marginTop: 60,
    marginHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: '#e2e8f0',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  location: {
    fontSize: 16,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  joinDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinDateText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventImage: {
    width: '100%',
    height: 160,
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
  },
});