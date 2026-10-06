# Portfólio — Frontend

Página do portfólio 3D (Vite + JavaScript + Three.js). Projetos e serviços não ficam no código:
vêm da API do [backend](https://github.com/Wesleytech22/BACKEND-PORTFOLIO).

```bash
npm install
npm run dev     # http://localhost:5173 (repassa /api para http://localhost:3333)
npm run build   # gera dist/
```

Suba o backend antes; sem ele, as seções Serviços e Projetos mostram o erro com "Tentar de novo".

## Arquitetura

```
src/
  main.js                       liga cada seção data-collection à API e ao componente
  config.js                     URL da API (VITE_API_URL)
  services/http.js              cliente HTTP único (timeout, erro padronizado)
  services/portfolio.service.js um método por coleção da API
  components/                   cards e estados carregando/vazio/erro
  scene/scene.js                cena 3D de fundo
  ui/                           inclinação 3D dos cards e animação de entrada
  styles/main.css
```

## Nova coleção (ex.: certificados)

1. `listCertificates()` em `services/portfolio.service.js`
2. Um card em `components/`
3. Registro em `COLLECTIONS` no `main.js`
4. Uma seção com `data-collection="certificates"` no `index.html`

## Publicação

Hospedagem estática (Vercel, Netlify): build `npm run build`, pasta `dist`, e a variável
`VITE_API_URL` com a URL pública da API (ex.: `https://minha-api.onrender.com/api`).
