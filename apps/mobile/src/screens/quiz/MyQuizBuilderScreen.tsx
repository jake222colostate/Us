import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useToast } from '../../providers/ToastProvider';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useAuthStore, selectSession } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { fetchQuizByOwner, saveQuiz, type Quiz } from '../../api/quizzes';

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 10;

function uuid() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Crypto.randomUUID();
}

type BuilderOption = { id: string; label: string; isCorrect: boolean };
type BuilderQuestion = {
  id: string;
  prompt: string;
  type: 'single' | 'multiple';
  options: BuilderOption[];
};

type QuizDraftState = {
  id?: string;
  title: string;
  description: string;
  isScored: boolean;
  questions: BuilderQuestion[];
};

const defaultOption = (): BuilderOption => ({ id: uuid(), label: '', isCorrect: false });

const defaultQuestion = (): BuilderQuestion => ({
  id: uuid(),
  prompt: '',
  type: 'single',
  options: [defaultOption(), defaultOption(), defaultOption()],
});

function mapQuizToDraft(quiz: Quiz): QuizDraftState {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description ?? '',
    isScored: quiz.is_scored,
    questions: quiz.questions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        options: question.options
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((option) => ({ id: option.id, label: option.label, isCorrect: option.isCorrect })),
      })),
  };
}

const MyQuizBuilderScreen: React.FC = () => {
  const session = useAuthStore(selectSession);
  const palette = useAppTheme();
  const styles = React.useMemo(() => createStyles(palette), [palette]);
  const { show } = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [draft, setDraft] = React.useState<QuizDraftState>({
    title: '',
    description: '',
    isScored: true,
    questions: [defaultQuestion(), defaultQuestion(), defaultQuestion()],
  });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const loadQuiz = async () => {
      if (!session) return;
      setLoading(true);
      try {
        const quiz = await fetchQuizByOwner(session.user.id);
        if (quiz) {
          setDraft(mapQuizToDraft(quiz));
        }
      } catch (error) {
        console.warn('Failed to load quiz', error);
        show('Unable to load your quiz. Start fresh below.');
      } finally {
        setLoading(false);
      }
    };
    loadQuiz().catch((err) => console.warn('Quiz load failed', err));
  }, [session, show]);

  const updateQuestion = React.useCallback((questionId: string, updater: (question: BuilderQuestion) => BuilderQuestion) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    }));
  }, []);

  const addQuestion = React.useCallback(() => {
    setDraft((current) => {
      if (current.questions.length >= MAX_QUESTIONS) {
        show(`You can add up to ${MAX_QUESTIONS} questions.`);
        return current;
      }
      return {
        ...current,
        questions: [...current.questions, defaultQuestion()],
      };
    });
  }, [show]);

  const removeQuestion = React.useCallback(
    (questionId: string) => {
      setDraft((current) => {
        if (current.questions.length <= MIN_QUESTIONS) {
          show(`A quiz needs at least ${MIN_QUESTIONS} questions.`);
          return current;
        }
        return {
          ...current,
          questions: current.questions.filter((question) => question.id !== questionId),
        };
      });
    },
    [show],
  );

  const moveQuestion = React.useCallback((questionId: string, direction: -1 | 1) => {
    setDraft((current) => {
      const index = current.questions.findIndex((question) => question.id === questionId);
      if (index === -1) return current;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= current.questions.length) {
        return current;
      }
      const nextQuestions = current.questions.slice();
      const [item] = nextQuestions.splice(index, 1);
      nextQuestions.splice(newIndex, 0, item);
      return {
        ...current,
        questions: nextQuestions,
      };
    });
  }, []);

  const addOption = React.useCallback((questionId: string) => {
    updateQuestion(questionId, (question) => {
      if (question.options.length >= 6) {
        show('Limit each question to six options.');
        return question;
      }
      return {
        ...question,
        options: [...question.options, defaultOption()],
      };
    });
  }, [show, updateQuestion]);

  const removeOption = React.useCallback(
    (questionId: string, optionId: string) => {
      updateQuestion(questionId, (question) => {
        if (question.options.length <= 2) {
          show('Each question needs at least two options.');
          return question;
        }
        return {
          ...question,
          options: question.options.filter((option) => option.id !== optionId),
        };
      });
    },
    [show, updateQuestion],
  );

  const toggleOptionCorrect = React.useCallback(
    (questionId: string, optionId: string) => {
      updateQuestion(questionId, (question) => {
        if (!draft.isScored) {
          return question;
        }
        if (question.type === 'single') {
          return {
            ...question,
            options: question.options.map((option) => ({
              ...option,
              isCorrect: option.id === optionId,
            })),
          };
        }
        return {
          ...question,
          options: question.options.map((option) =>
            option.id === optionId ? { ...option, isCorrect: !option.isCorrect } : option,
          ),
        };
      });
    },
    [draft.isScored, updateQuestion],
  );

  const validateDraft = React.useCallback(() => {
    const errors: string[] = [];
    if (!draft.title.trim()) {
      errors.push('Add a quiz title.');
    }
    if (draft.questions.length < MIN_QUESTIONS) {
      errors.push(`Add at least ${MIN_QUESTIONS} questions.`);
    }
    if (draft.questions.length > MAX_QUESTIONS) {
      errors.push(`You can only have up to ${MAX_QUESTIONS} questions.`);
    }

    draft.questions.forEach((question, index) => {
      if (!question.prompt.trim()) {
        errors.push(`Question ${index + 1} needs a prompt.`);
      }
      if (question.options.length < 2) {
        errors.push(`Question ${index + 1} needs at least two options.`);
      }
      question.options.forEach((option, optionIndex) => {
        if (!option.label.trim()) {
          errors.push(`Option ${optionIndex + 1} in question ${index + 1} needs text.`);
        }
      });
      if (draft.isScored) {
        const correctCount = question.options.filter((option) => option.isCorrect).length;
        if (correctCount === 0) {
          errors.push(`Mark at least one correct option for question ${index + 1}.`);
        }
        if (question.type === 'single' && correctCount !== 1) {
          errors.push(`Single choice question ${index + 1} needs exactly one correct option.`);
        }
      }
    });

    return errors;
  }, [draft]);

  const handleSave = React.useCallback(async () => {
    if (!session) {
      Alert.alert('Sign in required', 'You need to sign in to save your quiz.');
      return;
    }
    const errors = validateDraft();
    if (errors.length) {
      Alert.alert('Fix your quiz', errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      const quizId = await saveQuiz(session.user.id, {
        id: draft.id,
        title: draft.title.trim(),
        description: draft.description.trim(),
        isScored: draft.isScored,
        questions: draft.questions.map((question) => ({
          prompt: question.prompt.trim(),
          type: question.type,
          options: question.options.map((option) => ({
            label: option.label.trim(),
            isCorrect: option.isCorrect,
          })),
        })),
      });
      setDraft((current) => ({ ...current, id: quizId }));
      show('Quiz saved! Share it from your profile or feed card.');
    } catch (error) {
      console.error('Failed to save quiz', error);
      Alert.alert('Unable to save', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }, [session, validateDraft, draft, show]);

  const goToResults = React.useCallback(() => {
    if (!draft.id) {
      Alert.alert('Save your quiz first', 'Save your quiz before viewing stats.');
      return;
    }
    navigation.navigate('QuizResults', { quizId: draft.id, mode: 'owner' });
  }, [draft.id, navigation]);

  if (!session) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.centeredText}>Sign in to create your quiz.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={palette.accent} />
          <Text style={styles.loadingText}>Loading your quiz…</Text>
        </View>
      ) : null}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Design your quiz</Text>
          <Text style={styles.subtitle}>Create up to ten questions that anyone can take for free.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Quiz title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Guess my perfect day"
            value={draft.title}
            onChangeText={(text) => setDraft((current) => ({ ...current, title: text }))}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Short description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Share what this quiz is about"
            value={draft.description}
            multiline
            onChangeText={(text) => setDraft((current) => ({ ...current, description: text }))}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Scored quiz</Text>
            <Text style={styles.helper}>
              {draft.isScored
                ? 'We’ll track correct answers and show a score.'
                : 'No scores, just preferences. Switch on to mark correct answers.'}
            </Text>
          </View>
          <Switch
            value={draft.isScored}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                isScored: value,
                questions: value
                  ? current.questions
                  : current.questions.map((question) => ({
                      ...question,
                      options: question.options.map((option) => ({ ...option, isCorrect: false })),
                    })),
              }))
            }
          />
        </View>

        {draft.questions.map((question, index) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionTitle}>Question {index + 1}</Text>
              <View style={styles.questionActions}>
                <TouchableOpacity onPress={() => moveQuestion(question.id, -1)} disabled={index === 0}>
                  <Text style={[styles.actionText, index === 0 && styles.actionDisabled]}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveQuestion(question.id, 1)}
                  disabled={index === draft.questions.length - 1}
                >
                  <Text
                    style={[
                      styles.actionText,
                      index === draft.questions.length - 1 && styles.actionDisabled,
                    ]}
                  >
                    ↓
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeQuestion(question.id)}>
                  <Text style={[styles.actionText, styles.dangerText]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Ask something fun or revealing"
              value={question.prompt}
              multiline
              onChangeText={(text) =>
                updateQuestion(question.id, (current) => ({ ...current, prompt: text }))
              }
            />

            <View style={styles.typeRow}>
              <Text style={styles.label}>Response type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  onPress={() =>
                    updateQuestion(question.id, (current) => ({
                      ...current,
                      type: 'single',
                      options: current.options.map((option, optionIndex) => ({
                        ...option,
                        isCorrect: draft.isScored && optionIndex === 0,
                      })),
                    }))
                  }
                  style={[
                    styles.typeButton,
                    question.type === 'single' && styles.typeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeButtonLabel,
                      question.type === 'single' && styles.typeButtonLabelActive,
                    ]}
                  >
                    Single choice
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    updateQuestion(question.id, (current) => ({
                      ...current,
                      type: 'multiple',
                      options: current.options.map((option) => ({
                        ...option,
                        isCorrect: draft.isScored ? option.isCorrect : false,
                      })),
                    }))
                  }
                  style={[
                    styles.typeButton,
                    question.type === 'multiple' && styles.typeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeButtonLabel,
                      question.type === 'multiple' && styles.typeButtonLabelActive,
                    ]}
                  >
                    Multiple choice
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsList}>
              {question.options.map((option) => (
                <View key={option.id} style={styles.optionRow}>
                  <TouchableOpacity
                    style={[
                      styles.optionBadge,
                      draft.isScored && option.isCorrect && styles.optionBadgeActive,
                    ]}
                    onPress={() => toggleOptionCorrect(question.id, option.id)}
                    disabled={!draft.isScored}
                  >
                    <Text style={styles.optionBadgeText}>
                      {draft.isScored
                        ? option.isCorrect
                          ? question.type === 'single'
                            ? '●'
                            : '☑'
                          : question.type === 'single'
                          ? '○'
                          : '☐'
                        : '–'}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.optionInput]}
                    placeholder="Option label"
                    value={option.label}
                    onChangeText={(text) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        options: current.options.map((item) =>
                          item.id === option.id ? { ...item, label: text } : item,
                        ),
                      }))
                    }
                  />
                  <TouchableOpacity onPress={() => removeOption(question.id, option.id)}>
                    <Text style={[styles.actionText, styles.dangerText]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.addOptionButton} onPress={() => addOption(question.id)}>
              <Text style={styles.addOptionLabel}>+ Add option</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addQuestionButton} onPress={addQuestion}>
          <Text style={styles.addQuestionLabel}>+ Add another question</Text>
        </TouchableOpacity>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonLabel}>Save quiz</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={goToResults}>
            <Text style={styles.secondaryButtonLabel}>View results</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Anyone can take your quiz for free. Their results appear here in real time.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scroll: {
      flex: 1,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.background,
      padding: 24,
    },
    centeredText: {
      color: palette.textPrimary,
      textAlign: 'center',
      fontSize: 16,
    },
    loadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: palette.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      marginHorizontal: 16,
      marginTop: 16,
    },
    loadingText: {
      color: palette.textSecondary,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 48,
      alignItems: 'stretch',
      gap: 24,
    },
    header: {
      width: '100%',
      paddingTop: 24,
      paddingBottom: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      color: palette.muted,
      lineHeight: 20,
    },
    fieldGroup: {
      width: '100%',
    },
    label: {
      color: palette.textPrimary,
      fontWeight: '700',
      marginBottom: 8,
    },
    helper: {
      color: palette.textSecondary,
      lineHeight: 18,
    },
    input: {
      backgroundColor: palette.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      color: palette.textPrimary,
    },
    multiline: {
      minHeight: 72,
      textAlignVertical: 'top',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
      flexWrap: 'wrap',
    },
    questionCard: {
      width: '100%',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      gap: 16,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    questionTitle: {
      color: palette.textPrimary,
      fontWeight: '700',
      fontSize: 18,
    },
    questionActions: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
    actionText: {
      color: palette.textPrimary,
      fontWeight: '700',
    },
    actionDisabled: {
      color: palette.muted,
    },
    dangerText: {
      color: palette.danger,
    },
    typeRow: {
      flexDirection: 'column',
      gap: 12,
    },
    typeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeButton: {
      flexGrow: 1,
      minWidth: '48%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeButtonActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    typeButtonLabel: {
      color: palette.textSecondary,
      fontWeight: '600',
    },
    typeButtonLabelActive: {
      color: '#fff',
    },
    optionsList: {
      gap: 12,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    },
    optionBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
    },
    optionBadgeActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    optionBadgeText: {
      color: palette.textPrimary,
      fontWeight: '700',
    },
    optionInput: {
      flex: 1,
    },
    addOptionButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    addOptionLabel: {
      color: palette.accent,
      fontWeight: '600',
    },
    addQuestionButton: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.accent,
      alignItems: 'center',
      backgroundColor: palette.surface,
    },
    addQuestionLabel: {
      color: palette.accent,
      fontWeight: '700',
    },
    footerActions: {
      width: '100%',
      flexDirection: 'row',
      gap: 12,
    },
    saveButton: {
      flex: 1,
      backgroundColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonLabel: {
      color: '#fff',
      fontWeight: '700',
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    secondaryButtonLabel: {
      color: palette.textPrimary,
      fontWeight: '600',
    },
    footerNote: {
      width: '100%',
      marginTop: 16,
      color: palette.muted,
      textAlign: 'center',
      marginBottom: 40,
    },
  });
}

export default MyQuizBuilderScreen;
