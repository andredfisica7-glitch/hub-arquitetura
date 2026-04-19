// ═══════════════════════════════════════════════════════════
// ETAPA 9 — Integração Firebase (Firestore)
// Resultado: ao salvar uma evolução, o app envia automaticamente
//            para o Firestore. Funciona offline com fila de envio.
// Rodar: node scripts/evolucoes/e9.js
// ═══════════════════════════════════════════════════════════
const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../../app-evolucoes.html');
let html   = fs.readFileSync(FILE, 'utf8');

// ── Credenciais Firebase ──
const FB_CONFIG = {
  apiKey:            'AIzaSyAdJ-WnynzuPQNd3NHT7en_BSmsm6SpcLE',
  authDomain:        'app-evolucoes-de-aluno.firebaseapp.com',
  projectId:         'app-evolucoes-de-aluno',
  storageBucket:     'app-evolucoes-de-aluno.firebasestorage.app',
  messagingSenderId: '405320356686',
  appId:             '1:405320356686:web:902dc9712da7e65d5c841f',
  measurementId:     'G-M744V8SNNC',
};

// ── 1. Adicionar SDK Firebase (compat) antes de </head> ──
const SDK_TAGS = `
  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
`;

if (html.includes('firebase-app-compat.js')) {
  console.log('⚠️  SDK Firebase já presente — pulando inserção de tags.');
} else {
  html = html.replace('</head>', SDK_TAGS + '</head>');
  console.log('✔  SDK Firebase adicionado ao <head>');
}

// ── 2. Bloco Firebase: init + envio + indicador de status ──
const FB_BLOCK = `
    // ── FIREBASE ──

    var _fbApp = null;
    var _fbDb  = null;
    var _fbOnline = false;

    (function initFirebase() {
      var cfg = {
        apiKey:            '${FB_CONFIG.apiKey}',
        authDomain:        '${FB_CONFIG.authDomain}',
        projectId:         '${FB_CONFIG.projectId}',
        storageBucket:     '${FB_CONFIG.storageBucket}',
        messagingSenderId: '${FB_CONFIG.messagingSenderId}',
        appId:             '${FB_CONFIG.appId}',
      };
      try {
        _fbApp = firebase.initializeApp(cfg);
        _fbDb  = firebase.firestore();

        // Habilita persistência offline — fila automática ao reconectar
        _fbDb.enablePersistence({ synchronizeTabs: false })
          .catch(function() {}); // ignora erro se já habilitado

        // Monitora status de conexão
        _fbDb.collection('_heartbeat').doc('status')
          .onSnapshot(function() {
            _fbOnline = true;
            _atualizarIndicadorFb('online');
          }, function() {
            _fbOnline = false;
            _atualizarIndicadorFb('offline');
          });

      } catch(e) {
        console.warn('Firebase init error:', e.message);
      }
    })();

    function _atualizarIndicadorFb(status) {
      var el = document.getElementById('fb-status');
      if (!el) return;
      if (status === 'online') {
        el.textContent = '● sincronizado';
        el.style.color = '#4CAF7D';
      } else {
        el.textContent = '● sem conexão';
        el.style.color = 'rgba(255,255,255,0.3)';
      }
    }

    function enviarParaFirebase(evol) {
      if (!_fbDb) return;
      var doc = Object.assign({}, evol, { _enviadoEm: new Date().toISOString() });
      _fbDb.collection('evolucoes').doc(evol.id).set(doc)
        .catch(function(e) { console.warn('FB send error:', e.message); });
    }

`;

// Injeta antes do // ── INIT
const ANCHOR_FB = '    // ── INIT';
if (html.includes(FB_BLOCK.trim().substring(0, 30))) {
  console.log('⚠️  Bloco Firebase já presente — pulando.');
} else {
  html = html.replace(ANCHOR_FB, FB_BLOCK + ANCHOR_FB);
  console.log('✔  Bloco Firebase (init + envio) adicionado');
}

// ── 3. Modificar salvarEvolucao para chamar enviarParaFirebase ──
const OLD_SAVE = `      state.evolucoes.push(evol);
      saveState();

      showToast('✅ Evolução salva!');`;

const NEW_SAVE = `      state.evolucoes.push(evol);
      saveState();
      enviarParaFirebase(evol);

      showToast('✅ Evolução salva!');`;

if (html.includes('enviarParaFirebase(evol)')) {
  console.log('⚠️  Chamada enviarParaFirebase já existe — pulando.');
} else if (html.includes(OLD_SAVE)) {
  html = html.replace(OLD_SAVE, NEW_SAVE);
  console.log('✔  salvarEvolucao agora envia para o Firebase');
} else {
  console.log('⚠️  Trecho de salvarEvolucao não localizado — verifique manualmente.');
}

// ── 4. Adicionar indicador de status na tela de alunos ──
const OLD_HEADER = `      <div class="header-title" id="titulo-alunos">Meus Alunos</div>`;
const NEW_HEADER = `      <div class="header-title" id="titulo-alunos">Meus Alunos</div>
      <span id="fb-status" style="font-size:10px;color:rgba(255,255,255,0.3);align-self:center;">● aguardando</span>`;

if (html.includes('id="fb-status"')) {
  console.log('⚠️  Indicador fb-status já existe — pulando.');
} else if (html.includes(OLD_HEADER)) {
  html = html.replace(OLD_HEADER, NEW_HEADER);
  console.log('✔  Indicador de status Firebase adicionado ao header');
} else {
  console.log('⚠️  Header titulo-alunos não localizado — indicador não adicionado.');
}

fs.writeFileSync(FILE, html, 'utf8');

console.log('');
console.log('\x1b[32m✅  Etapa 9 concluída — Firebase integrado ao app\x1b[0m');
console.log('\x1b[33m📂  Arquivo:\x1b[0m app-evolucoes.html (atualizado)');
console.log('');
console.log('\x1b[36m🧪  O que testar:\x1b[0m');
console.log('    → Abrir app-evolucoes.html no Chrome');
console.log('    → Registrar uma evolução → salvar');
console.log('    → No console.firebase.google.com → Firestore → coleção "evolucoes"');
console.log('      deve aparecer o documento em até 5 segundos');
console.log('    → Header mostra "● sincronizado" quando online');
console.log('');
