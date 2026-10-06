# Portfólio — Frontend

Portfólio 3D de Wesley Rodrigues Dias, desenvolvedor mobile (Vite + JavaScript + Three.js), em
**português, inglês e chinês**. Projetos, serviços e experiências não ficam no código: vêm traduzidos da
API do [backend](https://github.com/Wesleytech22/BACKEND-PORTFOLIO).

```bash
npm install
npm run dev     # http://localhost:5173 (repassa /api para http://localhost:3333)
npm run build   # gera dist/
```

Suba o backend antes; sem ele, as seções vindas da API mostram o erro com "Tentar de novo".

## Destaques

- **Avatar 3D digitando código:** personagem modelado a partir da foto (pele, cabelo, óculos, cavanhaque,
  polo branca, tênis e relógio) digita Kotlin numa tela holográfica, com cores de sintaxe e auto-indentação.
  As teclas acendem a cada toque, ele olha para quem passa o mouse (ou toca) e pausa fora da tela.
- **Modo história:** ao clicar em "Sobre" (menu) ou em "Ouvir minha história", o avatar se levanta, entra
  andando e para em cada marco da trajetória (faculdade, suporte, desenvolvimento, pós em Mobile Engineering)
  contando aquela parte num balão de fala. Navegação por botões, pontos ou setas; Esc fecha.
  Roteiro em `src/scene/story/chapters.js` e textos em `story.*` nos idiomas.
- **Três idiomas:** seletor PT · EN · 中文 no topo. A escolha fica salva, e `?lang=en` ou `?lang=zh`
  no link abre a página já traduzida (bom para enviar a recrutadores).
- **Contato pelo Telegram:** o formulário envia à API, que avisa no Telegram na hora.

## Arquitetura

```
src/
  main.js                       inicia tudo e liga cada seção data-collection à API
  config.js                     URL da API e avatar .glb opcional (variáveis VITE_*)
  i18n/                         idiomas: index.js (troca, detecção) e locales/pt|en|zh.js
  services/http.js              cliente HTTP único (timeout, erro padronizado)
  services/portfolio.service.js um método por coleção da API, já no idioma da página
  components/                   cards e estados carregando/vazio/erro
  scene/scene.js                fundo 3D da página
  scene/avatar/                 avatar: character (poses sentado/em pé/andando/falando/acenando), workstation, codeScreen, customAvatar, index
  scene/story/                  modo história: chapters (roteiro), stage (palco e painéis), index (controle)
  ui/                           inclinação 3D, animação de entrada e formulário de contato
  styles/main.css
```

## Avatar realista com o seu rosto (opcional)

O avatar padrão é modelado em código. Para usar um modelo 3D gerado da sua foto:

1. Gere um avatar `.glb` a partir de uma selfie (por exemplo, no Avaturn).
2. No Mixamo, aplique a animação **Typing** (sentado digitando) e exporte em `.glb`
   (ou converta o `.fbx` para `.glb`).
3. Salve como `public/models/avatar.glb` e defina no `.env`: `VITE_AVATAR_MODEL_URL=/models/avatar.glb`.

A mesa, a tela de código e as luzes continuam; só o personagem é trocado. Se o arquivo não carregar,
a página volta para o avatar modelado em código.

## Traduzir um texto novo

Textos fixos do HTML usam `data-i18n="chave"`. Acrescente a chave nos três arquivos de `src/i18n/locales/`.
O conteúdo vindo da API é traduzido no backend (campo `i18n` de cada item).

## Nova coleção (ex.: certificados)

1. `listCertificates: () => list('certificates')` em `services/portfolio.service.js`
2. Um card em `components/`
3. Registro em `COLLECTIONS` no `main.js` e a chave `empty.certificates` nos idiomas
4. Uma seção com `data-collection="certificates"` no `index.html`

## Publicação

Hospedagem estática (Vercel, Netlify): build `npm run build`, pasta `dist`, e a variável
`VITE_API_URL` com a URL pública da API (ex.: `https://minha-api.onrender.com/api`).
