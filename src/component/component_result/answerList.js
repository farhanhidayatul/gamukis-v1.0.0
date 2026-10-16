import React from 'react';
import '../../pages/result.css';
import { questions } from '../component_game/questions';
import AnswerCard from './molecules/AnswerCard';

const getQuestionData = (itemOrText) => {
  if (!itemOrText) return null;
  if (typeof itemOrText === 'object') {
    const index = itemOrText.questionIndex ?? itemOrText._index ?? itemOrText.questionId ?? itemOrText._id;
    if (index !== undefined && index !== null && !isNaN(Number(index))) {
      return questions[Number(index)] ?? null;
    }
    itemOrText = itemOrText.question ?? itemOrText.soal ?? itemOrText.prompt ?? null;
    if (!itemOrText) return null;
  }
  const text = String(itemOrText);
  return (
    questions.find((question) => question.question === text) ||
    questions.find((question) => question.question && text.includes(question.question)) ||
    questions.find((question) => question.question && question.question.includes(text)) ||
    null
  );
};

const getQuestionText = (item) => {
  if (!item) return '-';
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  return item.question ?? item.soal ?? item.prompt ?? item.title ?? item.text ?? '-';
};

const AnswerList = ({ answers = [] }) => {
  return (
    <div className="additional-info">
      {answers.length === 0 && <p>Belum ada data jawaban.</p>}
      {answers.map((item, index) => {
        const questionText = getQuestionText(item);
        const questionData = getQuestionData(item.question || item.soal || item.prompt || questionText);
        const options = (Array.isArray(item.options) && item.options.length > 0 ? item.options : null)
          ?? (Array.isArray(item.optionsList) && item.optionsList.length > 0 ? item.optionsList : null)
          ?? questionData?.options
          ?? [item.answer ?? item.selectedAnswer ?? '-', '-', '-'];
        const correctText = item.correctAnswer
          ?? item.correctText
          ?? (typeof item.correct === 'string' ? item.correct : null)
          ?? questionData?.correct
          ?? '';
        const selectedText = String(item.answer ?? item.selectedAnswer ?? item.userAnswer ?? '');
        const isCorrectAnswer = item._status === 'correct' || item.correct === true;

        return (
          <AnswerCard
            key={`question-${index}`}
            question={questionText}
            options={options}
            statusClass={isCorrectAnswer ? 'answer-card-correct' : 'answer-card-incorrect'}
            getOptionClass={(option) => {
              const isCorrectOption = option === correctText;
              const isSelectedOption = selectedText === String(option);
              return [
                isCorrectOption ? 'answer-option-correct' : 'answer-option-muted',
                isSelectedOption && !isCorrectOption ? 'answer-option-incorrect' : ''
              ].filter(Boolean).join(' ');
            }}
          />
        );
      })}
    </div>
  );
};

export default AnswerList;
