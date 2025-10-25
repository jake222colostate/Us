import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text, Button } from '@us/ui';

export const SettingsScreen: React.FC = () => {
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [privateProfile, setPrivateProfile] = React.useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text weight="bold" style={styles.title}>
        Settings
      </Text>
      <View style={styles.row}>
        <Text weight="semibold">Push notifications</Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} />
      </View>
      <View style={styles.row}>
        <Text weight="semibold">Private profile</Text>
        <Switch value={privateProfile} onValueChange={setPrivateProfile} />
      </View>
      <Text muted>
        Manage how we reach you and what others see. Privacy and safety-first.
      </Text>
      <Button label="View Terms" variant="secondary" onPress={() => {}} />
      <Button label="View Privacy" variant="secondary" onPress={() => {}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
