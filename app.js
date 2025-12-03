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
const futureSummary = document.getElementById('futureSummary');
const queryDate = document.getElementById('queryDate');
const searchInput = document.getElementById('searchInput');
const reservationsList = document.getElementById('reservationsList');
const historyList = document.getElementById('historyList');
const tabCurrent = document.getElementById('tabCurrent');
const tabHistory = document.getElementById('tabHistory');

let reservations = [];
let editingId = null;
let sbClient = null;

async function initSupabaseIntegration() {
  // Supabase is now required. Try to use the wrapper first, then fallback to direct init.
  const wrapper = window.SB;
  if (wrapper && wrapper.init) {
    try {
      await wrapper.init();
      if (wrapper.useSupabase) {
        sbClient = wrapper.client || (window.supabase && window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey));
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
        console.log('Loaded reservations from Supabase:', reservations.length);
        return;
      }
    } catch(e) {
      console.error('Supabase wrapper init failed', e);
    }
  }
  
  // Fallback: direct init
  if (window.SUPABASE_CONFIG && window.supabase) {
    try {
      sbClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
      const { data, error } = await sbClient.from('reservas').select('*');
      if (!error && Array.isArray(data)) {
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
      console.log('Supabase initialized (direct)');
      return;
    } catch(e) {
      console.error('Supabase init failed', e);
    }
  }
  
  // No config found
  alert('AVISO: Supabase não configurado. Configure config.js com URL e anon key do Supabase.');
  console.error('Supabase config missing: Copy config.example.js to config.js and fill in your Supabase credentials.');
}

async function syncToSupabase() {
  if (!sbClient) return;
  try {
    if (window.SB && window.SB.upsertMany) {
      await window.SB.upsertMany(reservations);
    } else {
      await sbClient.from('reservas').upsert(reservations, { onConflict: 'id' });
    }
  } catch(e) {
    console.error('Supabase sync error', e);
    alert('Erro ao sincronizar com Supabase: ' + (e.message || 'desconhecido'));
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

function save() {
  syncToSupabase();
}

function renderAvailability(date) {
  futureSummary.innerHTML = '';
  if (!date) return;
  
  const categories = [...new Set(ROOM_TYPES.map(r => r.category))];
  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'availability-card';
    const catRooms = ROOM_TYPES.filter(r => r.category === cat);
    card.innerHTML = '<h4>' + cat + '</h4>';
    
    const ul = document.createElement('ul');
    catRooms.forEach(r => {
      const occ = countOccupied(r.id, date);
      const available = r.total - occ;
      const li = document.createElement('li');
      li.textContent = r.name + ': ' + available + ' disponíveis';
      ul.appendChild(li);
    });
    card.appendChild(ul);
    futureSummary.appendChild(card);
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

  reservations.forEach(r => {
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

document.getElementById('reservationForm').addEventListener('submit', function(e) {
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
  
  reservations.push({
    id: Math.random().toString(36).slice(2),
    guestName: name,
    phone: phone,
    roomType: type,
    startDate: s,
    endDate: eDate,
    notes: notes,
    price: price,
    responsible: responsible,
    onClipboard: false
  });
  
  save();
  renderReservations(filterType.value, searchInput.value);
  renderAvailability(queryDate.value);
  msg.textContent = 'Reserva salva com sucesso!';
  msg.style.color = 'green';
  setTimeout(function() { msg.textContent = ''; }, 2000);
  this.reset();
});

document.getElementById('clearForm').onclick = function() {
  document.getElementById('reservationForm').reset();
};

queryDate.onchange = function() {
  renderAvailability(queryDate.value);
};

searchInput.oninput = function() {
  renderReservations(filterType.value, searchInput.value);
};

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
    renderAvailability(queryDate.value);
  }
};

function toggleClipboard(id) {
  const r = reservations.find(r => r.id === id);
  if (!r) return;
  r.onClipboard = !r.onClipboard;
  save();
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

document.getElementById('editForm').addEventListener('submit', function(e) {
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
  
  save();
  renderReservations(filterType.value, searchInput.value);
  renderAvailability(queryDate.value);
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
})();
