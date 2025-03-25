import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import type { Event } from '@/lib/supabase';

type EventWithAttendees = Event & {
  attendees_count: number;
};

type EventSection = {
  title: string;
  data: EventWithAttendees[];
};

const EventCard = ({ event }: { event: EventWithAttendees }) => {
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
        transition={200}
      />
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
        <View style={styles.eventMeta}>
          <View style={styles.eventDetail}>
            <Clock size={16} color={colors.icon} />
            <Text style={[styles.eventDetailText, { color: colors.textSecondary }]}>
              {format(new Date(event.start_time), 'EEE, MMM d • h:mm a')}
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

export default function CalendarScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [sections, setSections] = useState<EventSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [session]);

  const loadEvents = async () => {
    try {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Fetch events organized by the user
      const { data: organizedEvents, error: organizedError } = await supabase
        .from('events')
        .select(`
          *,
          attendees_count:event_attendees(count)
        `)
        .eq('organizer_id', session.user.id);

      if (organizedError) throw organizedError;

      // First get the event IDs where the user is an attendee
      const { data: attendeeEventIds, error: attendeeIdsError } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', session.user.id)
        .eq('status', 'attending');

      if (attendeeIdsError) throw attendeeIdsError;

      // Then fetch the full event details for those IDs
      const { data: attendeeEvents, error: attendeeEventsError } = await supabase
        .from('events')
        .select(`
          *,
          attendees_count:event_attendees(count)
        `)
        .in('id', attendeeEventIds?.map(row => row.event_id) || [])
        .neq('organizer_id', session.user.id);

      if (attendeeEventsError) throw attendeeEventsError;

      // Format events
      const formattedOrganizedEvents = (organizedEvents || []).map((e) => ({
        ...e,
        attendees_count: e.attendees_count[0]?.count || 0,
      }));

      const formattedAttendeeEvents = (attendeeEvents || []).map((e) => ({
        ...e,
        attendees_count: e.attendees_count[0]?.count || 0,
      }));

      // Split into upcoming and past events
      const upcomingOrganized = formattedOrganizedEvents
        .filter((event) => new Date(event.end_time) >= new Date(now))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      const pastOrganized = formattedOrganizedEvents
        .filter((event) => new Date(event.end_time) < new Date(now))
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

      const upcomingAttending = formattedAttendeeEvents
        .filter((event) => new Date(event.end_time) >= new Date(now))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      const pastAttending = formattedAttendeeEvents
        .filter((event) => new Date(event.end_time) < new Date(now))
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

      setSections([
        { title: 'Events You\'re Organizing', data: upcomingOrganized },
        { title: 'Events You\'re Attending', data: upcomingAttending },
        { title: 'Past Events You Organized', data: pastOrganized },
        { title: 'Past Events You Attended', data: pastAttending },
      ]);
    } catch (e) {
      setError(e.message);
      console.error('Error loading events:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.signInPrompt}>
          <CalendarIcon size={48} color={colors.primary} />
          <Text style={[styles.signInTitle, { color: colors.text }]}>
            Track Your Events
          </Text>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>
            Sign in to view and manage your upcoming and past events
          </Text>
          <Pressable 
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/sign-in')}>
            <Text style={[styles.signInButtonText, { color: colors.surface }]}>
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Pressable 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadEvents}>
          <Text style={[styles.retryButtonText, { color: colors.surface }]}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  const hasEvents = sections.some((section) => section.data.length > 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Events</Text>
        <Pressable 
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/create')}>
          <Text style={[styles.createButtonText, { color: colors.surface }]}>
            Create Event
          </Text>
        </Pressable>
      </View>

      {hasEvents ? (
        sections.map((section) => (
          section.data.length > 0 && (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
              <View style={styles.eventsList}>
                {section.data.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </View>
            </View>
          )
        ))
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <CalendarIcon size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            No Events Yet
          </Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Create your first event or join one to get started
          </Text>
          <Pressable 
            style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/create')}>
            <Text style={[styles.emptyStateButtonText, { color: colors.surface }]}>
              Create Event
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginTop: 60,
    marginHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
    height: 200,
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  eventMeta: {
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signInPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  signInText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});