// Cria elementos sem innerHTML: todo texto vindo da API entra como
// textContent, então não há risco de injeção de HTML.
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child) node.append(child);
  }
  return node;
}

// Só aceita links http(s) e caminhos locais vindos da API.
export function safeUrl(url) {
  if (!url) return '';
  return /^(https?:\/\/|\/)/i.test(url) ? url : '';
}
