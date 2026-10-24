# GotCha voice

GotCha is a fake login and an absurd CAPTCHA playground. The joke is an overly
confident security system with spectacularly bad judgment. The person using it is
always in on the joke.

- **Dry, friendly, a little suspicious.** “You had us at human.”
- **Tiny stakes, big certainty.** “Our totally scientific system has concerns.”
- **Short sentences.** Button labels explain the next action: “Try again” and
  “Back to login”.
- **Make failure funny, never personal.** Question the fictional machine’s logic,
  not someone’s ability, appearance, identity, or intelligence.
- **Disclose the bit.** This is a demo. Never ask for real credentials, imply that
  authentication succeeded, or pretend to save account information.
- **Keep it accessible.** The joke should work without sound, animation, color,
  or perfect vision. Honor reduced motion and the sound toggle.

## Examples

| Situation                 | Say                                              |
| ------------------------- | ------------------------------------------------ |
| Login introduction        | You had us at human.                             |
| Start a challenge         | Let’s prove it                                   |
| An impossible requirement | Select every image containing existential dread. |
| Failure                   | Certified suspicious.                            |
| An unexpected pass        | A human? In this economy?                        |
| Return to the start       | Back to square one. As planned.                  |

## Visual voice

Comic-book loud: sunny yellow paper with halftone dots, hot pink, electric
blue, near-black ink. Bangers for headlines, Comic Neue for everything else.
Chunky ink outlines, lopsided corners, hard offset shadows, and slightly wobbly
edges (the `#gotcha-rough` SVG filter in `index.html`, applied in `rough.css`). The checkbox mascot is an original drawing. Use
the variables in `tokens.css` in each CAPTCHA instead of inventing a new palette.
