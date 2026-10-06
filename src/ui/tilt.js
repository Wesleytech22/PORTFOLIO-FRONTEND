// Inclinação 3D dos cards sob o ponteiro. Usa delegação de eventos, então
// funciona também para os cards que chegam depois, vindos da API.
export function initTilt({ reduceMotion }) {
  if (reduceMotion) return;
  let active = null;

  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.tilt');
    if (active && active !== card) active.style.transform = '';
    active = card;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(6px)`;
  });

  document.addEventListener('pointerleave', () => {
    if (active) active.style.transform = '';
    active = null;
  });
}
