// Roteiro da história: onde o avatar para (x, em metros), a pose ao falar e
// se há um painel de marco. Os textos ficam em i18n: story.<id>.text,
// story.<id>.year e story.<id>.label.
export const CHAPTERS = [
  { id: 'intro', x: 0, pose: 'wave' },
  { id: 'college', x: 2.6, pose: 'talk', milestone: true },
  { id: 'support', x: 5.2, pose: 'talk', milestone: true },
  { id: 'dev', x: 7.8, pose: 'talk', milestone: true },
  { id: 'postgrad', x: 10.4, pose: 'talk', milestone: true },
  { id: 'future', x: 13, pose: 'wave', milestone: true, cta: true },
];

export const START_X = -2.2; // ele entra andando pela esquerda
