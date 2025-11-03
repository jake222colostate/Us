import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Image, Switch, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Button, Text } from '@us/ui';
import { useComposerStore } from '../../state/composerStore';
import { buildSideBySide } from '../../features/composer/utils';

const aspectOptions: { label: string; value: '1:1' | '4:5' | '3:4' }[] = [
  { label: '1:1', value: '1:1' },
  { label: '4:5', value: '4:5' },
  { label: '3:4', value: '3:4' },
];

export const ComposeScreen: React.FC = () => {
  const { myPhotoUri, theirPhotoUri, aspect, setMyPhoto, setTheirPhoto, setAspect, mirrorMine, toggleMirror, reset } =
    useComposerStore();
  const [exportedUri, setExportedUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickMyPhoto = useCallback(async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
    });
    if (!result.canceled) {
      setMyPhoto(result.assets[0].uri);
    }
  }, [setMyPhoto]);

  const pickTheirPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
    });
    if (!result.canceled) {
      setTheirPhoto(result.assets[0].uri);
    }
  }, [setTheirPhoto]);

  const onExport = useCallback(async () => {
    if (!myPhotoUri || !theirPhotoUri) {
      Alert.alert('Select photos first');
      return;
    }
    setSaving(true);
    try {
      const uri = await buildSideBySide(myPhotoUri, theirPhotoUri, { aspect, mirrorMine });
      setExportedUri(uri);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      Alert.alert('Saved', 'Your Us photo is ready!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to export');
    } finally {
      setSaving(false);
    }
  }, [myPhotoUri, theirPhotoUri, aspect, mirrorMine]);

  return (
    <View style={styles.container}>
      <Text weight="bold" style={styles.title}>
        Compose an Us Photo
      </Text>
      <View style={styles.previewRow}>
        <View style={styles.preview}>
          {myPhotoUri ? (
            <Image source={{ uri: myPhotoUri }} style={styles.previewImage} />
          ) : (
            <Button label="Pick my photo" onPress={pickMyPhoto} />
          )}
        </View>
        <View style={styles.preview}>
          {theirPhotoUri ? (
            <Image source={{ uri: theirPhotoUri }} style={styles.previewImage} />
          ) : (
            <Button label="Pick their photo" onPress={pickTheirPhoto} variant="secondary" />
          )}
        </View>
      </View>
      <View style={styles.controls}>
        <Text weight="semibold">Aspect</Text>
        <View style={styles.aspectRow}>
          {aspectOptions.map((option) => (
            <Button
              key={option.value}
              label={option.label}
              variant={aspect === option.value ? 'primary' : 'secondary'}
              onPress={() => setAspect(option.value)}
            />
          ))}
        </View>
        <View style={styles.toggleRow}>
          <Text weight="semibold">Mirror My Photo</Text>
          <Switch value={mirrorMine} onValueChange={toggleMirror} />
        </View>
      </View>
      <Button label={saving ? 'Saving...' : 'Export & Save'} onPress={onExport} disabled={saving} />
      {exportedUri && (
        <View style={styles.exportPreview}>
          <Text weight="semibold">Latest export</Text>
          <Image source={{ uri: exportedUri }} style={styles.exportImage} />
        </View>
      )}
      <Button variant="ghost" label="Reset" onPress={reset} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  preview: {
    flex: 1,
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E1F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  controls: {
    gap: 12,
  },
  aspectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exportPreview: {
    gap: 8,
  },
  exportImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
});
