// Página de Consulta de Disponibilidade
const ROOM_TYPES = [
  { id: 'duplo', name: 'Duplo', category: 'Standard', total: 15 },
  { id: 'casal', name: 'Casal', category: 'Standard', total: 17 },
  { id: 'solteiro_triplo', name: 'Solteiro Triplo', category: 'Standard', total: 10 },
  { id: 'casal_triplo', name: 'Casal Triplo', category: 'Standard', total: 4 },
  { id: 'casal_quadruplo', name: 'Casal Quádruplo', category: 'Standard', total: 1 },
  { id: 'casal_quintuplo', name: 'Casal Quíntuplo', category: 'Standard', total: 2 },
  { id: 'solteiro_quadruplo', name: 'Solteiro Quádruplo', category: 'Standard', total: 1 },
  { id: 'casal_execultivo', name: 'Casal Executivo', category: 'Executivo', total: 14 },
  { id: 'solteiro_triplo_exec', name: 'Solteiro Triplo Executivo', category: 'Executivo', total: 5 },
  { id: 'casal_triplo_exec', name: 'Casal Triplo Executivo', category: 'Executivo', total: 4 },
  { id: 'casal_king_exec', name: 'Casal King Executivo', category: 'Executivo', total: 2 },
  { id: 'casal_quadruplo_exec', name: 'Casal Quádruplo Executivo', category: 'Executivo', total: 2 }
];

const futureSummary = document.getElementById('futureSummary');
const queryDate = document.getElementById('queryDate');
const noDataMessage = document.getElementById('noDataMessage');

let reservations = [];
let sbClient = null;

async function initSupabaseIntegration() {
  console.log('🔄 Iniciando conexão com Supabase...');
  
  if (!window.SUPABASE_CONFIG) {
    console.error('❌ SUPABASE_CONFIG não encontrado');
    alert('AVISO: Supabase não configurado. Configure config.js com URL e anon key do Supabase.');
    return;
  }
  
  if (!window.supabase) {
    console.error('❌ Biblioteca Supabase não carregada');
    alert('ERRO: Biblioteca Supabase não foi carregada.');
    return;
  }
  
  console.log('📝 Config encontrada');
  
  const wrapper = window.SB;
  if (wrapper && wrapper.init) {
    try {
      await wrapper.init();
      if (wrapper.useSupabase && wrapper.client) {
        sbClient = wrapper.client;
        console.log('✅ Usando wrapper SB.client');
        const data = await wrapper.loadAll();
        if (Array.isArray(data)) {
          reservations = data.map(r => ({
            id: r.id,
            guestName: r.guestName,
            phone: r.phone,
            roomType: r.roomType,
            startDate: r.startDate,
            endDate: r.endDate,
            notes: r.notes,
            price: r.price,
            responsible: r.responsible,
            onClipboard: r.onClipboard || false
          }));
        }
        console.log('✅ Carregadas', reservations.length, 'reservas do Supabase');
        return;
      }
    } catch(e) {
      console.error('⚠️ Supabase wrapper init failed', e);
    }
  }
  
  try {
    console.log('🔄 Inicializando Supabase diretamente...');
    sbClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    console.log('✅ Cliente Supabase criado');
    
    const { data, error } = await sbClient.from('reservas').select('*');
    if (error) {
      console.error('❌ Erro ao carregar reservas:', error);
      throw error;
    }
    
    if (Array.isArray(data)) {
      reservations = data.map(r => ({
        id: r.id,
        guestName: r.guestName,
        phone: r.phone,
        roomType: r.roomType,
        startDate: r.startDate,
        endDate: r.endDate,
        notes: r.notes,
        price: r.price,
        responsible: r.responsible,
        onClipboard: r.onClipboard || false
      }));
      console.log('✅ Carregadas', reservations.length, 'reservas do Supabase');
    }
  } catch(e) {
    console.error('❌ Erro fatal ao inicializar Supabase:', e);
    alert('ERRO ao conectar com Supabase: ' + (e.message || 'desconhecido'));
  }
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return d + '/' + m + '/' + y;
}

function datesOverlap(a1, a2, b1, b2) {
  return a1 < b2 && b1 < a2;
}

function countOccupied(type, date) {
  const target = parseDate(date);
  const next = new Date(target.getTime() + 86400000);
  return reservations.filter(r => 
    r.roomType === type && datesOverlap(target, next, parseDate(r.startDate), parseDate(r.endDate))
  ).length;
}

function renderAvailability(date) {
  futureSummary.innerHTML = '';
  const availabilitySummary = document.getElementById('availabilitySummary');
  if (availabilitySummary) availabilitySummary.innerHTML = '';
  
  if (!date) {
    noDataMessage.style.display = 'block';
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  // Calcular totais gerais
  let grandTotalAvailable = 0;
  let grandTotalRooms = 0;
  
  const categories = [...new Set(ROOM_TYPES.map(r => r.category))];
  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'availability-card';
    const catRooms = ROOM_TYPES.filter(r => r.category === cat);
    
    // Cabeçalho da categoria
    const header = document.createElement('div');
    header.className = 'availability-header';
    header.innerHTML = '<h4>' + cat + '</h4>';
    card.appendChild(header);
    
    // Calcular total da categoria
    let totalAvailable = 0;
    let totalRooms = 0;
    catRooms.forEach(r => {
      const occ = countOccupied(r.id, date);
      totalAvailable += (r.total - occ);
      totalRooms += r.total;
    });
    
    grandTotalAvailable += totalAvailable;
    grandTotalRooms += totalRooms;
    
    // Badge de resumo da categoria
    const summary = document.createElement('div');
    summary.className = 'category-summary';
    const percentage = totalRooms > 0 ? Math.round((totalAvailable / totalRooms) * 100) : 0;
    summary.innerHTML = `<span class="total-badge">${totalAvailable}/${totalRooms} disponíveis (${percentage}%)</span>`;
    card.appendChild(summary);
    
    // Lista de quartos
    const ul = document.createElement('ul');
    ul.className = 'availability-list';
    catRooms.forEach(r => {
      const occ = countOccupied(r.id, date);
      const available = r.total - occ;
      const percentage = r.total > 0 ? (available / r.total) * 100 : 0;
      
      // Determinar status (verde/amarelo/vermelho)
      let status = 'high';
      if (percentage === 0) status = 'none';
      else if (percentage < 30) status = 'low';
      else if (percentage < 60) status = 'medium';
      
      const li = document.createElement('li');
      li.className = 'availability-item';
      
      const info = document.createElement('div');
      info.className = 'room-info';
      info.innerHTML = `
        <span class="room-name">${r.name}</span>
        <span class="room-count status-${status}">${available}/${r.total}</span>
      `;
      li.appendChild(info);
      
      // Barra de progresso
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      const progress = document.createElement('div');
      progress.className = `progress-fill status-${status}`;
      progress.style.width = percentage + '%';
      progressBar.appendChild(progress);
      li.appendChild(progressBar);
      
      ul.appendChild(li);
    });
    card.appendChild(ul);
    futureSummary.appendChild(card);
  });
  
  // Adicionar resumo geral
  if (availabilitySummary && grandTotalRooms > 0) {
    const grandPercentage = Math.round((grandTotalAvailable / grandTotalRooms) * 100);
    const occupiedRooms = grandTotalRooms - grandTotalAvailable;
    const occupancyRate = Math.round((occupiedRooms / grandTotalRooms) * 100);
    
    let statusClass = 'success';
    if (grandPercentage < 30) statusClass = 'danger';
    else if (grandPercentage < 60) statusClass = 'warning';
    
    const dateFormatted = fmtDate(date);
    
    availabilitySummary.innerHTML = `
      <div class="summary-grid">
        <div class="summary-card card-primary">
          <div class="summary-icon">🏨</div>
          <div class="summary-content">
            <div class="summary-label">Total Disponível</div>
            <div class="summary-value">${grandTotalAvailable}</div>
            <div class="summary-sublabel">de ${grandTotalRooms} apartamentos</div>
          </div>
        </div>
        <div class="summary-card card-${statusClass}">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <div class="summary-label">Disponibilidade</div>
            <div class="summary-value">${grandPercentage}%</div>
            <div class="summary-sublabel">em ${dateFormatted}</div>
          </div>
        </div>
        <div class="summary-card card-info">
          <div class="summary-icon">🛏️</div>
          <div class="summary-content">
            <div class="summary-label">Ocupados</div>
            <div class="summary-value">${occupiedRooms}</div>
            <div class="summary-sublabel">taxa de ${occupancyRate}%</div>
          </div>
        </div>
      </div>
    `;
  }
}

// Event listeners
queryDate.addEventListener('change', function() {
  renderAvailability(queryDate.value);
});

// Botões de atalho
document.getElementById('todayBtn').addEventListener('click', function() {
  const today = new Date();
  queryDate.value = today.toISOString().split('T')[0];
  renderAvailability(queryDate.value);
});

document.getElementById('tomorrowBtn').addEventListener('click', function() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  queryDate.value = tomorrow.toISOString().split('T')[0];
  renderAvailability(queryDate.value);
});

document.getElementById('weekBtn').addEventListener('click', function() {
  const week = new Date();
  week.setDate(week.getDate() + 7);
  queryDate.value = week.toISOString().split('T')[0];
  renderAvailability(queryDate.value);
});

// Inicialização
(async function() {
  await initSupabaseIntegration();
  
  // Mostrar mensagem inicial
  noDataMessage.style.display = 'block';
  
  console.log('✅ Página de disponibilidade carregada');
})();

// Inicializar autenticação
(async function initApp() {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const isAuth = await Auth.init();
  
  if (!isAuth) {
    console.log('ℹ️ Usuário não autenticado - mostrando login');
  } else {
    console.log('✅ Usuário autenticado - carregando aplicação');
  }
})();
