import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Bell, Calendar, MapPin, Users, X, Check, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  event_id: string;
  created_at: string;
  read: boolean;
  event: {
    title: string;
    start_time: string;
    location: string;
    image_url: string | null;
  };
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

const NotificationCard = ({ notification }: { notification: Notification }) => {
  const { colors } = useTheme();
  
  const handlePress = () => {
    router.push(`/event/${notification.event_id}`);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'event_invite':
        return <Users size={20} color={colors.primary} />;
      case 'event_update':
        return <Bell size={20} color={colors.warning} />;
      case 'event_reminder':
        return <Clock size={20} color={colors.success} />;
      case 'event_cancelled':
        return <X size={20} color={colors.error} />;
      case 'new_attendee':
        return <Check size={20} color={colors.success} />;
      default:
        return <Bell size={20} color={colors.primary} />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Pressable 
      style={[
        styles.notificationCard, 
        { backgroundColor: colors.surface },
        !notification.read && styles.unreadCard
      ]}
      onPress={handlePress}>
      <View style={styles.notificationHeader}>
        <View style={[styles.notificationIcon, { backgroundColor: colors.background }]}>
          {getIcon()}
        </View>
        <View style={styles.notificationMeta}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
            {getTimeAgo(notification.created_at)}
          </Text>
        </View>
        {!notification.read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </View>

      <Text style={[styles.notificationMessage, { color: colors.text }]}>
        {notification.message}
      </Text>

      <View style={[styles.eventPreview, { backgroundColor: colors.background }]}>
        <Image
          source={notification.event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80'}
          style={styles.eventImage}
          contentFit="cover"
        />
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: colors.text }]}>
            {notification.event.title}
          </Text>
          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <Calendar size={14} color={colors.icon} />
              <Text style={[styles.eventDetailText, { color: colors.textSecondary }]}>
                {format(new Date(notification.event.start_time), 'EEE, MMM d')}
              </Text>
            </View>
            <View style={styles.eventDetail}>
              <MapPin size={14} color={colors.icon} />
              <Text style={[styles.eventDetailText, { color: colors.textSecondary }]}>
                {notification.event.location}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {notification.sender && (
        <View style={[styles.senderInfo, { borderTopColor: colors.border }]}>
          <Image
            source={notification.sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(notification.sender.username)}`}
            style={styles.senderAvatar}
            contentFit="cover"
          />
          <Text style={[styles.senderName, { color: colors.textSecondary }]}>
            {notification.sender.username}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export default function NotificationsScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          *,
          event:events (
            title,
            start_time,
            location,
            image_url
          ),
          sender:profiles!notifications_sender_id_fkey (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsError) throw notificationsError;

      setNotifications(notificationsData);
    } catch (e) {
      setError(e.message);
      console.error('Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = useCallback(async () => {
    try {
      if (!session?.user) return;

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false);

      if (updateError) throw updateError;

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (e) {
      console.error('Error marking notifications as read:', e);
    }
  }, [session]);

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.signInPrompt}>
          <Bell size={48} color={colors.primary} />
          <Text style={[styles.signInTitle, { color: colors.text }]}>
            Stay Updated
          </Text>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>
            Sign in to receive notifications about your events and connections
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
          onPress={loadNotifications}>
          <Text style={[styles.retryButtonText, { color: colors.surface }]}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Pressable 
              style={[styles.markReadButton, { backgroundColor: colors.primaryLight }]}
              onPress={markAllAsRead}>
              <Text style={[styles.markReadButtonText, { color: colors.primary }]}>
                Mark all as read
              </Text>
            </Pressable>
          )}
        </View>
        {unreadCount > 0 && (
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.notificationsList}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Bell size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No notifications
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        )}
      </View>
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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  markReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markReadButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unreadCard: {
    borderWidth: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationMeta: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 16,
  },
  eventPreview: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  eventImage: {
    width: 80,
    height: 80,
  },
  eventInfo: {
    flex: 1,
    padding: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});