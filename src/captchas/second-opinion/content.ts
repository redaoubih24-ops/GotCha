import vaseFaces from './assets/vase-faces.svg';
import neckerCube from './assets/necker-cube.svg';
import duckRabbit from './assets/duck-rabbit.svg';
import finalCircle from './assets/circle.svg';

interface FigureContent {
  id: string;
  image: string;
  alt: string;
  question: string;
  intro: string;
  caption: string;
  answers: readonly [string, string];
}

export type Figure = FigureContent & ({ kind: 'ambiguous' } | { kind: 'obvious' });

// Customize the images, answer labels, questions, and captions here. Each ambiguous
// image rejects one answer and immediately advances. Both interpretations must be valid.
// Keep one obvious image LAST: both final options are correct, so nobody can fail it.
// Describe the visible shapes in alt text so the challenge works without seeing the image.
export const FIGURES: readonly Figure[] = [
  {
    kind: 'ambiguous',
    id: 'vase-faces',
    image: vaseFaces,
    alt: 'A symmetrical black-and-white silhouette: a white central shape shares its curved edges with two black profiles facing each other.',
    question: 'What do you see?',
    intro: 'Both interpretations are valid. The answer key disagrees.',
    caption: 'Same image. Two valid readings.',
    answers: ['Vase', 'Two faces'],
  },
  {
    kind: 'ambiguous',
    id: 'necker-cube',
    image: neckerCube,
    alt: 'An unshaded wireframe cube with every edge equally visible. Nothing marks which face is nearest to the viewer.',
    question: 'What do you see?',
    intro: 'Both interpretations are valid. The answer key disagrees.',
    caption: 'Same image. Two valid readings.',
    answers: ['Cube viewed from above', 'Cube viewed from below'],
  },
  {
    kind: 'ambiguous',
    id: 'duck-rabbit',
    image: duckRabbit,
    alt: 'A reversible animal profile with one eye, a rounded head on the right, and two long horizontal shapes extending to the left.',
    question: 'What do you see?',
    intro: 'Both interpretations are valid. The answer key disagrees.',
    caption: 'Same image. Two valid readings.',
    answers: ['Duck', 'Rabbit'],
  },
  {
    kind: 'obvious',
    id: 'final-circle',
    image: finalCircle,
    alt: 'A single large circle on a plain background.',
    question: 'What shape is this?',
    intro: 'One shape. We believe in you.',
    caption: 'A circle. No interpretive gymnastics required.',
    answers: ['Circle', 'Definitely a circle'],
  },
];
