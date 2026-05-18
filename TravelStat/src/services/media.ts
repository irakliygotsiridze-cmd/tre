import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';
import type { MediaType } from '@/utils/types';

function mediaDir(): Directory {
  return new Directory(Paths.document, 'media');
}

async function ensureDir(): Promise<void> {
  const dir = mediaDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

export async function pickAndCopy(): Promise<{ uri: string; type: MediaType } | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.8,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const type: MediaType = a.type === 'video' ? 'video' : 'photo';
  await ensureDir();
  const ext = a.uri.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
  const fileName = String(uuid.v4()) + '.' + ext;
  const dest = new File(mediaDir(), fileName);
  const src = new File(a.uri);
  src.copy(dest);
  return { uri: dest.uri, type };
}

export async function purgeAllMedia(): Promise<void> {
  const dir = mediaDir();
  if (dir.exists) {
    dir.delete();
  }
}
