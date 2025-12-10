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

const roomTypeSelect = document.getElementById('roomType');
const filterType = document.getElementById('filterType');
const sortOrder = document.getElementById('sortOrder');
const searchInput = document.getElementById('searchInput');
const reservationsList = document.getElementById('reservationsList');
const historyList = document.getElementById('historyList');
const tabCurrent = document.getElementById('tabCurrent');
const tabHistory = document.getElementById('tabHistory');

let reservations = [];
let editingId = null;
let sbClient = null;

async function initSupabaseIntegration() {
  console.log('🔄 Iniciando conexão com Supabase...');
  
  // Verificar se config existe
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
  
  console.log('📝 Config encontrada:', { url: window.SUPABASE_CONFIG.url.substring(0, 30) + '...' });
  
  // Supabase is now required. Try to use the wrapper first, then fallback to direct init.
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
  
  // Fallback: direct init
  try {
    console.log('🔄 Inicializando Supabase diretamente...');
    sbClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    console.log('✅ Cliente Supabase criado:', sbClient ? 'OK' : 'FALHOU');
    
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

async function syncToSupabase() {
  if (!sbClient) {
    console.error('❌ sbClient não está inicializado! Não é possível salvar.');
    alert('ERRO: Conexão com Supabase não foi estabelecida. Recarregue a página.');
    return;
  }
  try {
    console.log('🔄 Sincronizando', reservations.length, 'reservas com Supabase...');
    if (window.SB && window.SB.upsertMany) {
      await window.SB.upsertMany(reservations);
    } else {
      const { error } = await sbClient.from('reservas').upsert(reservations, { onConflict: 'id' });
      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }
    }
    console.log('✅ Sincronização com Supabase concluída com sucesso');
  } catch(e) {
    console.error('❌ Erro ao sincronizar com Supabase:', e);
    alert('Erro ao sincronizar com Supabase: ' + (e.message || 'desconhecido'));
    throw e;
  }
}

// Utilidades de data
function parseDate(s) {
  if (!s) return new Date(NaN);
  const parts = s.split('-');
  if (parts.length !== 3) return new Date(NaN);
  const [y, m, d] = parts.map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(s) {
  if (!s) return '';
  const parts = s.split('-');
  if (parts.length !== 3) return s;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

// Função para salvar no Supabase
async function save() {
  await syncToSupabase();
}

function renderReservations(filter, search) {
  if (filter === undefined) filter = 'all';
  if (search === undefined) search = '';
  
  reservationsList.innerHTML = '';
  historyList.innerHTML = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lowerSearch = search.toLowerCase();
  const order = sortOrder ? sortOrder.value : 'asc';

  // Ordenar por data de entrada
  const sorted = [...reservations].sort((a, b) => {
    const sa = parseDate(a.startDate).getTime();
    const sb = parseDate(b.startDate).getTime();
    return order === 'desc' ? sb - sa : sa - sb;
  });

  sorted.forEach(r => {
    const start = parseDate(r.startDate);
    const targetList = start < today ? historyList : reservationsList;

    if (filter !== 'all' && r.roomType !== filter && targetList === reservationsList) return;
    if (lowerSearch && !r.guestName.toLowerCase().includes(lowerSearch) && targetList === reservationsList) return;

    const div = document.createElement('div');
    div.className = 'reservation-card';
    if (start.getTime() === today.getTime()) div.classList.add('today');
    if (r.onClipboard) div.classList.add('on-clipboard');

    const roomName = ROOM_TYPES.find(rt => rt.id === r.roomType) ? ROOM_TYPES.find(rt => rt.id === r.roomType).name : r.roomType;
    const price = r.price ? Number(r.price).toFixed(2).replace('.', ',') : '-';
    const clipText = r.onClipboard ? 'Na Prancheta ✔' : 'Marcar Prancheta';
    
    const h4 = document.createElement('h4');
    h4.textContent = r.guestName + ' (' + (r.phone || '') + ')';
    div.appendChild(h4);

    const resp = document.createElement('div');
    resp.textContent = 'Responsável: ' + (r.responsible || '-');
    div.appendChild(resp);

    const room = document.createElement('div');
    room.textContent = roomName;
    div.appendChild(room);

    const dates = document.createElement('div');
    dates.textContent = fmtDate(r.startDate) + ' ➜ ' + fmtDate(r.endDate);
    div.appendChild(dates);

    const priceDiv = document.createElement('div');
    priceDiv.textContent = 'R$ ' + price;
    div.appendChild(priceDiv);

    const notes = document.createElement('div');
    notes.textContent = r.notes || '';
    div.appendChild(notes);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '6px';
    buttonsDiv.style.flexWrap = 'wrap';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Editar';
    editBtn.onclick = function() { editRes(r.id); };
    buttonsDiv.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Excluir';
    delBtn.onclick = function() { cancelRes(r.id); };
    buttonsDiv.appendChild(delBtn);

    const clipBtn = document.createElement('button');
    clipBtn.className = 'prancheta-btn';
    clipBtn.textContent = clipText;
    clipBtn.onclick = function() { toggleClipboard(r.id); };
    buttonsDiv.appendChild(clipBtn);

    div.appendChild(buttonsDiv);
    targetList.appendChild(div);
  });
}

function renderReservations(filter, search) {
  if (filter === undefined) filter = 'all';
  if (search === undefined) search = '';
  
  reservationsList.innerHTML = '';
  historyList.innerHTML = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lowerSearch = search.toLowerCase();
  const order = sortOrder ? sortOrder.value : 'asc';

  // Ordenar por data de entrada
  const sorted = [...reservations].sort((a, b) => {
    const sa = parseDate(a.startDate).getTime();
    const sb = parseDate(b.startDate).getTime();
    return order === 'desc' ? sb - sa : sa - sb;
  });

  sorted.forEach(r => {
    const start = parseDate(r.startDate);
    const targetList = start < today ? historyList : reservationsList;

    if (filter !== 'all' && r.roomType !== filter && targetList === reservationsList) return;
    if (lowerSearch && !r.guestName.toLowerCase().includes(lowerSearch) && targetList === reservationsList) return;

    const div = document.createElement('div');
    div.className = 'reservation-card';
    if (start.getTime() === today.getTime()) div.classList.add('today');
    if (r.onClipboard) div.classList.add('on-clipboard');

    const roomName = ROOM_TYPES.find(rt => rt.id === r.roomType) ? ROOM_TYPES.find(rt => rt.id === r.roomType).name : r.roomType;
    const price = r.price ? Number(r.price).toFixed(2).replace('.', ',') : '-';
    const clipText = r.onClipboard ? 'Na Prancheta ✔' : 'Marcar Prancheta';
    
    const h4 = document.createElement('h4');
    h4.textContent = r.guestName + ' (' + (r.phone || '') + ')';
    div.appendChild(h4);

    const resp = document.createElement('div');
    resp.textContent = 'Responsável: ' + (r.responsible || '-');
    div.appendChild(resp);

    const room = document.createElement('div');
    room.textContent = roomName;
    div.appendChild(room);

    const dates = document.createElement('div');
    dates.textContent = fmtDate(r.startDate) + ' ➜ ' + fmtDate(r.endDate);
    div.appendChild(dates);

    const priceDiv = document.createElement('div');
    priceDiv.textContent = 'R$ ' + price;
    div.appendChild(priceDiv);

    const notes = document.createElement('div');
    notes.textContent = r.notes || '';
    div.appendChild(notes);

    // Informações de auditoria
    if (r.created_by || r.updated_by) {
      const auditDiv = document.createElement('div');
      auditDiv.style.fontSize = '11px';
      auditDiv.style.color = 'var(--muted)';
      auditDiv.style.marginTop = '8px';
      auditDiv.style.paddingTop = '8px';
      auditDiv.style.borderTop = '1px solid var(--border)';
      
      let auditText = '';
      if (r.created_at) {
        const createdDate = new Date(r.created_at).toLocaleString('pt-BR');
        auditText += `📝 Criado: ${createdDate}`;
      }
      if (r.updated_at && r.updated_at !== r.created_at) {
        const updatedDate = new Date(r.updated_at).toLocaleString('pt-BR');
        auditText += auditText ? '<br>' : '';
        auditText += `✏️ Atualizado: ${updatedDate}`;
      }
      
      auditDiv.innerHTML = auditText;
      div.appendChild(auditDiv);
    }

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '6px';
    buttonsDiv.style.flexWrap = 'wrap';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Editar';
    editBtn.onclick = function() { editRes(r.id); };
    buttonsDiv.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Excluir';
    delBtn.onclick = function() { cancelRes(r.id); };
    buttonsDiv.appendChild(delBtn);

    const clipBtn = document.createElement('button');
    clipBtn.className = 'prancheta-btn';
    clipBtn.textContent = clipText;
    clipBtn.onclick = function() { toggleClipboard(r.id); };
    buttonsDiv.appendChild(clipBtn);
    
    // Botão de histórico
    const historyBtn = document.createElement('button');
    historyBtn.className = 'history-btn';
    historyBtn.textContent = '📜 Histórico';
    historyBtn.onclick = function() { showHistory(r.id); };
    buttonsDiv.appendChild(historyBtn);

    div.appendChild(buttonsDiv);
    targetList.appendChild(div);
  });
}

document.getElementById('reservationForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const type = roomTypeSelect.value;
  const s = document.getElementById('startDate').value;
  const eDate = document.getElementById('endDate').value;
  const notes = document.getElementById('notes').value.trim();
  const price = document.getElementById('price').value;
  const responsible = document.getElementById('responsible').value.trim();
  const msg = document.getElementById('formMsg');
  
  if (!name || !s || !eDate) {
    msg.textContent = 'Preencha todos os campos obrigatórios';
    msg.style.color = 'red';
    return;
  }
  
  if (parseDate(s) >= parseDate(eDate)) {
    msg.textContent = 'Saída deve ser após entrada';
    msg.style.color = 'red';
    return;
  }
  
  const newReservation = {
    id: Math.random().toString(36).slice(2),
    guestName: name,
    phone: phone,
    roomType: type,
    startDate: s,
    endDate: eDate,
    notes: notes,
    price: price ? parseFloat(price) : null,
    responsible: responsible,
    onClipboard: false
  };
  
  console.log('➕ Adicionando nova reserva:', newReservation);
  reservations.push(newReservation);
  
  try {
    await save();
    renderReservations(filterType.value, searchInput.value);
    msg.textContent = 'Reserva salva com sucesso!';
    msg.style.color = 'green';
    setTimeout(function() { msg.textContent = ''; }, 2000);
    this.reset();
  } catch(error) {
    console.error('❌ Erro ao salvar reserva:', error);
    msg.textContent = 'ERRO ao salvar: ' + (error.message || 'desconhecido');
    msg.style.color = 'red';
    // Remover a reserva que não foi salva
    reservations.pop();
    renderReservations(filterType.value, searchInput.value);
  }
});

document.getElementById('clearForm').onclick = function() {
  document.getElementById('reservationForm').reset();
};

searchInput.oninput = function() {
  renderReservations(filterType.value, searchInput.value);
};

if (sortOrder) {
  sortOrder.onchange = function() {
    renderReservations(filterType.value, searchInput.value);
  };
}

tabCurrent.onclick = function() {
  tabCurrent.classList.add('active');
  tabHistory.classList.remove('active');
  reservationsList.style.display = 'block';
  historyList.style.display = 'none';
};

tabHistory.onclick = function() {
  tabHistory.classList.add('active');
  tabCurrent.classList.remove('active');
  reservationsList.style.display = 'none';
  historyList.style.display = 'block';
};

window.cancelRes = async function(id) {
  if (confirm('Cancelar reserva?')) {
    reservations = reservations.filter(r => r.id !== id);
    try {
      // Remove from Supabase
      if (window.SB && window.SB.deleteById) {
        await window.SB.deleteById(id);
      } else if (sbClient) {
        await sbClient.from('reservas').delete().eq('id', id);
      }
    } catch(e) {
      console.error('Error deleting from Supabase', e);
      alert('Erro ao excluir: ' + (e.message || 'desconhecido'));
    }
    renderReservations(filterType.value, searchInput.value);
  }
};

async function toggleClipboard(id) {
  const r = reservations.find(r => r.id === id);
  if (!r) return;
  r.onClipboard = !r.onClipboard;
  await save();
  renderReservations(filterType.value, searchInput.value);
}

function editRes(id) {
  const r = reservations.find(r => r.id === id);
  if (!r) return;
  editingId = id;
  document.getElementById('editName').value = r.guestName;
  document.getElementById('editPhone').value = r.phone;
  document.getElementById('editRoomType').value = r.roomType;
  document.getElementById('editStartDate').value = r.startDate;
  document.getElementById('editEndDate').value = r.endDate;
  document.getElementById('editPrice').value = r.price;
  document.getElementById('editNotes').value = r.notes;
  document.getElementById('editResponsible').value = r.responsible;
  document.getElementById('editOnClipboard').checked = r.onClipboard;
  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  editingId = null;
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

// Mostrar histórico de uma reserva
async function showHistory(reservaId) {
  const modal = document.getElementById('historyModal');
  const content = document.getElementById('historyContent');
  
  if (!sbClient) {
    alert('Cliente Supabase não inicializado');
    return;
  }
  
  content.innerHTML = '<div style="text-align:center;padding:20px;">🔄 Carregando histórico...</div>';
  modal.style.display = 'flex';
  
  try {
    // Buscar histórico da reserva
    const { data, error } = await sbClient
      .from('reservas_audit')
      .select('*')
      .eq('reserva_id', reservaId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">📋 Nenhum histórico encontrado</div>';
      return;
    }
    
    // Renderizar histórico
    let html = '<div class="history-timeline">';
    
    data.forEach((entry, index) => {
      const date = new Date(entry.created_at).toLocaleString('pt-BR');
      const actionText = {
        'INSERT': '✨ Criado',
        'UPDATE': '✏️ Editado',
        'DELETE': '🗑️ Excluído'
      }[entry.action] || entry.action;
      
      html += `
        <div class="history-item">
          <div class="history-header">
            <span class="history-action">${actionText}</span>
            <span class="history-date">${date}</span>
          </div>
          <div class="history-user">
            👤 ${entry.user_email || 'Usuário desconhecido'}
          </div>
      `;
      
      // Mostrar campos alterados
      if (entry.action === 'UPDATE' && entry.changed_fields) {
        const fields = Object.keys(entry.changed_fields);
        if (fields.length > 0) {
          html += '<div class="history-changes">';
          html += '<strong>Campos alterados:</strong> ';
          html += fields.map(f => `<span class="field-tag">${f}</span>`).join(' ');
          html += '</div>';
        }
      }
      
      html += '</div>';
    });
    
    html += '</div>';
    content.innerHTML = html;
    
  } catch (e) {
    console.error('Erro ao carregar histórico:', e);
    content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--danger)">❌ Erro ao carregar histórico: ${e.message}</div>`;
  }
}

document.getElementById('editForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!editingId) return;
  const r = reservations.find(r => r.id === editingId);
  if (!r) return;
  
  r.guestName = document.getElementById('editName').value.trim();
  r.phone = document.getElementById('editPhone').value.trim();
  r.roomType = document.getElementById('editRoomType').value;
  r.startDate = document.getElementById('editStartDate').value;
  r.endDate = document.getElementById('editEndDate').value;
  r.responsible = document.getElementById('editResponsible').value.trim();
  r.price = document.getElementById('editPrice').value;
  r.notes = document.getElementById('editNotes').value.trim();
  r.onClipboard = document.getElementById('editOnClipboard').checked;
  
  await save();
  renderReservations(filterType.value, searchInput.value);
  closeEditModal();
});

ROOM_TYPES.forEach(rt => {
  const opt1 = document.createElement('option');
  opt1.value = rt.id;
  opt1.textContent = rt.name;
  roomTypeSelect.appendChild(opt1);

  const opt2 = document.createElement('option');
  opt2.value = rt.id;
  opt2.textContent = rt.name;
  document.getElementById('editRoomType').appendChild(opt2);

  const opt3 = document.createElement('option');
  opt3.value = rt.id;
  opt3.textContent = rt.name;
  filterType.appendChild(opt3);
});

(async function() {
  await initSupabaseIntegration();
  renderReservations();
  
  // Teste de conexão
  console.log('🧪 Testando conexão com Supabase...');
  console.log('sbClient:', sbClient ? '✅ Inicializado' : '❌ NULL');
  console.log('window.SUPABASE_CONFIG:', window.SUPABASE_CONFIG ? '✅ Presente' : '❌ Ausente');
  console.log('window.supabase:', typeof window.supabase !== 'undefined' ? '✅ Carregado' : '❌ Não carregado');
  
  // Função global para testar salvamento
  window.testSupabase = async function() {
    console.log('🧪 Iniciando teste de salvamento...');
    const testReservation = {
      id: 'test-' + Date.now(),
      guestName: 'Teste',
      phone: '123',
      roomType: 'duplo',
      startDate: '2025-12-10',
      endDate: '2025-12-11',
      notes: 'Teste de conexão',
      price: 100,
      responsible: 'Admin',
      onClipboard: false
    };
    
    try {
      const { data, error } = await sbClient.from('reservas').insert([testReservation]);
      if (error) {
        console.error('❌ Erro no teste:', error);
      } else {
        console.log('✅ Teste bem-sucedido! Dados salvos:', data);
      }
    } catch(e) {
      console.error('❌ Exceção no teste:', e);
    }
  };
  
  console.log('💡 Dica: Execute window.testSupabase() no console para testar a conexão');
})();

// Inicializar autenticação quando o DOM estiver pronto
(async function initApp() {
  // Aguardar inicialização do Supabase
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Inicializar autenticação
  const isAuth = await Auth.init();
  
  if (!isAuth) {
    console.log('ℹ️ Usuário não autenticado - mostrando login');
  } else {
    console.log('✅ Usuário autenticado - carregando aplicação');
  }
})();

// Função de Backup
async function exportBackup() {
  if (!sbClient) {
    alert('❌ Supabase não está configurado. Configure config.js primeiro.');
    return;
  }
  
  try {
    console.log('📥 Iniciando backup...');
    const { data, error } = await sbClient.from('reservas').select('*');
    
    if (error) throw error;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-reservas-${timestamp}.json`;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`✅ Backup realizado: ${data.length} reservas salvas em ${filename}`);
    alert(`✅ Backup realizado com sucesso!\n${data.length} reservas exportadas em ${filename}`);
  } catch(e) {
    console.error('❌ Erro ao fazer backup:', e);
    alert('❌ Erro ao fazer backup: ' + (e.message || 'desconhecido'));
  }
}
