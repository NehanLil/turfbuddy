import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { User, Camera } from 'lucide-react-native';

export const EditProfileScreen = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || '');
        setPhone(data.phone || '');
        setAvatarUrl(data.avatar_url || '');
      }

      // Load preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('bio')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (prefs) {
        setBio(prefs.bio || '');
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('Selected image URI:', result.assets[0].uri);
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      console.log('Starting upload for URI:', uri);
      setUploading(true);
      
      const fileExt = uri.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('Upload path:', filePath);

      // Create FormData for React Native
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      console.log('Uploading to Supabase...');

      // Upload using FormData
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful!');

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      setAvatarUrl(publicUrl);

      // Update profile in database
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user?.id);

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          phone: phone,
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Update or insert preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user?.id,
            bio: bio,
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false,
          }
        );

      if (prefsError) throw prefsError;

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={50} color="#94a3b8" />
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.changePhotoButton}>
            <Camera size={16} color="#38bdf8" />
            <Text style={styles.changePhotoText}>Change photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9999999999"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mini Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    fontSize: 16,
    color: '#38bdf8',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '500',
  },
  form: {
    backgroundColor: '#fff',
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
});

