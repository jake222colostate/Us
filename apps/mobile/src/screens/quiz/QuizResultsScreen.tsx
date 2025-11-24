import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { fetchQuizStats, fetchQuizWithQuestions, type Quiz } from '../../api/quizzes';

export type QuizResultsRoute = RouteProp<RootStackParamList, 'QuizResults'>;

type OwnerStats = {
  totalAttempts: number;
  averageScore: number | null;
  questionBreakdown: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string; percentage: number }>;
  }>;
};

const QuizResultsScreen: React.FC = () => {
  const palette = useAppTheme();
  const styles = React.useMemo(() => createStyles(palette), [palette]);
  const route = useRoute<QuizResultsRoute>();
  const params = route.params ?? { quizId: '', mode: 'owner' as const };

  const [quiz, setQuiz] = React.useState<Quiz | null>(null);
  const [stats, setStats] = React.useState<OwnerStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  const mode = params.mode;

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (mode === 'owner') {
          const [quizRecord, quizStats] = await Promise.all([
            fetchQuizWithQuestions(params.quizId),
            fetchQuizStats(params.quizId),
          ]);
          if (quizRecord) {
            setQuiz(quizRecord);
            const totalAttempts = quizStats.attempts.length;
            const scoredAttempts = quizStats.attempts.filter(
              (attempt) => attempt.maxScore != null && attempt.score != null,
            );
            const averageScore = scoredAttempts.length
              ? scoredAttempts.reduce((acc, attempt) => acc + (attempt.score ?? 0), 0) /
                scoredAttempts.length
              : null;

            const questionBreakdown = quizRecord.questions.map((question) => {
              const optionCounts = new Map<string, number>();
              quizStats.answers.forEach((answer) => {
                if (answer.questionId !== question.id) return;
                answer.selectedOptionIds.forEach((optionId) => {
                  optionCounts.set(optionId, (optionCounts.get(optionId) ?? 0) + 1);
                });
              });
              const options = question.options.map((option) => {
                const count = optionCounts.get(option.id) ?? 0;
                const percentage = totalAttempts ? Math.round((count / totalAttempts) * 100) : 0;
                return { id: option.id, label: option.label, percentage };
              });
              return { id: question.id, prompt: question.prompt, options };
            });

            setStats({ totalAttempts, averageScore, questionBreakdown });
          }
        } else if (mode === 'taker') {
          const quizRecord = await fetchQuizWithQuestions(params.quizId);
          if (quizRecord) {
            setQuiz(quizRecord);
          }
        }
      } catch (error) {
        console.error('Failed to load quiz results', error);
      } finally {
        setLoading(false);
      }
    };
    load().catch((err) => console.warn('results load failed', err));
  }, [mode, params.quizId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator color={palette.accent} />
        <Text style={styles.loadingText}>Fetching quiz results…</Text>
      </SafeAreaView>
    );
  }

  if (mode === 'taker') {
    const summary = params.summary;
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{summary?.title ?? quiz?.title ?? 'Quiz results'}</Text>
            <Text style={styles.subtitle}>Thanks for sharing your answers!</Text>
          </View>
          {summary?.score != null && summary?.maxScore != null ? (
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>
                {summary.score}/{summary.maxScore}
              </Text>
              <Text style={styles.scoreHelper}>We’ll let the owner know how you did.</Text>
            </View>
          ) : (
            <View style={styles.scoreCard}>
              <Text style={styles.scoreHelper}>This quiz isn’t scored—your preferences were shared.</Text>
            </View>
          )}
          <Text style={styles.footerNote}>Feel free to chat with them about your answers!</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!quiz || !stats) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <Text style={styles.loadingText}>No quiz data available yet.</Text>
      </SafeAreaView>
    );
  }

  const averageScoreText =
    stats.averageScore != null && quiz.is_scored
      ? `${stats.averageScore.toFixed(2)} / ${quiz.questions.length}`
      : 'N/A';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{quiz.title}</Text>
          <Text style={styles.subtitle}>Quiz stats from your community</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Attempts</Text>
            <Text style={styles.summaryValue}>{stats.totalAttempts}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Average score</Text>
            <Text style={styles.summaryValue}>{averageScoreText}</Text>
          </View>
        </View>

        {stats.questionBreakdown.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionTitle}>{question.prompt}</Text>
            <View style={styles.optionBreakdown}>
              {question.options.map((option) => (
                <View key={option.id} style={styles.breakdownRow}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionPercent}>{option.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footerNote}>
          Only you can see individual attempt stats. Encourage more people to take your quiz!
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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.background,
      gap: 12,
      paddingHorizontal: 24,
    },
    loadingText: {
      color: palette.textSecondary,
      textAlign: 'center',
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
    },
    scoreCard: {
      marginHorizontal: 20,
      marginTop: 24,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      padding: 24,
      alignItems: 'center',
      gap: 12,
    },
    scoreLabel: {
      color: palette.muted,
      fontSize: 14,
    },
    scoreValue: {
      fontSize: 32,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    scoreHelper: {
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    footerNote: {
      marginHorizontal: 20,
      marginTop: 24,
      color: palette.muted,
      textAlign: 'center',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginHorizontal: 20,
      marginTop: 16,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 6,
    },
    summaryLabel: {
      color: palette.muted,
      fontSize: 13,
    },
    summaryValue: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    questionCard: {
      marginHorizontal: 20,
      marginTop: 24,
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
    optionBreakdown: {
      gap: 10,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: palette.surface,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    optionLabel: {
      color: palette.textPrimary,
      flex: 1,
      marginRight: 12,
    },
    optionPercent: {
      color: palette.textSecondary,
      fontVariant: ['tabular-nums'],
      fontWeight: '600',
    },
  });
}

export default QuizResultsScreen;
