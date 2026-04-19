// ═══════════════════════════════════════════════════════════
// ETAPA 10 — Dashboard escuta Firestore em tempo real
// Resultado: quando o personal salva uma evolução no app,
//            ela aparece automaticamente na tabela do dashboard
//            sem recarregar a página.
// Rodar: node scripts/evolucoes/e10.js
// ═══════════════════════════════════════════════════════════
const fs   = require('fs');
const path = require('path');

const DASHBOARD = '/Users/noia/Documents/Claude/Projects/Dashboard Operacional - BestYou Studio/dashboard.html';
let html = fs.readFileSync(DASHBOARD, 'utf8');

// ── Credenciais (mesmas do E9) ──
const FB_CONFIG = {
  apiKey:            'AIzaSyAdJ-WnynzuPQNd3NHT7en_BSmsm6SpcLE',
  authDomain:        'app-evolucoes-de-aluno.firebaseapp.com',
  projectId:         'app-evolucoes-de-aluno',
  storageBucket:     'app-evolucoes-de-aluno.firebasestorage.app',
  messagingSenderId: '405320356686',
  appId:             '1:405320356686:web:902dc9712da7e65d5c841f',
};

// ── 1. Adicionar Firestore SDK (mesma versão do dashboard: 9.23.0) ──
const FIRESTORE_SDK = `<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>`;

if (html.includes('firebase-firestore-compat.js')) {
  console.log('⚠️  Firestore SDK já presente — pulando.');
} else {
  html = html.replace(
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>',
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>\n' + FIRESTORE_SDK
  );
  console.log('✔  Firestore SDK adicionado (v9.23.0)');
}

// ── 2. Bloco: init Firestore + listener tempo real ──
const E10_BLOCK = `
  // ── E10: FIREBASE FIRESTORE — SYNC AUTOMÁTICO ──
  (function() {
    var BYS_FB_CONFIG = {
      apiKey:            '${FB_CONFIG.apiKey}',
      authDomain:        '${FB_CONFIG.authDomain}',
      projectId:         '${FB_CONFIG.projectId}',
      storageBucket:     '${FB_CONFIG.storageBucket}',
      messagingSenderId: '${FB_CONFIG.messagingSenderId}',
      appId:             '${FB_CONFIG.appId}',
    };

    // Usa app nomeado para não colidir com Firebase Realtime do dashboard
    var _bysApp, _bysDb;
    try {
      _bysApp = firebase.app('bys-evol');
    } catch(e) {
      _bysApp = firebase.initializeApp(BYS_FB_CONFIG, 'bys-evol');
    }
    _bysDb = firebase.firestore(_bysApp);

    function _setIndicador(status) {
      var el = document.getElementById('fb-sync-status');
      if (!el) return;
      if (status === 'online') {
        el.textContent = '● Firebase: online';
        el.style.color = '#00d4aa';
      } else if (status === 'erro') {
        el.textContent = '● Firebase: erro de conexão';
        el.style.color = '#ff6b6b';
      } else {
        el.textContent = '● Firebase: conectando...';
        el.style.color = 'rgba(255,255,255,0.3)';
      }
    }

    // Listener em tempo real na coleção 'evolucoes'
    _bysDb.collection('evolucoes')
      .onSnapshot(function(snapshot) {
        _setIndicador('online');

        // Reconstrói state.evolucoes a partir do Firestore
        // mantendo os registros já existentes de importação manual
        var idsFirebase = {};
        snapshot.forEach(function(doc) { idsFirebase[doc.id] = true; });

        // Remove os que vieram do Firebase (para não duplicar na re-sincronização)
        if (!state.evolucoes) state.evolucoes = [];
        state.evolucoes = state.evolucoes.filter(function(ev) {
          return !ev._fbSync; // mantém os de importação manual
        });

        var novos = 0;
        snapshot.forEach(function(doc) {
          var ev = doc.data();
          ev._fbSync = true; // marca como vindo do Firebase
          state.evolucoes.push(ev);
          novos++;
        });

        // Persiste no localStorage para sobreviver a recarregamentos
        try { localStorage.setItem('bys_evolucoes', JSON.stringify(state.evolucoes)); } catch(e) {}

        // Atualiza tabela se modal estiver aberto
        if (typeof renderEvolucoes === 'function') renderEvolucoes();

        // Atualiza filtro de personais
        var sel = document.getElementById('filtro-personal-evol');
        if (sel) {
          var personais = [];
          var vistos = {};
          (state.evolucoes || []).forEach(function(ev) {
            if (ev.personal && !vistos[ev.personal]) {
              vistos[ev.personal] = true;
              personais.push(ev.personal);
            }
          });
          personais.sort();
          sel.innerHTML = '<option value="">Todos os personais</option>' +
            personais.map(function(p) { return '<option value="' + p + '">' + p + '</option>'; }).join('');
        }

      }, function(err) {
        _setIndicador('erro');
        console.warn('Firestore listener erro:', err.message);
      });

  })();

`;

// Injeta antes do fechamento </script> final do dashboard
const ANCHOR_CLOSE = '  </script>\n\n  <!-- BYS APP IMPORT -->';
if (html.includes('E10: FIREBASE FIRESTORE')) {
  console.log('⚠️  Bloco E10 já presente — pulando.');
} else if (html.includes(ANCHOR_CLOSE)) {
  html = html.replace(ANCHOR_CLOSE, E10_BLOCK + ANCHOR_CLOSE);
  console.log('✔  Listener Firestore em tempo real adicionado ao dashboard');
} else {
  console.log('❌  Âncora de fechamento não encontrada — verifique o dashboard manualmente.');
  process.exit(1);
}

// ── 3. Adicionar indicador de status na seção de evoluções ──
const OLD_IMPORT_HEADER = `<span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--gold);">📥 Evoluções importadas do App</span>`;
const NEW_IMPORT_HEADER = `<span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--gold);">📥 Evoluções importadas do App</span>
        <span id="fb-sync-status" style="font-size:11px;color:rgba(255,255,255,0.3);">● Firebase: conectando...</span>`;

if (html.includes('fb-sync-status')) {
  console.log('⚠️  Indicador fb-sync-status já existe — pulando.');
} else if (html.includes(OLD_IMPORT_HEADER)) {
  html = html.replace(OLD_IMPORT_HEADER, NEW_IMPORT_HEADER);
  console.log('✔  Indicador de status Firebase adicionado à tabela de evoluções');
} else {
  console.log('⚠️  Header da tabela não localizado — indicador não adicionado.');
}

fs.writeFileSync(DASHBOARD, html, 'utf8');

console.log('');
console.log('\x1b[32m✅  Etapa 10 concluída — Dashboard escuta Firestore em tempo real\x1b[0m');
console.log('\x1b[33m📂  Arquivo:\x1b[0m dashboard.html (atualizado)');
console.log('');
console.log('\x1b[36m🧪  O que testar:\x1b[0m');
console.log('    → Abrir dashboard.html no Chrome');
console.log('    → Clicar em "📈 Evoluções" de qualquer personal');
console.log('    → Indicador "● Firebase: online" aparece em verde');
console.log('    → Em outra aba, abrir o app e registrar uma evolução');
console.log('    → Sem recarregar o dashboard, a evolução aparece na tabela em ~3s');
console.log('');
