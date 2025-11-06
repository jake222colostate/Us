import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type ChatRoute = RouteProp<RootStackParamList, 'Chat'>;
type ChatNavigation = NativeStackNavigationProp<RootStackParamList>;

type LocalMessage = {
  id: string;
  body: string;
  sender: 'me' | 'them';
  timestamp: number;
};

export default function ChatScreen() {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const route = useRoute<ChatRoute>();
  const navigation = useNavigation<ChatNavigation>();
  const { name, createdAt, avatar } = route.params;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<LocalMessage[]>(() => {
    const intro = name ? `You matched with ${name}. Say hello!` : 'You have a new match. Start the conversation!';
    const timestamp = createdAt ? new Date(createdAt).getTime() : Date.now();
    return [
      {
        id: 'intro',
        body: intro,
        sender: 'them',
        timestamp,
      },
    ];
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: name ? `Chat with ${name}` : 'Chat' });
  }, [navigation, name]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: `${now}`,
        body: trimmed,
        sender: 'me',
        timestamp: now,
      },
    ]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.threadHeader}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                  <Text style={styles.headerAvatarPlaceholderText}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <View style={styles.threadHeaderText}>
                <Text style={styles.threadTitle}>{name ?? 'Your match'}</Text>
                <Text style={styles.threadSubtitle}>
                  Matched on{' '}
                  {new Date(createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.sender === 'me' ? styles.messageRowOutgoing : styles.messageRowIncoming,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.sender === 'me' ? styles.messageBubbleOutgoing : styles.messageBubbleIncoming,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.sender === 'me' ? styles.messageTextOutgoing : styles.messageTextIncoming,
                  ]}
                >
                  {item.body}
                </Text>
              </View>
              <Text style={styles.messageTimestamp}>
                {new Date(item.timestamp).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContent}
        />
        <View style={styles.composerContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Write a message"
            placeholderTextColor={palette.muted}
            style={styles.input}
            multiline
            maxLength={500}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={handleSend}
            style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    messagesContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 12,
    },
    threadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    headerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerAvatarPlaceholder: {
      backgroundColor: palette.surface,
    },
    headerAvatarPlaceholderText: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.muted,
    },
    threadHeaderText: {
      flex: 1,
      gap: 2,
    },
    threadTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    threadSubtitle: {
      fontSize: 13,
      color: palette.muted,
    },
    messageRow: {
      flexDirection: 'column',
      maxWidth: '80%',
    },
    messageRowIncoming: {
      alignSelf: 'flex-start',
    },
    messageRowOutgoing: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end',
    },
    messageBubble: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    messageBubbleIncoming: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    messageBubbleOutgoing: {
      backgroundColor: palette.accent,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 20,
    },
    messageTextIncoming: {
      color: palette.textPrimary,
    },
    messageTextOutgoing: {
      color: palette.onAccent,
      fontWeight: '600',
    },
    messageTimestamp: {
      marginTop: 4,
      fontSize: 11,
      color: palette.muted,
    },
    composerContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: palette.border,
      backgroundColor: palette.card,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: palette.textPrimary,
      backgroundColor: palette.surface,
    },
    sendButton: {
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 12,
      backgroundColor: palette.accent,
    },
    sendButtonPressed: {
      opacity: 0.85,
    },
    sendButtonText: {
      color: palette.onAccent,
      fontWeight: '600',
    },
  });

