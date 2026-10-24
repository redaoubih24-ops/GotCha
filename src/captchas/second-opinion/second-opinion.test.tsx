import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FIGURES } from './content';
import captcha from './index';

const expectedResult = {
  outcome: 'pass',
  reason:
    'After 3 contradictory corrections across 4 images, the answer key has accepted your perspective.',
  memeTag: 'second-opinion',
};

function renderCaptcha() {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  const Captcha = captcha.Component;
  render(<Captcha onComplete={onComplete} />);

  return { user, onComplete };
}

describe('Second Opinion', () => {
  it('exports three ambiguous figures followed by one obvious circle', () => {
    expect(captcha.id).toBe('second-opinion');
    expect(captcha.title).toBe('Second Opinion');
    expect(captcha.author.trim()).not.toBe('');
    expect(FIGURES).toHaveLength(4);
    expect(FIGURES.map(({ kind }) => kind)).toEqual([
      'ambiguous',
      'ambiguous',
      'ambiguous',
      'obvious',
    ]);
    expect(FIGURES.slice(0, 3).map(({ answers }) => [...answers])).toEqual(
      expect.arrayContaining([
        ['Vase', 'Two faces'],
        ['Duck', 'Rabbit'],
        ['Cube viewed from above', 'Cube viewed from below'],
      ]),
    );
    expect(FIGURES[3].question).toBe('What shape is this?');
    expect(FIGURES[3].answers).toEqual(['Circle', 'Definitely a circle']);
  });

  it('uses two mutually exclusive native radios and waits for Verify before advancing', async () => {
    const { user, onComplete } = renderCaptcha();
    const firstFigure = FIGURES[0];
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(2);
    const groupName = options[0]?.getAttribute('name');
    expect(groupName).toBeTruthy();

    for (const [index, option] of options.entries()) {
      expect(option).toBeInstanceOf(HTMLInputElement);
      expect(option).toHaveAttribute('type', 'radio');
      expect(option).toHaveAttribute('name', groupName);
      expect(option).toHaveAccessibleName(firstFigure.answers[index]);
      expect(option).not.toBeChecked();
    }

    const firstOption = screen.getByRole('radio', { name: firstFigure.answers[0] });
    const secondOption = screen.getByRole('radio', { name: firstFigure.answers[1] });
    const verify = screen.getByRole('button', { name: /^verify$/i });
    expect(verify).toBeDisabled();
    await user.click(verify);
    await user.click(firstOption);
    expect(firstOption).toBeChecked();
    expect(verify).toBeEnabled();
    await user.click(secondOption);
    expect(firstOption).not.toBeChecked();
    expect(secondOption).toBeChecked();
    expect(screen.getByRole('img', { name: firstFigure.alt })).toBeVisible();
    expect(screen.queryByText(/Incorrect\. The correct answer is:/)).not.toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it.each([0, 1] as const)(
    'contradicts answer %i on each ambiguous image, advances immediately, and accepts the final answer',
    async (answerIndex) => {
      const { user, onComplete } = renderCaptcha();
      let previousCorrection: string | undefined;

      for (const [index, figure] of FIGURES.entries()) {
        expect(screen.getByRole('img', { name: figure.alt })).toBeVisible();
        expect(screen.getByRole('heading', { name: figure.question })).toBeVisible();
        expect(screen.queryByRole('button', { name: /next image/i })).not.toBeInTheDocument();
        expect(screen.getAllByRole('radio')).toHaveLength(2);
        for (const option of screen.getAllByRole('radio')) {
          expect(option).not.toBeChecked();
          expect(option).toBeEnabled();
        }

        const verify = screen.getByRole('button', { name: /^verify$/i });
        expect(verify).toBeDisabled();
        await user.click(verify);
        expect(screen.getByRole('img', { name: figure.alt })).toBeVisible();
        expect(onComplete).not.toHaveBeenCalled();

        await user.click(screen.getByRole('radio', { name: figure.answers[answerIndex] }));
        expect(verify).toBeEnabled();
        expect(screen.getByRole('img', { name: figure.alt })).toBeVisible();
        if (previousCorrection) {
          expect(screen.getByRole('status')).toHaveTextContent('Previous image');
          expect(screen.getByRole('status')).toHaveTextContent(previousCorrection);
        }
        expect(onComplete).not.toHaveBeenCalled();

        await user.click(verify);
        expect(onComplete).not.toHaveBeenCalled();

        if (figure.kind === 'ambiguous') {
          const otherAnswer = figure.answers[answerIndex === 0 ? 1 : 0];
          previousCorrection = `Incorrect. The correct answer is: ${otherAnswer}.`;
          expect(screen.getByRole('status')).toHaveTextContent('Previous image');
          expect(screen.getByRole('status')).toHaveTextContent(previousCorrection);
          expect(screen.queryByRole('img', { name: figure.alt })).not.toBeInTheDocument();
          expect(screen.getByRole('img', { name: FIGURES[index + 1].alt })).toBeVisible();
          expect(screen.getAllByRole('radio')[0]).toHaveFocus();
          expect(
            screen.queryByRole('button', { name: /finish verification/i }),
          ).not.toBeInTheDocument();
        } else {
          expect(screen.getByRole('status')).toHaveTextContent('Accepted.');
          expect(screen.getByRole('img', { name: figure.alt })).toBeVisible();
          for (const option of screen.getAllByRole('radio')) expect(option).toBeDisabled();
          const remainingVerify = screen.queryByRole('button', { name: /^verify$/i });
          if (remainingVerify) expect(remainingVerify).toBeDisabled();
        }
      }

      expect(screen.queryByRole('button', { name: /next image/i })).not.toBeInTheDocument();
      const finish = screen.getByRole('button', { name: /finish verification/i });
      await user.dblClick(finish);
      await user.click(finish);
      expect(onComplete).toHaveBeenCalledExactlyOnceWith(expectedResult);
    },
  );

  it('uses each actual selection for the previous-image correction, including alternating choices', async () => {
    const { user, onComplete } = renderCaptcha();
    const choices = [0, 1, 0] as const;

    for (const [index, choice] of choices.entries()) {
      const figure = FIGURES[index];
      await user.click(screen.getByRole('radio', { name: figure.answers[choice] }));
      await user.click(screen.getByRole('button', { name: /^verify$/i }));
      expect(screen.getByRole('status')).toHaveTextContent(
        `Incorrect. The correct answer is: ${figure.answers[choice === 0 ? 1 : 0]}.`,
      );
      expect(screen.getByRole('img', { name: FIGURES[index + 1].alt })).toBeVisible();
      expect(onComplete).not.toHaveBeenCalled();
    }

    expect(screen.getByRole('heading', { name: 'What shape is this?' })).toBeVisible();
    expect(screen.getByRole('button', { name: /^verify$/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /finish verification/i })).not.toBeInTheDocument();
  });

  it('supports keyboard selection and focuses the fresh choices after each automatic advance', async () => {
    const { user, onComplete } = renderCaptcha();
    await user.tab();

    for (const figure of FIGURES) {
      const firstOption = screen.getByRole('radio', { name: figure.answers[0] });
      const secondOption = screen.getByRole('radio', { name: figure.answers[1] });
      expect(firstOption).toHaveFocus();
      expect(firstOption).not.toBeChecked();
      expect(secondOption).not.toBeChecked();
      expect(screen.getByRole('button', { name: /^verify$/i })).toBeDisabled();

      await user.keyboard('[Space]');
      expect(firstOption).toBeChecked();
      await user.keyboard('[ArrowRight]');
      expect(secondOption).toHaveFocus();
      expect(secondOption).toBeChecked();
      expect(firstOption).not.toBeChecked();
      await user.tab();
      expect(screen.getByRole('button', { name: /^verify$/i })).toHaveFocus();
      await user.keyboard('[Enter]');
      expect(onComplete).not.toHaveBeenCalled();

      if (figure.kind === 'ambiguous') {
        expect(screen.getByRole('status')).toHaveTextContent(
          `Incorrect. The correct answer is: ${figure.answers[0]}.`,
        );
      } else {
        expect(screen.getByRole('status')).toHaveTextContent('Accepted.');
      }
    }

    const finish = screen.getByRole('button', { name: /finish verification/i });
    if (document.activeElement !== finish) await user.tab();
    expect(finish).toHaveFocus();
    await user.keyboard('[Enter]');
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expectedResult);
  });
});
