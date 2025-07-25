// src/screens/EventRecommendationsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import axios from 'axios';
import { useThemeContext } from '../contexts/ThemeContext'; // yolunu kontrol et
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const EventRecommendationsScreen = ({ route }: any) => {
  const { userIds } = route.params; // örn: ["uid1", "uid2"]
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(
          `http://10.0.2.2:8000/recommendations?user_ids=${userIds.join(',')}`
        );
        setEvents(response.data.recommendations);
      } catch (error) {
        console.error("Etkinlikler alınamadı:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const renderItem = ({ item }: any) => (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? '#333' : '#f9f9f9', shadowColor: isDark ? '#000' : '#aaa' },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? '#FFA726' : '#FF6F00' }]}>{item.title}</Text>
      <Text style={[styles.location, { color: isDark ? '#ccc' : '#555' }]}>
        📍 {item.location}
      </Text>
      <View style={styles.scoreContainer}>
        <Ionicons name="trending-up" size={16} color={isDark ? '#FFA726' : '#FF6F00'} />
        <Text style={[styles.scoreText, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
          {item.score.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
        <ActivityIndicator size="large" color={isDark ? '#FFA726' : '#FF6F00'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <Text style={[styles.header, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
        Suggested Events
      </Text>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default EventRecommendationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: screenWidth * 0.9,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignSelf: 'center',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    marginBottom: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
