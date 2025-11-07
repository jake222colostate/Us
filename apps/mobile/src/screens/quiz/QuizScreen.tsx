import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useToast } from '../../providers/ToastProvider';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useAuthStore, selectSession } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import {
  fetchQuizByOwner,
  fetchQuizWithQuestions,
  submitQuizAttempt,
  type Quiz,
} from '../../api/quizzes';

export type QuizRoute = RouteProp<RootStackParamList, 'Quiz'>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type AnswerState = Record<string, Set<string>>;

const QuizScreen: React.FC = () => {
  const palette = useAppTheme();
  const styles = React.useMemo(() => createStyles(palette), [palette]);
  const session = useAuthStore(selectSession);
  const route = useRoute<QuizRoute>();
  const navigation = useNavigation<NavigationProp>();
  const { show } = useToast();

  const [quiz, setQuiz] = React.useState<Quiz | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [answers, setAnswers] = React.useState<AnswerState>({});

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let loadedQuiz: Quiz | null = null;
        if (route.params?.quizId) {
          loadedQuiz = await fetchQuizWithQuestions(route.params.quizId);
        } else if (route.params?.ownerId) {
          loadedQuiz = await fetchQuizByOwner(route.params.ownerId);
        }
        if (!loadedQuiz) {
          setQuiz(null);
        } else {
          setQuiz(loadedQuiz);
          setAnswers(() =>
            Object.fromEntries(loadedQuiz.questions.map((question) => [question.id, new Set<string>()])),
          );
        }
      } catch (error) {
        console.error('Failed to load quiz', error);
        Alert.alert('Unable to load quiz', 'Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    load().catch((err) => console.warn('quiz load failed', err));
  }, [route.params?.quizId, route.params?.ownerId]);

  const toggleAnswer = React.useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((current) => {
        const currentSet = new Set(current[questionId] ?? []);
        const question = quiz?.questions.find((item) => item.id === questionId);
        if (!question) {
          return current;
        }
        if (question.type === 'single') {
          return { ...current, [questionId]: new Set([optionId]) };
        }
        if (currentSet.has(optionId)) {
          currentSet.delete(optionId);
        } else {
          currentSet.add(optionId);
        }
        return { ...current, [questionId]: currentSet };
      });
    },
    [quiz?.questions],
  );

  const handleSubmit = React.useCallback(async () => {
    if (!quiz) return;

    for (const question of quiz.questions) {
      const set = answers[question.id];
      if (!set || set.size === 0) {
        Alert.alert('Answer all questions', 'Please select an answer for each question.');
        return;
      }
    }

    let score: number | null = null;
    let maxScore: number | null = null;
    if (quiz.is_scored) {
      maxScore = quiz.questions.length;
      score = 0;
      for (const question of quiz.questions) {
        const correctSet = new Set(
          question.options.filter((option) => option.isCorrect).map((option) => option.id),
        );
        const selectedSet = answers[question.id] ?? new Set<string>();
        if (correctSet.size === selectedSet.size && [...correctSet].every((id) => selectedSet.has(id))) {
          score += 1;
        }
      }
    }

    setSubmitting(true);
    try {
      await submitQuizAttempt({
        quizId: quiz.id,
        takerId: session?.user.id ?? null,
        score,
        maxScore,
        answers: quiz.questions.map((question) => ({
          questionId: question.id,
          selectedOptionIds: Array.from(answers[question.id] ?? []),
        })),
      });
      show('Thanks for taking the quiz!');
      navigation.replace('QuizResults', {
        quizId: quiz.id,
        mode: 'taker',
        summary: quiz.is_scored
          ? {
              score,
              maxScore,
              title: quiz.title,
            }
          : {
              score: null,
              maxScore: null,
              title: quiz.title,
            },
      });
    } catch (error) {
      console.error('Failed to submit quiz', error);
      Alert.alert('Unable to submit', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, session?.user.id, navigation, show]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator color={palette.accent} />
        <Text style={styles.loadingText}>Loading quiz…</Text>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <Text style={styles.loadingText}>This quiz is not available right now.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{quiz.title}</Text>
          {quiz.description ? <Text style={styles.subtitle}>{quiz.description}</Text> : null}
          <Text style={styles.helper}>
            {quiz.is_scored
              ? 'Score 1 point for each question you match exactly.'
              : 'Share your preferences — no scores here!'}
          </Text>
        </View>

        {quiz.questions.map((question, index) => {
          const selected = answers[question.id] ?? new Set<string>();
          return (
            <View key={question.id} style={styles.questionCard}>
              <Text style={styles.questionTitle}>
                {index + 1}. {question.prompt}
              </Text>
              <Text style={styles.questionType}>
                {question.type === 'single' ? 'Select one option' : 'Select all that apply'}
              </Text>
              <View style={styles.optionList}>
                {question.options.map((option) => {
                  const isSelected = selected.has(option.id);
                  const marker = question.type === 'single' ? (isSelected ? '●' : '○') : isSelected ? '☑' : '☐';
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.optionRow, isSelected && styles.optionRowActive]}
                      onPress={() => toggleAnswer(question.id, option.id)}
                    >
                      <Text style={[styles.optionMarker, isSelected && styles.optionMarkerActive]}>{marker}</Text>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitLabel}>Submit quiz</Text>
          )}
        </TouchableOpacity>
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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.background,
      gap: 12,
    },
    loadingText: {
      color: palette.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    content: {
      paddingBottom: 48,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
      gap: 8,
    },
    title: {
      color: palette.textPrimary,
      fontSize: 26,
      fontWeight: '700',
    },
    subtitle: {
      color: palette.textSecondary,
      lineHeight: 20,
    },
    helper: {
      color: palette.muted,
      fontSize: 13,
    },
    questionCard: {
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      padding: 16,
      gap: 12,
    },
    questionTitle: {
      color: palette.textPrimary,
      fontWeight: '700',
      fontSize: 18,
    },
    questionType: {
      color: palette.muted,
      fontSize: 13,
    },
    optionList: {
      gap: 10,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: palette.surface,
    },
    optionRowActive: {
      borderColor: palette.accent,
      backgroundColor: palette.accent,
    },
    optionMarker: {
      fontSize: 18,
      color: palette.muted,
    },
    optionMarkerActive: {
      color: '#fff',
    },
    optionLabel: {
      flex: 1,
      color: palette.textPrimary,
    },
    optionLabelActive: {
      color: '#fff',
      fontWeight: '700',
    },
    submitButton: {
      marginHorizontal: 20,
      marginTop: 32,
      backgroundColor: palette.accent,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitLabel: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
  });
}

export default QuizScreen;
