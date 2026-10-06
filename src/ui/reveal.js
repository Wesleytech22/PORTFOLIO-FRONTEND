// Faz os elementos aparecerem ao entrar na tela. observe() pode ser
// chamado de novo para elementos adicionados depois (cards da API).
export function createReveal() {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }),
    { threshold: 0.12 }
  );

  return {
    observe(root = document, selector = '.panel h2, .panel .card, .panel > p, .panel .grid > p, .panel .links') {
      root.querySelectorAll(selector).forEach((node) => {
        if (node.classList.contains('reveal')) return;
        node.classList.add('reveal');
        observer.observe(node);
      });
    },
  };
}
