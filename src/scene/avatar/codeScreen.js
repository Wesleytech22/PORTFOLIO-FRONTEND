import * as THREE from 'three';

// Trechos de Android digitados na tela: interface em Compose, comunicação
// em tempo real (MQTT) e repositório offline-first.
const SNIPPETS = [
  {
    file: 'TerminalScreen.kt',
    code: [
      '@Composable',
      'fun TerminalScreen(viewModel: TerminalViewModel) {',
      '    val state by viewModel.state.collectAsState()',
      '',
      '    Column(modifier = Modifier.padding(16.dp)) {',
      '        Text("Terminal ${state.serial}")',
      '        StatusBadge(online = state.isOnline)',
      '        Button(onClick = { viewModel.syncWithMdm() }) {',
      '            Text("Sincronizar com o MDM")',
      '        }',
      '    }',
      '}',
    ].join('\n'),
  },
  {
    file: 'TelemetryClient.kt',
    code: [
      'class TelemetryClient(private val mqtt: MqttClient) {',
      '',
      '    fun connect(deviceId: String) {',
      '        mqtt.connect(MqttConnectOptions().apply {',
      '            isAutomaticReconnect = true',
      '            keepAliveInterval = 30',
      '        })',
      '        mqtt.subscribe("devices/$deviceId/commands") { _, msg ->',
      '            handleCommand(msg.payload.decodeToString())',
      '        }',
      '    }',
      '}',
    ].join('\n'),
  },
  {
    file: 'TerminalRepository.kt',
    code: [
      'class TerminalRepository(',
      '    private val api: TerminalApi,',
      '    private val dao: TerminalDao,',
      ') {',
      '    fun observe(): Flow<List<Terminal>> = dao.observeAll()',
      '',
      '    suspend fun refresh() = withContext(Dispatchers.IO) {',
      '        val remote = api.fetchTerminals()',
      '        dao.upsertAll(remote.map { it.toEntity() })',
      '    }',
      '}',
    ].join('\n'),
  },
];

const W = 1024;
const H = 640;
const HEADER = 58;
const FOOTER = 34;
const LINE = 39;
const GUTTER = 64;
const PAD_X = 20;
const FONT = '600 25px Consolas, "Cascadia Code", "Courier New", monospace';
const VISIBLE_LINES = Math.floor((H - HEADER - FOOTER - 24) / LINE);

const COLORS = {
  text: '#e8ebff',
  keyword: '#c792ea',
  string: '#c3e88d',
  fn: '#82aaff',
  type: '#ffcb6b',
  number: '#f78c6c',
  annotation: '#ffcb6b',
  comment: '#697098',
  punct: '#89ddff',
  gutter: '#4b5577',
};

const KEYWORDS = new Set([
  'fun', 'val', 'var', 'by', 'class', 'private', 'suspend', 'return', 'if', 'else', 'when',
  'object', 'this', 'it', 'true', 'false', 'null',
]);

const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(@\w+)|(\b\d+(?:\.\d+)?\w*)|([A-Za-z_$][\w$]*)|(\s+)|([^\s\w])/g;

// Colore uma linha (mesmo pela metade, enquanto é digitada).
function tokenize(line) {
  const tokens = [];
  for (const m of line.matchAll(TOKEN)) {
    const [text, comment, string, annotation, number, ident] = m;
    let color = COLORS.text;
    if (comment) color = COLORS.comment;
    else if (string) color = COLORS.string;
    else if (annotation) color = COLORS.annotation;
    else if (number) color = COLORS.number;
    else if (ident) {
      const next = line[m.index + text.length];
      if (KEYWORDS.has(ident)) color = COLORS.keyword;
      else if (next === '(' || next === '{' && /^[A-Z]/.test(ident)) color = COLORS.fn;
      else if (/^[A-Z]/.test(ident)) color = COLORS.type;
    } else if (!/^\s+$/.test(text)) color = COLORS.punct;
    tokens.push({ text, color });
  }
  return tokens;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Tela de código: uma CanvasTexture que "digita" os trechos caractere a
// caractere, com pausas naturais, auto-indentação e cursor piscando.
export function createCodeScreen({ onKeystroke, labels = () => ({ typing: '● typing…', idle: '● ready' }) } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  let index = 0;
  let typed = 0;
  let nextAt = 0.8;
  let doneAt = null;
  let lastKeyAt = -1;
  let blink = 0;
  let typing = false;

  function draw() {
    const { file, code } = SNIPPETS[index];
    const lines = code.slice(0, typed).split('\n');
    const cursorLine = lines.length - 1;
    const first = Math.max(0, cursorLine - VISIBLE_LINES + 1);

    ctx.clearRect(0, 0, W, H);
    // Janela do editor
    roundRect(ctx, 4, 4, W - 8, H - 8, 22);
    ctx.fillStyle = 'rgba(6, 12, 26, 0.94)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(25, 227, 208, 0.55)';
    ctx.stroke();

    // Barra de título com os três botões e a aba do arquivo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(6, 6, W - 12, HEADER - 6);
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(34 + i * 26, HEADER / 2 + 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    roundRect(ctx, 120, 14, 300, HEADER - 14, 10);
    ctx.fillStyle = 'rgba(25, 227, 208, 0.12)';
    ctx.fill();
    ctx.font = '600 19px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#cfe9ff';
    ctx.textBaseline = 'middle';
    ctx.fillText(file, 140, HEADER / 2 + 4);

    // Código
    ctx.font = FONT;
    const charW = ctx.measureText('M').width;
    for (let i = first; i < lines.length && i < first + VISIBLE_LINES; i++) {
      const y = HEADER + 24 + (i - first) * LINE + LINE / 2;
      ctx.fillStyle = i === cursorLine ? COLORS.text : COLORS.gutter;
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), GUTTER - 14, y);
      ctx.textAlign = 'left';
      let x = GUTTER + PAD_X;
      for (const token of tokenize(lines[i])) {
        ctx.fillStyle = token.color;
        ctx.fillText(token.text, x, y);
        x += token.text.length * charW;
      }
      if (i === cursorLine && (typing || blink === 0)) {
        ctx.fillStyle = '#19e3d0';
        ctx.fillRect(x + 1, y - 13, 3, 26);
      }
    }

    // Barra de status
    ctx.fillStyle = 'rgba(25, 227, 208, 0.14)';
    ctx.fillRect(6, H - FOOTER - 6, W - 12, FOOTER);
    ctx.font = '600 17px "Segoe UI", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
    ctx.fillStyle = '#9ff5ea';
    ctx.textAlign = 'left';
    const { typing: typingLabel, idle: idleLabel } = labels();
    ctx.fillText(typing ? typingLabel : idleLabel, 24, H - FOOTER / 2 - 6);
    ctx.textAlign = 'right';
    ctx.fillText(`Ln ${cursorLine + 1}, Col ${lines[cursorLine].length + 1}   main`, W - 24, H - FOOTER / 2 - 6);
    ctx.textAlign = 'left';

    texture.needsUpdate = true;
  }

  function update(time) {
    const { code } = SNIPPETS[index];
    let dirty = false;

    if (typed < code.length) {
      while (time >= nextAt && typed < code.length) {
        const ch = code[typed++];
        if (ch === '\n') {
          while (code[typed] === ' ') typed++; // o editor indenta sozinho
          nextAt = time + 0.25 + Math.random() * 0.35;
        } else {
          nextAt = time + 0.035 + Math.random() * 0.075 + (Math.random() < 0.03 ? 0.55 : 0);
          if (ch !== ' ') onKeystroke?.();
        }
        lastKeyAt = time;
        dirty = true;
      }
    } else if (doneAt === null) {
      doneAt = time;
    } else if (time - doneAt > 3.2) {
      index = (index + 1) % SNIPPETS.length;
      typed = 0;
      doneAt = null;
      nextAt = time + 0.7;
      dirty = true;
    }

    const nowTyping = time - lastKeyAt < 0.2;
    const nowBlink = Math.floor(time * 2) % 2;
    if (nowTyping !== typing || nowBlink !== blink) dirty = true;
    typing = nowTyping;
    blink = nowBlink;

    if (dirty) draw();
    return typing;
  }

  // Sem animação (prefers-reduced-motion): mostra o primeiro trecho completo.
  function showAll() {
    typed = SNIPPETS[index].code.length;
    draw();
  }

  draw();
  return { texture, update, showAll, redraw: draw };
}
