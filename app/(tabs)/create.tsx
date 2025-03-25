import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Calendar, Clock, MapPin, Users } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { ImageUpload } from '@/components/ImageUpload';
import { CategoryPicker } from '@/components/CategoryPicker';
import type { EventCategory } from '@/types/supabase';

export default function CreateEventScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<EventCategory[]>(['other']);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleCreateEvent = async () => {
    try {
      if (!session?.user) {
        throw new Error('You must be signed in to create an event');
      }

      if (!title || !location || !startDate || !endDate) {
        throw new Error('Please fill in all required fields');
      }

      if (endDate <= startDate) {
        throw new Error('End time must be after start time');
      }

      if (capacity && parseInt(capacity) <= 0) {
        throw new Error('Capacity must be greater than 0');
      }

      if (categories.length === 0) {
        throw new Error('Please select at least one category');
      }

      setLoading(true);
      setError(null);

      const { data: event, error: createError } = await supabase
        .from('events')
        .insert({
          title,
          description: description || null,
          location,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          capacity: capacity ? parseInt(capacity) : null,
          image_url: imageUrl,
          organizer_id: session.user.id,
          categories,
        })
        .select()
        .single();

      if (createError) throw createError;

      router.push(`/event/${event.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      // If end date is before new start date, update it
      if (endDate <= selectedDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setHours(selectedDate.getHours() + 1);
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.signInPrompt}>
          <Text style={[styles.signInTitle, { color: colors.text }]}>
            Sign In Required
          </Text>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>
            Please sign in to create an event
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Create Event</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Share your event with the community
        </Text>
      </View>

      <View style={styles.form}>
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.surface }]}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Event Title *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter event title"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your event"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Categories *</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Select up to 3 categories that best describe your event
          </Text>
          <CategoryPicker
            selectedCategories={categories}
            onChange={setCategories}
            maxCategories={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
          <View
            style={[
              styles.iconInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}>
            <MapPin size={20} color={colors.icon} />
            <TextInput
              style={[styles.iconInputText, { color: colors.text }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeInput}>
            <Text style={[styles.label, { color: colors.text }]}>
              Start Time *
            </Text>
            <Pressable
              style={[
                styles.iconInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowStartPicker(true)}>
              <Calendar size={20} color={colors.icon} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {format(startDate, 'MMM d, yyyy h:mm a')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.dateTimeInput}>
            <Text style={[styles.label, { color: colors.text }]}>End Time *</Text>
            <Pressable
              style={[
                styles.iconInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowEndPicker(true)}>
              <Clock size={20} color={colors.icon} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {format(endDate, 'MMM d, yyyy h:mm a')}
              </Text>
            </Pressable>
          </View>
        </View>

        {(showStartPicker || showEndPicker) && Platform.OS !== 'web' && (
          <DateTimePicker
            value={showStartPicker ? startDate : endDate}
            mode="datetime"
            onChange={showStartPicker ? handleStartDateChange : handleEndDateChange}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Capacity</Text>
          <View
            style={[
              styles.iconInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}>
            <Users size={20} color={colors.icon} />
            <TextInput
              style={[styles.iconInputText, { color: colors.text }]}
              value={capacity}
              onChangeText={setCapacity}
              placeholder="Maximum number of attendees"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Event Image</Text>
          <ImageUpload
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            bucket="events"
            path="covers"
            aspectRatio={16/9}
            maxSize={1200}
            placeholder="Upload Event Cover"
          />
        </View>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleCreateEvent}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              Create Event
            </Text>
          )}
        </Pressable>
      </View>
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
  form: {
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  iconInputText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dateTimeInput: {
    flex: 1,
  },
  dateTimeText: {
    marginLeft: 12,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
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
});