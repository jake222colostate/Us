import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export type InterestsPickerScreenProps = {
  selectedInterests: string[];
  maxInterests: number;
  onChange: (selected: string[]) => void;
  onDone: () => void;
};

const INTEREST_CATEGORIES: { title: string; items: string[] }[] = [
  {
    title: 'Creativity',
    items: [
      'Photography',
      'Drawing',
      'Poetry',
      'Interior design',
      'Writing',
      'Making videos',
      'Painting',
      'Dancing',
      'Stand-up comedy',
    ],
  },
  {
    title: 'Fan favorites',
    items: [
      'Marvel',
      'DC',
      'Anime',
      'Star Wars',
      'Harry Potter',
      'Cartoons',
      'Reality TV',
      'K-Pop',
      'Podcasts',
    ],
  },
  {
    title: 'Food and drink',
    items: [
      'Coffee',
      'Wine tasting',
      'Baking',
      'Vegan cooking',
      'Spicy food',
      'Brunch',
      'Craft beer',
      'Sushi',
      'BBQ',
    ],
  },
  {
    title: 'Lifestyle',
    items: [
      'Yoga',
      'Meditation',
      'Running',
      'CrossFit',
      'Pilates',
      'Hiking',
      'Cycling',
      'Weightlifting',
      'Pickleball',
    ],
  },
  {
    title: 'Music',
    items: [
      'Live music',
      'EDM',
      'Rap',
      'Indie',
      'Classical',
      'Jazz',
      'Country',
      'R&B',
      'Rock',
    ],
  },
  {
    title: 'Travel and adventure',
    items: [
      'Road trips',
      'Camping',
      'Backpacking',
      'Beaches',
      'Mountains',
      'Museums',
      'Theme parks',
      'Astrology',
      'Volunteering',
    ],
  },
  {
    title: 'Sports and games',
    items: [
      'Basketball',
      'Football',
      'Soccer',
      'Baseball',
      'Tennis',
      'Golf',
      'Esports',
      'Board games',
      'Chess',
    ],
  },
];

const InterestsPickerScreen: React.FC<InterestsPickerScreenProps> = ({
  selectedInterests,
  maxInterests,
  onChange,
  onDone,
}) => {
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return INTEREST_CATEGORIES;

    return INTEREST_CATEGORIES.map((category) => {
      const items = category.items.filter((item) =>
        item.toLowerCase().includes(normalizedSearch),
      );
      return { ...category, items };
    }).filter((category) => category.items.length > 0);
  }, [normalizedSearch]);

  const toggleInterest = useCallback(
    (interest: string) => {
      const isSelected = selectedInterests.includes(interest);
      if (isSelected) {
        onChange(selectedInterests.filter((item) => item !== interest));
        return;
      }

      if (selectedInterests.length >= maxInterests) {
        return;
      }

      onChange([...selectedInterests, interest]);
    },
    [maxInterests, onChange, selectedInterests],
  );

  const renderChip = useCallback(
    (interest: string) => {
      const selected = selectedInterests.includes(interest);
      return (
        <TouchableOpacity
          key={interest}
          onPress={() => toggleInterest(interest)}
          style={[
            styles.chip,
            styles.chipSpacing,
            selected ? styles.chipSelected : styles.chipUnselected,
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{interest}</Text>
        </TouchableOpacity>
      );
    },
    [selectedInterests, toggleInterest],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onDone} hitSlop={12}>
          <Text style={styles.headerButton}>×</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Interests</Text>
          <Text style={styles.subtitle}>{`${selectedInterests.length} of ${maxInterests}`}</Text>
        </View>
        <TouchableOpacity onPress={onDone} hitSlop={12}>
          <Text style={styles.headerAction}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectedContainer}>
        {selectedInterests.length === 0 ? (
          <Text style={styles.emptySelected}>Pick up to {maxInterests} interests</Text>
        ) : (
          <View style={styles.selectedChipsRow}>
            {selectedInterests.map((interest) => (
              <TouchableOpacity
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[styles.selectedChip, styles.chipSelected, styles.chipSpacing]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, styles.chipTextSelected]}>
                  {interest} <Text style={styles.removeIcon}>✕</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor="#7c8599"
          style={styles.searchInput}
          selectionColor="#7a8bff"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filteredCategories.map((category) => (
          <View key={category.title} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.chipRow}>{category.items.map(renderChip)}</View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default InterestsPickerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerButton: {
    color: '#e5e7eb',
    fontSize: 26,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 2,
  },
  headerAction: {
    color: '#8b93ff',
    fontSize: 16,
    fontWeight: '700',
  },
  selectedContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  selectedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptySelected: {
    color: '#7c8599',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0b1220',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2a44',
  },
  searchIcon: {
    color: '#9ca3af',
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 15,
    paddingVertical: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  categorySection: {
    marginTop: 18,
    backgroundColor: '#0b1220',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  categoryTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipSpacing: {
    marginRight: 10,
    marginBottom: 10,
  },
  chipUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#243047',
  },
  chipSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#f8fafc',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeIcon: {
    fontWeight: '700',
  },
});
