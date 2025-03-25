import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Calendar, MapPin, Search as SearchIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import type { Event } from '@/lib/supabase';

type SearchResult = Event & {
  attendees_count: number;
};

const EventCard = ({ event }: { event: SearchResult }) => {
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
        </View>
      </View>
    </Pressable>
  );
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'tech', name: 'Tech', image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80' },
    { id: 'business', name: 'Business', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80' },
    { id: 'arts', name: 'Arts', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80' },
    { id: 'sports', name: 'Sports', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80' },
    { id: 'music', name: 'Music', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' },
    { id: 'food', name: 'Food', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('events')
        .select(`
          *,
          attendees_count:event_attendees(count)
        `)
        .gte('end_time', new Date().toISOString());

      // Add search query filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      // Add category filter
      if (selectedCategory) {
        query = query.ilike('description', `%#${selectedCategory}%`);
      }

      const { data, error: searchError } = await query
        .order('start_time', { ascending: true })
        .limit(20);

      if (searchError) throw searchError;

      setResults(
        data.map((event) => ({
          ...event,
          attendees_count: event.attendees_count[0]?.count || 0,
        }))
      );
    } catch (e) {
      setError(e.message);
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when category is selected/deselected
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    // Reset search results when changing categories
    setResults([]);
    // Trigger search with new category
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Search Events</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find amazing events near you
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
          <SearchIcon size={20} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by event name or location"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Browse Categories
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && { borderColor: colors.primary },
              ]}
              onPress={() => handleCategorySelect(category.id)}>
              <Image
                source={category.image}
                style={styles.categoryImage}
                contentFit="cover"
              />
              <View style={styles.categoryOverlay} />
              <Text style={styles.categoryName}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.surface }]}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Searching events...
          </Text>
        </View>
      ) : results.length > 0 ? (
        <View style={styles.resultsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory 
              ? `${categories.find(c => c.id === selectedCategory)?.name} Events` 
              : 'Search Results'}
          </Text>
          {results.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            No events found
          </Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Try adjusting your search or browse through categories
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
  header: {
    marginTop: 60,
    marginHorizontal: 16,
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
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: 160,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryName: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultsContainer: {
    paddingBottom: 24,
  },
  eventCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
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
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});