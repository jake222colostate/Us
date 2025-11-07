import { getSupabaseClient } from './supabase';

export type QuizOptionRow = {
  id: string;
  question_id: string;
  label: string;
  is_correct: boolean;
  position: number;
};

export type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  prompt: string;
  type: 'single' | 'multiple';
  position: number;
};

export type QuizRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_scored: boolean;
};

export type QuizOption = {
  id: string;
  label: string;
  isCorrect: boolean;
  position: number;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  type: 'single' | 'multiple';
  position: number;
  options: QuizOption[];
};

export type Quiz = QuizRow & {
  questions: QuizQuestion[];
};

export type QuizDraft = {
  id?: string;
  title: string;
  description?: string | null;
  isScored: boolean;
  questions: Array<{
    prompt: string;
    type: 'single' | 'multiple';
    options: Array<{ label: string; isCorrect: boolean }>;
  }>;
};

export async function fetchQuizByOwner(ownerId: string): Promise<Quiz | null> {
  const client = getSupabaseClient();
  const { data: quizRow, error } = await client
    .from('quizzes')
    .select('id, owner_id, title, description, is_scored')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!quizRow) {
    return null;
  }

  return fetchQuizWithQuestions((quizRow as QuizRow).id);
}

export async function fetchQuizWithQuestions(quizId: string): Promise<Quiz | null> {
  const client = getSupabaseClient();
  const { data: quizRow, error } = await client
    .from('quizzes')
    .select('id, owner_id, title, description, is_scored')
    .eq('id', quizId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!quizRow) {
    return null;
  }

  const quiz = quizRow as QuizRow;

  const { data: questionRows, error: questionError } = await client
    .from('quiz_questions')
    .select('id, quiz_id, prompt, type, position')
    .eq('quiz_id', quiz.id)
    .order('position', { ascending: true });

  if (questionError) {
    throw questionError;
  }

  const questions = (questionRows ?? []) as QuizQuestionRow[];
  const questionIds = questions.map((q) => q.id);
  const { data: optionRows, error: optionError } = await client
    .from('quiz_options')
    .select('id, question_id, label, is_correct, position')
    .in('question_id', questionIds.length ? questionIds : ['00000000-0000-0000-0000-000000000000'])
    .order('position', { ascending: true });

  if (optionError) {
    throw optionError;
  }

  const optionMap = new Map<string, QuizOption[]>();
  for (const option of (optionRows ?? []) as QuizOptionRow[]) {
    const list = optionMap.get(option.question_id) ?? [];
    list.push({
      id: option.id,
      label: option.label,
      isCorrect: option.is_correct,
      position: option.position,
    });
    optionMap.set(option.question_id, list);
  }

  const questionsWithOptions: QuizQuestion[] = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    type: question.type,
    position: question.position,
    options: (optionMap.get(question.id) ?? []).sort((a, b) => a.position - b.position),
  }));

  return {
    ...quiz,
    description: quiz.description ?? null,
    questions: questionsWithOptions,
  };
}

export async function saveQuiz(ownerId: string, draft: QuizDraft): Promise<string> {
  const client = getSupabaseClient();
  const payload = {
    owner_id: ownerId,
    title: draft.title,
    description: draft.description ?? null,
    is_scored: draft.isScored,
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>;

  let quizId = draft.id ?? null;
  if (quizId) {
    const { error } = await client.from('quizzes').update(payload).eq('id', quizId);
    if (error) {
      throw error;
    }
  } else {
    const { data, error } = await client
      .from('quizzes')
      .insert(payload)
      .select('id')
      .single();
    if (error) {
      throw error;
    }
    quizId = (data as { id: string }).id;
  }

  if (!quizId) {
    throw new Error('Unable to resolve quiz id');
  }

  await client.from('quiz_questions').delete().eq('quiz_id', quizId);

  if (!draft.questions.length) {
    return quizId;
  }

  const questionInserts = draft.questions.map((question, index) => ({
    quiz_id: quizId,
    prompt: question.prompt,
    type: question.type,
    position: index,
  }));

  const { data: insertedQuestions, error: insertQuestionsError } = await client
    .from('quiz_questions')
    .insert(questionInserts)
    .select('id, position');

  if (insertQuestionsError) {
    throw insertQuestionsError;
  }

  const inserted = (insertedQuestions ?? []) as { id: string; position: number }[];
  const optionPayload: {
    question_id: string;
    label: string;
    is_correct: boolean;
    position: number;
  }[] = [];

  inserted.forEach((row) => {
    const questionDraft = draft.questions[row.position];
    questionDraft.options.forEach((option, optionIndex) => {
      optionPayload.push({
        question_id: row.id,
        label: option.label,
        is_correct: draft.isScored ? option.isCorrect : false,
        position: optionIndex,
      });
    });
  });

  if (optionPayload.length) {
    const { error: optionInsertError } = await client.from('quiz_options').insert(optionPayload);
    if (optionInsertError) {
      throw optionInsertError;
    }
  }

  return quizId;
}

export type QuizAttemptInput = {
  quizId: string;
  takerId?: string | null;
  score: number | null;
  maxScore: number | null;
  answers: Array<{
    questionId: string;
    selectedOptionIds: string[];
  }>;
};

export async function submitQuizAttempt({ quizId, takerId, score, maxScore, answers }: QuizAttemptInput) {
  const client = getSupabaseClient();
  const { data: attemptRow, error: attemptError } = await client
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      taker_id: takerId ?? null,
      score,
      max_score: maxScore,
    })
    .select('id')
    .single();

  if (attemptError) {
    throw attemptError;
  }

  const attemptId = (attemptRow as { id: string }).id;

  if (answers.length) {
    const payload = answers.map((answer) => ({
      attempt_id: attemptId,
      question_id: answer.questionId,
      selected_option_ids: answer.selectedOptionIds,
    }));
    const { error: answersError } = await client.from('quiz_answers').insert(payload);
    if (answersError) {
      throw answersError;
    }
  }

  return attemptId;
}

export type QuizStats = {
  attempts: Array<{ id: string; score: number | null; maxScore: number | null; createdAt: string }>;
  answers: Array<{ attemptId: string; questionId: string; selectedOptionIds: string[] }>;
};

export async function fetchQuizStats(quizId: string): Promise<QuizStats> {
  const client = getSupabaseClient();
  const { data: attemptsData, error: attemptsError } = await client
    .from('quiz_attempts')
    .select('id, score, max_score, created_at')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: false });

  if (attemptsError) {
    throw attemptsError;
  }

  const attempts = (attemptsData ?? []).map((attempt) => ({
    id: attempt.id as string,
    score: (attempt.score as number | null) ?? null,
    maxScore: (attempt.max_score as number | null) ?? null,
    createdAt: attempt.created_at as string,
  }));

  const attemptIds = attempts.map((attempt) => attempt.id);
  if (!attemptIds.length) {
    return { attempts, answers: [] };
  }

  const { data: answersData, error: answersError } = await client
    .from('quiz_answers')
    .select('attempt_id, question_id, selected_option_ids')
    .in('attempt_id', attemptIds);

  if (answersError) {
    throw answersError;
  }

  const answers = (answersData ?? []).map((answer) => ({
    attemptId: answer.attempt_id as string,
    questionId: answer.question_id as string,
    selectedOptionIds: Array.isArray(answer.selected_option_ids)
      ? ((answer.selected_option_ids as string[]) ?? [])
      : [],
  }));

  return { attempts, answers };
}
