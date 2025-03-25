import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { Calendar, Clock, MapPin, Users } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ImageUpload } from '@/components/ImageUpload';
import type { Event } from '@/lib/supabase';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      //router.push('/auth/sign-in');
     // return;
    }
    loadEvent();
  }, [id, session]);

  const loadEvent = async () => {
    try {
      if (!id || !session?.user) {
        throw new Error('Invalid event ID or not authenticated');
      }

      setLoading(true);
      setError(null);

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;

      if (!event) {
        throw new Error('Event not found');
      }

      // Check if user is the organizer
      if (event.organizer_id !== session.user.id) {
        router.push(`/event/${id}`);
        return;
      }

      // Set form values
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location);
      setCapacity(event.capacity?.toString() || '');
      setImageUrl(event.image_url);
      setStartDate(new Date(event.start_time));
      setEndDate(new Date(event.end_time));
    } catch (e) {
      setError(e.message);
      console.error('Error loading event:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!session?.user) {
        throw new Error('You must be signed in to update an event');
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

      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('events')
        .update({
          title,
          description: description || null,
          location,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          capacity: capacity ? parseInt(capacity) : null,
          image_url: imageUrl,
        })
        .eq('id', id)
        .eq('organizer_id', session.user.id);

      if (updateError) throw updateError;

      router.push(`/event/${id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
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
      <View style={styles.container}>
        <View style={styles.signInPrompt}>
          <Text style={styles.signInTitle}>Sign In Required</Text>
          <Text style={styles.signInText}>
            Please sign in to edit this event
          </Text>
          <Pressable
            style={styles.signInButton}
            onPress={() => router.push('/auth/sign-in')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Event</Text>
        <Text style={styles.subtitle}>Update your event details</Text>
      </View>

      <View style={styles.form}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter event title"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your event"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.iconInput}>
            <MapPin size={20} color="#64748b" />
            <TextInput
              style={styles.iconInputText}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeInput}>
            <Text style={styles.label}>Start Time *</Text>
            <Pressable
              style={styles.iconInput}
              onPress={() => setShowStartPicker(true)}>
              <Calendar size={20} color="#64748b" />
              <Text style={styles.dateTimeText}>
                {format(startDate, 'MMM d, yyyy h:mm a')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.dateTimeInput}>
            <Text style={styles.label}>End Time *</Text>
            <Pressable
              style={styles.iconInput}
              onPress={() => setShowEndPicker(true)}>
              <Clock size={20} color="#64748b" />
              <Text style={styles.dateTimeText}>
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
          <Text style={styles.label}>Capacity</Text>
          <View style={styles.iconInput}>
            <Users size={20} color="#64748b" />
            <TextInput
              style={styles.iconInputText}
              value={capacity}
              onChangeText={setCapacity}
              placeholder="Maximum number of attendees"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Image</Text>
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

        <View style={styles.actions}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#0f172a',
    marginBottom: 8,
  },
  signInText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginTop: 60,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  form: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconInputText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
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
    color: '#0f172a',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});