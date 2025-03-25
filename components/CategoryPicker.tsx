import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import type { EventCategory } from '@/types/supabase';
import { useTheme } from '@/contexts/ThemeContext';

const CATEGORIES: { id: EventCategory; name: string; image: string }[] = [
  { 
    id: 'tech', 
    name: 'Tech', 
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'business', 
    name: 'Business', 
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'arts', 
    name: 'Arts', 
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'sports', 
    name: 'Sports', 
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'music', 
    name: 'Music', 
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'food', 
    name: 'Food', 
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'education', 
    name: 'Education', 
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'social', 
    name: 'Social', 
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'charity', 
    name: 'Charity', 
    image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'other', 
    name: 'Other', 
    image: 'https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=800&auto=format&fit=crop&q=80' 
  },
];

export function CategoryPicker({
  selectedCategories,
  onChange,
  maxCategories = 3,
}: {
  selectedCategories: EventCategory[];
  onChange: (categories: EventCategory[]) => void;
  maxCategories?: number;
}) {
  const { colors } = useTheme();

  const handleSelect = (category: EventCategory) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter((c) => c !== category));
    } else if (selectedCategories.length < maxCategories) {
      onChange([...selectedCategories, category]);
    }
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {CATEGORIES.map((category) => (
        <Pressable
          key={category.id}
          style={[
            styles.categoryCard,
            selectedCategories.includes(category.id) && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => handleSelect(category.id)}>
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
  );
}

export function CategoryBadge({ category }: { category: EventCategory }) {
  const { colors } = useTheme();
  const categoryInfo = CATEGORIES.find((c) => c.id === category);

  if (!categoryInfo) return null;

  return (
    <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
      <Text style={[styles.badgeText, { color: colors.primary }]}>
        {categoryInfo.name}
      </Text>
    </View>
  );
}

export function CategoryList({ categories }: { categories: EventCategory[] }) {
  return (
    <View style={styles.badgeList}>
      {categories.map((category) => (
        <CategoryBadge key={category} category={category} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 12,
  },
  categoryCard: {
    width: 120,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
    bottom: 8,
    left: 8,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});