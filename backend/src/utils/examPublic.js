/**
 * Strip answer keys before sending placement questions to the client.
 */
export function toPublicExamQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => {
    const { correctIndex, correctAnswer, answer, ...rest } = q;
    return rest;
  });
}
