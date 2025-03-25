import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import type { Event } from '@/lib/supabase';

type EventWithAttendees = Event & {
  attendees_count: number;
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
        <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
          {format(new Date(event.start_time), 'EEE, MMM d • h:mm a')}
        </Text>
        <View style={styles.locationContainer}>
          <MapPin size={16} color={colors.icon} />
          <Text style={[styles.eventLocation, { color: colors.textSecondary }]}>
            {event.location}
          </Text>
        </View>
        <Text style={[styles.attendees, { color: colors.primary }]}>
          {event.attendees_count} {event.attendees_count === 1 ? 'attendee' : 'attendees'}
        </Text>
      </View>
    </Pressable>
  );
};

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const [events, setEvents] = useState<EventWithAttendees[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          attendees_count:event_attendees(count)
        `)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      setEvents(
        eventsData.map((event) => ({
          ...event,
          attendees_count: event.attendees_count[0]?.count || 0,
        }))
      );
    } catch (e) {
      setError(e.message);
      console.error('Error loading events:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = useCallback(
    (event: EventWithAttendees) => <EventCard key={event.id} event={event} />,
    []
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading events...
        </Text>
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

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Discover Events</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find amazing events near you
        </Text>
      </View>

      {events.length > 0 ? (
        <View style={styles.eventsContainer}>
          {events.map(renderEvent)}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            No upcoming events
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
            Check back later for new events
          </Text>
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
    padding: 16,
  },
  content: {
    padding: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
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
  eventsContainer: {
    gap: 16,
  },
  eventCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
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
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  eventLocation: {
    fontSize: 14,
  },
  attendees: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});