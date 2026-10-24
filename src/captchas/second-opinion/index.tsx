import { useEffect, useId, useReducer, useRef, useState } from 'react';
import type { CaptchaModule, CaptchaProps } from '../types';
import { FIGURES } from './content';
import './second-opinion.css';

type Choice = 0 | 1;
interface Review {
  figureIndex: number;
  selected: Choice | null;
  totalCorrections: number;
  phase: 'answering' | 'accepted';
  previousCorrection: string | null;
}
type ReviewAction = { type: 'select'; choice: Choice } | { type: 'verify' };

const INITIAL_REVIEW: Review = {
  figureIndex: 0,
  selected: null,
  totalCorrections: 0,
  phase: 'answering',
  previousCorrection: null,
};

function reviewAnswer(review: Review, action: ReviewAction): Review {
  if (action.type === 'select') {
    return review.phase === 'accepted' ? review : { ...review, selected: action.choice };
  }
  if (review.selected === null || review.phase === 'accepted') return review;
  const figure = FIGURES[review.figureIndex];
  if (figure.kind === 'ambiguous') {
    return {
      ...review,
      // Reject once and move straight on. The next image gets its own empty radio group.
      figureIndex: review.figureIndex + 1,
      selected: null,
      totalCorrections: review.totalCorrections + 1,
      // Keep the last verdict visible, and contradict the ACTUAL previous choice.
      previousCorrection: figure.answers[review.selected === 0 ? 1 : 0],
    };
  }
  // The final obvious question accepts BOTH options: it is deliberately impossible to fail.
  return { ...review, phase: 'accepted' };
}

function SecondOpinion({ onComplete }: CaptchaProps) {
  const groupId = useId();
  const [review, dispatch] = useReducer(reviewAnswer, INITIAL_REVIEW);
  const [finished, setFinished] = useState(false);
  const completed = useRef(false);
  const firstChoice = useRef<HTMLInputElement>(null);
  const figure = FIGURES[review.figureIndex];
  const accepted = review.phase === 'accepted';
  const lastImage = review.figureIndex === FIGURES.length - 1;

  useEffect(() => {
    // Automatic advances put keyboard focus on the new choices and announce their question.
    if (review.figureIndex > 0) firstChoice.current?.focus();
  }, [review.figureIndex]);

  function finish() {
    if (!accepted || !lastImage || completed.current) return;
    completed.current = true;
    setFinished(true);
    // Customize the final verdict and memeTag here. Intermediate verdicts stay inside this CAPTCHA.
    onComplete({
      outcome: 'pass',
      reason: `After ${review.totalCorrections} contradictory corrections across ${FIGURES.length} images, the answer key has accepted your perspective.`,
      memeTag: 'second-opinion',
    });
  }

  return (
    <section className="second-opinion" aria-labelledby={`${groupId}-question`}>
      {/* Customize figure-specific copy in content.ts and this pretend department label here. */}
      <div className="second-opinion__topline">
        <p className="second-opinion__eyebrow">Bureau of subjective certainty</p>
        <span className="second-opinion__progress">
          {review.figureIndex + 1} / {FIGURES.length}
        </span>
      </div>
      <h2 className="second-opinion__title" id={`${groupId}-question`}>
        {figure.question}
      </h2>
      <p className="second-opinion__intro" id={`${groupId}-instructions`}>
        {figure.intro}
      </p>

      <figure className="second-opinion__figure">
        <img key={figure.id} src={figure.image} alt={figure.alt} width="480" height="300" />
        <figcaption>{figure.caption}</figcaption>
      </figure>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          dispatch({ type: 'verify' });
        }}
      >
        <fieldset
          key={figure.id}
          className="second-opinion__options"
          aria-labelledby={`${groupId}-question`}
          aria-describedby={`${groupId}-instructions`}
          disabled={accepted || finished}
        >
          <legend className="second-opinion__sr-only">Select an interpretation</legend>
          {figure.answers.map((answer, index) => (
            <label
              className={`second-opinion__choice${review.selected === index ? ' is-selected' : ''}`}
              key={answer}
            >
              <input
                ref={index === 0 ? firstChoice : undefined}
                type="radio"
                name={`${groupId}-${figure.id}-interpretation`}
                value={index}
                checked={review.selected === index}
                onChange={() => dispatch({ type: 'select', choice: index as Choice })}
              />
              <span>{answer}</span>
            </label>
          ))}
        </fieldset>

        <div
          className={`second-opinion__verdict${accepted ? ' is-accepted' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {!accepted && review.previousCorrection && (
            <>
              <span className="second-opinion__review-count">Previous image</span>
              <p>Incorrect. The correct answer is: {review.previousCorrection}.</p>
            </>
          )}
          {accepted && <p>Accepted. The answer key has reconsidered its worldview.</p>}
          {!accepted && !review.previousCorrection && (
            <p>Choose a perspective. Await a very certain opinion.</p>
          )}
        </div>

        <div className="second-opinion__footer">
          <span>{review.totalCorrections} corrections issued</span>
          {!accepted ? (
            <button
              className="second-opinion__button"
              type="submit"
              disabled={review.selected === null}
            >
              Verify
            </button>
          ) : (
            <button
              className="second-opinion__button"
              type="button"
              disabled={finished}
              onClick={finish}
            >
              Finish verification
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

// Keep this id unique, credit your team, and adjust weight to change random-pick odds.
const captcha: CaptchaModule = {
  id: 'second-opinion',
  title: 'Second Opinion',
  author: 'GotCha team',
  weight: 1,
  Component: SecondOpinion,
};

export default captcha;
