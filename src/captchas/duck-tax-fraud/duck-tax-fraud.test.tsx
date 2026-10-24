import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import captcha from './index';

const expectedResult = {
  outcome: 'fail',
  reason: 'Incorrect. That duck is merely an accountant.',
  memeTag: 'default',
};

function renderCaptcha() {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  const Captcha = captcha.Component;
  const view = render(<Captcha onComplete={onComplete} />);

  return {
    ...view,
    user,
    onComplete,
    options: screen.getAllByRole('radio'),
    verify: screen.getByRole('button', { name: /^verify$/i }),
  };
}

describe('Duck Tax Fraud', () => {
  it('exports the module metadata used by discovery and the dev override', () => {
    expect(captcha.id).toBe('duck-tax-fraud');
    expect(captcha.title).toBe('Duck Tax Fraud');
    expect(captcha.author.trim()).not.toBe('');
  });

  it('asks the exact question and shows nine copies of the same duck photograph', () => {
    const { container, options } = renderCaptcha();
    expect(screen.getByRole('heading', { name: 'Which duck committed tax fraud?' })).toBeVisible();

    const photos = [...container.querySelectorAll('img')];
    expect(photos).toHaveLength(9);
    expect(photos[0]?.getAttribute('src')).toBeTruthy();
    expect(new Set(photos.map((photo) => photo.getAttribute('src'))).size).toBe(1);
    expect(options).toHaveLength(9);
  });

  it('uses nine accessibly named native radios in one mutually exclusive group', async () => {
    const { user, options } = renderCaptcha();
    const groupName = options[0]?.getAttribute('name');
    expect(groupName).toBeTruthy();

    for (const [index, option] of options.entries()) {
      expect(option).toBeInstanceOf(HTMLInputElement);
      expect(option).toHaveAttribute('type', 'radio');
      expect(option).toHaveAttribute('name', groupName);
      expect(option).toHaveAccessibleName(`Duck ${index + 1}`);
    }

    await user.click(screen.getByRole('radio', { name: 'Duck 1' }));
    expect(options[0]).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Duck 9' }));
    expect(options[0]).not.toBeChecked();
    expect(options[8]).toBeChecked();
    expect(options.filter((option) => (option as HTMLInputElement).checked)).toHaveLength(1);
  });

  it('does not permit verification before a duck is selected', async () => {
    const { user, verify, onComplete, options } = renderCaptcha();
    expect(options.every((option) => !(option as HTMLInputElement).checked)).toBe(true);
    expect(verify).toBeDisabled();

    await user.click(verify);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('lets the player change their selection without completing until Verify is pressed', async () => {
    const { user, verify, onComplete } = renderCaptcha();

    await user.click(screen.getByRole('radio', { name: 'Duck 2' }));
    expect(verify).toBeEnabled();
    expect(onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('radio', { name: 'Duck 7' }));
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(verify);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expectedResult);
  });

  it.each(Array.from({ length: 9 }, (_, index) => index + 1))(
    'deliberately fails when Duck %i is verified',
    async (duckNumber) => {
      const { user, verify, onComplete } = renderCaptcha();
      await user.click(screen.getByRole('radio', { name: `Duck ${duckNumber}` }));
      expect(onComplete).not.toHaveBeenCalled();

      await user.click(verify);
      expect(onComplete).toHaveBeenCalledExactlyOnceWith(expectedResult);
    },
  );

  it('completes only once when Verify is clicked repeatedly', async () => {
    const { user, verify, onComplete } = renderCaptcha();
    await user.click(screen.getByRole('radio', { name: 'Duck 3' }));
    await user.dblClick(verify);
    await user.click(verify);

    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expectedResult);
  });

  it('supports choosing and verifying a duck with the keyboard', async () => {
    const { user, verify, onComplete } = renderCaptcha();
    const firstDuck = screen.getByRole('radio', { name: 'Duck 1' });
    const secondDuck = screen.getByRole('radio', { name: 'Duck 2' });

    await user.tab();
    expect(firstDuck).toHaveFocus();
    await user.keyboard('[Space]');
    expect(firstDuck).toBeChecked();
    await user.keyboard('[ArrowRight]');
    expect(secondDuck).toBeChecked();
    expect(secondDuck).toHaveFocus();
    expect(firstDuck).not.toBeChecked();
    expect(onComplete).not.toHaveBeenCalled();

    await user.tab();
    expect(verify).toHaveFocus();
    await user.keyboard('[Enter]');
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expectedResult);
  });
});
