import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

type UploadOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  bucket: string;
  path: string;
};

export async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    return result.assets[0];
  }

  return null;
}

export async function uploadImage(
  uri: string,
  options: UploadOptions
): Promise<string | null> {
  try {
    // Process image
    const processedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: options.maxWidth || 1200,
            height: options.maxHeight || 1200,
          },
        },
      ],
      {
        compress: options.quality || 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(processedImage.uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Generate unique filename
    const ext = processedImage.uri.split('.').pop();
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `${options.path}/${fileName}`;

    // Convert image to base64 or blob depending on platform
    let file;
    if (Platform.OS === 'web') {
      const response = await fetch(processedImage.uri);
      file = await response.blob();
    } else {
      const base64 = await FileSystem.readAsStringAsync(processedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      file = Buffer.from(base64, 'base64');
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        contentType: `image/${ext}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

export async function deleteImage(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

export function getImagePath(url: string | null): string | null {
  if (!url) return null;
  try {
    const { pathname } = new URL(url);
    return pathname.split('/').pop() || null;
  } catch {
    return null;
  }
}