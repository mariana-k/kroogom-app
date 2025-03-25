import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Camera, ImagePlus, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickImage, uploadImage } from '@/lib/uploadImage';

type ImageUploadProps = {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  bucket: string;
  path: string;
  aspectRatio?: number;
  maxSize?: number;
  placeholder?: string;
};

export function ImageUpload({
  imageUrl,
  onImageChange,
  bucket,
  path,
  aspectRatio = 1,
  maxSize = 1200,
  placeholder = 'Upload Image',
}: ImageUploadProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleImagePick = async () => {
    try {
      setLoading(true);
      setError(null);

      // Request permissions if needed
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Permission to access media library was denied');
        }
      }

      // Pick image
      const result = await pickImage();
      if (!result) return;

      // Upload image
      const uploadedUrl = await uploadImage(result.uri, {
        bucket,
        path,
        maxWidth: maxSize,
        maxHeight: maxSize,
        quality: 0.8,
      });

      if (!uploadedUrl) {
        throw new Error('Failed to upload image');
      }

      onImageChange(uploadedUrl);
    } catch (e) {
      setError(e.message);
      console.error('Error uploading image:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
  };

  return (
    <View style={styles.container}>
      {imageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={imageUrl}
            style={[styles.image, { aspectRatio }]}
            contentFit="cover"
          />
          <View style={styles.overlay}>
            <Pressable
              style={styles.changeButton}
              onPress={handleImagePick}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Camera size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Change</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={styles.removeButton}
              onPress={handleRemoveImage}
              disabled={loading}>
              <Trash2 size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.uploadButton, { aspectRatio }]}
          onPress={handleImagePick}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            <>
              <ImagePlus size={32} color="#6366f1" />
              <Text style={styles.uploadText}>{placeholder}</Text>
            </>
          )}
        </Pressable>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  uploadButton: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
});