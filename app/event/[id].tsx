// Update the event details section to show categories
const EventDetails = ({ event }: { event: ExtendedEvent }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.detailsContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.detailRow}>
        <Calendar size={20} color={colors.primary} />
        <Text style={[styles.detailText, { color: colors.text }]}>
          {format(new Date(event.start_time), 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Clock size={20} color={colors.primary} />
        <Text style={[styles.detailText, { color: colors.text }]}>
          {format(new Date(event.start_time), 'h:mm a')} -{' '}
          {format(new Date(event.end_time), 'h:mm a')}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <MapPin size={20} color={colors.primary} />
        <Text style={[styles.detailText, { color: colors.text }]}>
          {event.location}
        </Text>
      </View>

      {event.capacity && (
        <View style={styles.detailRow}>
          <Users size={20} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {event.attendees_count} / {event.capacity} attendees
          </Text>
        </View>
      )}

      <View style={[styles.categoriesContainer, { marginTop: 12 }]}>
        <CategoryList categories={event.categories} />
      </View>
    </View>
  );
};