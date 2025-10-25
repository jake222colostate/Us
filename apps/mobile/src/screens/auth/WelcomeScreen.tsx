import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { Button, Text } from '@us/ui';

const hero = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => (
  <ImageBackground source={{ uri: hero }} style={styles.container}>
    <View style={styles.overlay}>
      <Text weight="bold" style={styles.title}>
        Date together, anywhere.
      </Text>
      <Button label="Get started" onPress={() => navigation.navigate('AgeGate')} />
      <Button variant="ghost" label="Sign In" onPress={() => navigation.navigate('SignIn')} />
    </View>
  </ImageBackground>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 16,
  },
});
