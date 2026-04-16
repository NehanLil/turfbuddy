import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onPick: (location: { lat: number; lng: number; city?: string }) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onPick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typingTimer) {
      clearTimeout(typingTimer);
    }

    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        searchLocations(searchQuery);
      }, 500);
      setTypingTimer(timer);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
    };
  }, [searchQuery]);

  const searchLocations = async (query: string) => {
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(
        query
      )}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'GamePlanApp/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      
      const mapped = (data || []).slice(0, 5).map((r: any) => ({
        label: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        city: r.address?.city || r.address?.town || r.address?.village || r.address?.state_district,
      }));
      
      setSuggestions(mapped);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location: any) => {
    onPick({
      lat: location.lat,
      lng: location.lng,
      city: location.city,
    });
    setSuggestions([]);
    setSearchQuery(location.label);
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get city name
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        onPick({
          lat: latitude,
          lng: longitude,
          city: place.city || place.region || undefined,
        });
        setSearchQuery(`${place.city || place.region}, ${place.country}`);
      }
    } catch (error) {
      console.error('Current location error:', error);
      alert('Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search for a location..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
        disabled={loading}
      >
        <Text style={styles.currentLocationText}>
          📍 Use Current Location
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#38bdf8" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {suggestions.length > 0 && (
        <ScrollView style={styles.suggestions} nestedScrollEnabled>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleSelectLocation(suggestion)}
            >
              <Text style={styles.suggestionIcon}>📍</Text>
              <Text style={styles.suggestionText} numberOfLines={2}>
                {suggestion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {value && (
        <View style={styles.selectedLocation}>
          <Text style={styles.selectedLocationIcon}>✓</Text>
          <Text style={styles.selectedLocationText}>
            Location selected: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },
  currentLocationButton: {
    backgroundColor: '#38bdf820',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf830',
    alignItems: 'center',
  },
  currentLocationText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 13,
  },
  suggestions: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#10b98120',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b98130',
  },
  selectedLocationIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#10b981',
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
});

