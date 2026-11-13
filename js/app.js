/* Porter Desk · front-end portfolio project · Vanilla JavaScript (ES6+) */
'use strict';

const TOURS = [
  { id: 'city-walk', name: 'Recorrido por el centro histórico', price: 48 },
  { id: 'mountain-hike', name: 'Caminata de montaña', price: 95 },
  { id: 'coastal-trip', name: 'Ruta por la costa', price: 82 },
  { id: 'food-tour', name: 'Tour gastronómico y cultural', price: 65 }
];
const STATUS = ['Pending', 'Confirmed', 'Cancelled'];
const STATUS_LABELS = { Pending: 'Pendiente', Confirmed: 'Confirmada', Cancelled: 'Cancelada' };
const SECTION_LABELS = { dashboard: 'Inicio', reservations: 'Reservas', customers: 'Clientes', settings: 'Configuración' };
function statusLabel(status) { return STATUS_LABELS[status] || status; }
const KEYS = { reservations: 'porterdesk_reservations_v1', settings: 'porterdesk_settings_v1' };
const DEFAULT_SETTINGS = { agencyName: 'Porter Travel', agencyEmail: 'hello@porter.example', defaultStatus: 'Pending', pageSize: 10 };
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormatter = new Intl.DateTimeFormat('es-PE', { month: 'short', day: 'numeric', year: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('es-PE', { month: 'short' });

const state = { reservations: [], settings: { ...DEFAULT_SETTINGS }, page: 1, search: '', tour: 'all', status: 'all', sort: 'trip-asc', customerSearch: '' };
let toastTimer = null;
let confirmHandler = null;
let storageAvailable = true;

function safe(text) {
  return String(text ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function dateToInput(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function offsetDay(days) {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + days);
  return dateToInput(d);
}
function prettyDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}
function price(value) { return currency.format(Number(value) || 0); }
function tourFor(id) { return TOURS.find((tour) => tour.id === id); }
function idForNextBooking() { return `BK-${Math.max(1000, ...state.reservations.map((r) => Number(r.id.slice(3)) || 0)) + 1}`; }
function readStore(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch (error) { storageAvailable = false; console.warn('Datos locales no disponibles:', error); return null; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (error) { storageAvailable = false; showToast('El almacenamiento del navegador no está disponible. Los cambios podrían perderse.', true); console.warn(error); return false; }
}
function sampleData() {
  // Synthetic, relative-date data keeps the demo useful any day it is opened.
  const people = [
    ['Olivia Bennett', 'olivia.bennett@example.com'], ['James Carter', 'james.carter@example.com'],
    ['Sofia Martinez', 'sofia.martinez@example.com'], ['Lucas Wilson', 'lucas.wilson@example.com'],
    ['Emma Thompson', 'emma.thompson@example.com'], ['Noah Anderson', 'noah.anderson@example.com'],
    ['Ava Robinson', 'ava.robinson@example.com'], ['Ethan Garcia', 'ethan.garcia@example.com'],
    ['Mia Johnson', 'mia.johnson@example.com'], ['Liam Patel', 'liam.patel@example.com'],
    ['Isabella Clark', 'isabella.clark@example.com'], ['Benjamin Lee', 'benjamin.lee@example.com'],
    ['Amelia Davis', 'amelia.davis@example.com'], ['Daniel Moore', 'daniel.moore@example.com'],
    ['Charlotte King', 'charlotte.king@example.com'], ['Henry Flores', 'henry.flores@example.com']
  ];
  const statuses = ['Confirmed', 'Pending', 'Confirmed', 'Confirmed', 'Cancelled', 'Confirmed', 'Pending'];
  return Array.from({ length: 28 }, (_, index) => {
    const person = people[(index * 7 + Math.floor(index / 3)) % people.length];
    const tour = TOURS[(index * 3 + Math.floor(index / 5)) % TOURS.length];
    const guests = (index % 4) + 1;
    const created = new Date();
    created.setHours(11, 30, 0, 0);
    created.setDate(created.getDate() - (index * 6 + (index % 3) * 4));
    const tripOffset = index % 6 === 0 ? -(index + 3) : 2 + ((index * 9) % 79);
    return {
      id: `BK-${1028 - index}`, customerName: person[0], customerEmail: person[1],
      customerPhone: `+1 202 555 ${String(1000 + (index * 37) % 9000)}`,
      tourId: tour.id, tripDate: offsetDay(tripOffset), guests,
      unitPrice: tour.price, total: guests * tour.price, status: statuses[index % statuses.length],
      notes: '', createdAt: created.toISOString(), updatedAt: created.toISOString()
    };
  });
}
function initialize() {
  const storedSettings = readStore(KEYS.settings);
  if (storedSettings && typeof storedSettings === 'object') {
    state.settings = { ...DEFAULT_SETTINGS, ...storedSettings };
    if (![5, 10, 20].includes(Number(state.settings.pageSize))) state.settings.pageSize = 10;
    if (!['Pending', 'Confirmed'].includes(state.settings.defaultStatus)) state.settings.defaultStatus = 'Pending';
  }
  const storedBookings = readStore(KEYS.reservations);
  if (Array.isArray(storedBookings)) state.reservations = storedBookings.filter(validBooking);
  else { state.reservations = sampleData(); writeStore(KEYS.reservations, state.reservations); }
  $('#today-date').textContent = dateFormatter.format(new Date());
  $('#tour-filter').innerHTML += TOURS.map((tour) => `<option value="${safe(tour.id)}">${safe(tour.name)}</option>`).join('');
  $('#tour-select').innerHTML = '<option value="">Selecciona una experiencia</option>' + TOURS.map((tour) => `<option value="${safe(tour.id)}">${safe(tour.name)} · ${price(tour.price)}/persona</option>`).join('');
  bindEvents();
  renderAll();
  navigate();
  if (!storageAvailable) showToast('El modo privado puede impedir que se guarden los cambios.', true);
}
function validBooking(r) {
  return r && typeof r.id === 'string' && typeof r.customerName === 'string' &&
    typeof r.customerEmail === 'string' && tourFor(r.tourId) &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.tripDate || '') && STATUS.includes(r.status) &&
    Number.isFinite(Number(r.total)) && Number.isFinite(Number(r.guests));
}
function persistBookings() { writeStore(KEYS.reservations, state.reservations); renderAll(); }
function showToast(message, isError = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3700);
}
function badge(status) { return `<span class="status-badge status-${safe(status.toLowerCase())}">${safe(statusLabel(status))}</span>`; }

function renderAll() {
  $('#workspace-name').textContent = state.settings.agencyName;
  $('#nav-count').textContent = state.reservations.length;
  renderDashboard(); renderReservations(); renderCustomers();
}
function renderDashboard() {
  const rs = state.reservations;
  const total = rs.length;
  const pending = rs.filter((r) => r.status === 'Pending').length;
  const confirmed = rs.filter((r) => r.status === 'Confirmed').length;
  const cancelled = rs.filter((r) => r.status === 'Cancelled').length;
  const confirmedRevenue = rs.filter((r) => r.status === 'Confirmed').reduce((sum, r) => sum + Number(r.total), 0);
  const items = [
    { label: 'Total de reservas', value: String(total), note: 'Todas las reservas registradas', icon: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 10h16"/>' },
    { label: 'Pendientes', value: String(pending), note: 'Por confirmar', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
    { label: 'Confirmadas', value: String(confirmed), note: 'Reservas confirmadas', icon: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>' },
    { label: 'Valor confirmado', value: price(confirmedRevenue), note: 'USD · solo reservas confirmadas', icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>' }
  ];
  $('#stats-grid').innerHTML = items.map((item) => `<article class="stat-card"><div class="stat-card-top"><span class="stat-label">${item.label}</span><span class="stat-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${item.icon}</svg></span></div><div class="stat-value">${item.value}</div><div class="stat-footnote">${item.note}</div></article>`).join('');

  const months = Array.from({ length: 6 }, (_, i) => {
    const now = new Date(); const first = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthKey = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}`;
    return { key: monthKey, label: monthFormatter.format(first), count: rs.filter((r) => String(r.createdAt || '').startsWith(monthKey)).length };
  });
  const max = Math.max(4, Math.ceil(Math.max(...months.map((m) => m.count)) / 4) * 4);
  $('#monthly-chart').innerHTML = `<div class="chart-grid" role="img" aria-label="Actividad de reservas: ${months.map((m) => `${m.label}: ${m.count}`).join(', ')}"><div class="chart-axis">${[max, max * .75, max * .5, max * .25, 0].map((n) => `<span>${n}</span>`).join('')}</div><div class="chart-plot"><div class="chart-bars">${months.map((m, index) => `<div class="bar-col" title="${m.label}: ${m.count} reservas"><div class="bar ${index === 5 ? 'is-current' : ''}" style="--height:${Math.max(1, m.count / max * 100)}%"></div></div>`).join('')}</div><div class="chart-months">${months.map((m) => `<span>${m.label}</span>`).join('')}</div></div></div>`;
  $('#status-breakdown').innerHTML = [
    { name: 'Confirmed', count: confirmed }, { name: 'Pending', count: pending }, { name: 'Cancelled', count: cancelled }
  ].map(({ name, count }) => `<div class="breakdown-row"><div class="breakdown-labels"><span class="breakdown-label"><i class="status-dot dot-${name.toLowerCase()}"></i>${statusLabel(name)}</span><strong class="breakdown-count">${count}</strong></div><div class="progress-track" role="meter" aria-valuemin="0" aria-valuemax="${total || 1}" aria-valuenow="${count}" aria-label="Reservas en estado: ${statusLabel(name)}"><div class="progress-fill fill-${name.toLowerCase()}" style="width:${total ? count / total * 100 : 0}%"></div></div></div>`).join('');
  const recent = [...rs].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);
  $('#recent-table').innerHTML = recent.length ? recent.map((r) => `<tr><td><span class="table-primary">${safe(r.id)}</span></td><td><span class="table-primary">${safe(r.customerName)}</span></td><td>${safe(tourFor(r.tourId)?.name || 'Desconocida')}</td><td>${prettyDate(r.tripDate)}</td><td>${badge(r.status)}</td><td class="amount-column">${price(r.total)}</td></tr>`).join('') : '<tr><td class="table-empty" colspan="6">Todavía no hay reservas. Crea la primera para comenzar.</td></tr>';
}
function filteredReservations() {
  const q = state.search.trim().toLowerCase();
  const results = state.reservations.filter((r) => {
    const textMatch = !q || [r.id, r.customerName, r.customerEmail].some((v) => String(v).toLowerCase().includes(q));
    return textMatch && (state.tour === 'all' || r.tourId === state.tour) && (state.status === 'all' || r.status === state.status);
  });
  const comparators = {
    'trip-asc': (a, b) => a.tripDate.localeCompare(b.tripDate),
    'trip-desc': (a, b) => b.tripDate.localeCompare(a.tripDate),
    'created-desc': (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
    'amount-desc': (a, b) => b.total - a.total
  };
  return results.sort(comparators[state.sort] || comparators['trip-asc']);
}
function renderReservations() {
  const list = filteredReservations();
  const size = Number(state.settings.pageSize) || 10;
  const pages = Math.max(1, Math.ceil(list.length / size));
  state.page = Math.min(Math.max(1, state.page), pages);
  const pageRows = list.slice((state.page - 1) * size, state.page * size);
  $('#reservation-subtitle').textContent = `${state.reservations.length} reservas en tu espacio de trabajo.`;
  $('#reservations-table').innerHTML = pageRows.length ? pageRows.map((r) => `<tr><td><span class="table-primary">${safe(r.id)}</span><span class="table-secondary">${safe(r.customerName)}</span></td><td><span class="table-primary">${safe(tourFor(r.tourId)?.name || 'Desconocida')}</span><span class="table-secondary">${safe(r.customerEmail)}</span></td><td>${prettyDate(r.tripDate)}</td><td>${safe(r.guests)}</td><td><span class="table-primary">${price(r.total)}</span></td><td><label class="sr-only" for="status-${safe(r.id)}">Estado de ${safe(r.id)}</label><select class="status-select" id="status-${safe(r.id)}" data-status-id="${safe(r.id)}">${STATUS.map((s) => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}</select></td><td class="action-column"><div class="table-actions"><button class="table-action" type="button" data-edit="${safe(r.id)}" aria-label="Editar ${safe(r.id)}">Editar</button><button class="table-action danger" type="button" data-delete="${safe(r.id)}" aria-label="Eliminar ${safe(r.id)}">Eliminar</button></div></td></tr>`).join('') : `<tr><td colspan="7" class="table-empty"><div class="no-results-title">No se encontraron reservas</div>Prueba con otra búsqueda o cambia los filtros.</td></tr>`;
  const from = list.length ? (state.page - 1) * size + 1 : 0;
  const through = Math.min(state.page * size, list.length);
  $('#list-counter').textContent = `Mostrando ${from}–${through} de ${list.length}`;
  $('#page-counter').textContent = `${state.page} / ${pages}`;
  $('#prev-page').disabled = state.page <= 1;
  $('#next-page').disabled = state.page >= pages;
  $('#export-csv').disabled = list.length === 0;
}
function getCustomers() {
  const people = new Map();
  for (const r of state.reservations) {
    const email = r.customerEmail.toLowerCase().trim();
    if (!people.has(email)) people.set(email, { email, name: r.customerName, phone: r.customerPhone, bookings: 0, confirmedValue: 0, latestTrip: r.tripDate, latestCreated: r.createdAt });
    const customer = people.get(email);
    customer.bookings++;
    if (r.status === 'Confirmed') customer.confirmedValue += Number(r.total);
    if (r.tripDate > customer.latestTrip) customer.latestTrip = r.tripDate;
    if (r.createdAt > customer.latestCreated) { customer.name = r.customerName; customer.phone = r.customerPhone; customer.latestCreated = r.createdAt; }
  }
  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function renderCustomers() {
  const people = getCustomers();
  const q = state.customerSearch.trim().toLowerCase();
  const filtered = people.filter((p) => !q || [p.name, p.email, p.phone].some((value) => String(value).toLowerCase().includes(q)));
  $('#customers-count').textContent = `${people.length} clientes`;
  $('#customer-counter').textContent = `${filtered.length} cliente${filtered.length === 1 ? '' : 's'} mostrado${filtered.length === 1 ? '' : 's'}`;
  $('#customers-table').innerHTML = filtered.length ? filtered.map((p) => `<tr><td><div class="customer-cell"><span class="customer-avatar" aria-hidden="true">${safe(p.name.split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase())}</span><span><span class="table-primary">${safe(p.name)}</span><span class="table-secondary">${safe(p.email)}</span></span></div></td><td>${safe(p.phone)}</td><td>${p.bookings}</td><td><span class="table-primary">${price(p.confirmedValue)}</span></td><td>${prettyDate(p.latestTrip)}</td><td class="action-column"><button type="button" class="table-action" data-customer-email="${safe(p.email)}">Ver reservas →</button></td></tr>`).join('') : '<tr><td colspan="6" class="table-empty">No se encontraron clientes con esa búsqueda.</td></tr>';
}
function renderSettings() {
  $('#agency-name').value = state.settings.agencyName;
  $('#agency-email').value = state.settings.agencyEmail;
  $('#default-status').value = state.settings.defaultStatus;
  $('#page-size').value = String(state.settings.pageSize);
}
function navigate() {
  const valid = ['dashboard', 'reservations', 'customers', 'settings'];
  const fragment = location.hash.slice(1).toLowerCase();
  const current = valid.includes(fragment) ? fragment : 'dashboard';
  $$('.view').forEach((view) => { view.hidden = view.id !== `view-${current}`; });
  $$('[data-nav]').forEach((link) => {
    const active = link.dataset.nav === current;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  $('#breadcrumb').textContent = SECTION_LABELS[current];
  document.title = `${SECTION_LABELS[current]} — Porter Desk`;
  if (current === 'settings') renderSettings();
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function openMobileMenu() {
  $('#sidebar').classList.add('is-open');
  $('#mobile-overlay').hidden = false;
  $('#menu-toggle').setAttribute('aria-expanded', 'true');
  $('#menu-toggle').setAttribute('aria-label', 'Cerrar navegación');
}
function closeMobileMenu() {
  $('#sidebar').classList.remove('is-open');
  $('#mobile-overlay').hidden = true;
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  $('#menu-toggle').setAttribute('aria-label', 'Abrir navegación');
}
function recalculateTotal() {
  const tour = tourFor($('#tour-select').value);
  const guests = Number($('#guest-count').value) || 0;
  $('#calculated-total').textContent = price((tour?.price || 0) * Math.max(0, guests));
}
function openBookingDialog(id = null) {
  const form = $('#reservation-form'); form.reset();
  $('#customer-phone').setCustomValidity('');
  $('#booking-id').value = id || '';
  if (id) {
    const r = state.reservations.find((item) => item.id === id);
    if (!r) { showToast('No se encontró la reserva.', true); return; }
    $('#dialog-title').textContent = `Editar ${r.id}`;
    $('#save-booking').textContent = 'Guardar cambios';
    $('#customer-name').value = r.customerName;
    $('#customer-email').value = r.customerEmail;
    $('#customer-phone').value = r.customerPhone;
    $('#tour-select').value = r.tourId;
    $('#trip-date').value = r.tripDate;
    $('#guest-count').value = String(r.guests);
    $('#reservation-status').value = r.status;
    $('#booking-notes').value = r.notes || '';
  } else {
    $('#dialog-title').textContent = 'Nueva reserva';
    $('#save-booking').textContent = 'Crear reserva';
    $('#guest-count').value = '2';
    $('#reservation-status').value = state.settings.defaultStatus;
    $('#trip-date').min = offsetDay(0);
    $('#trip-date').value = offsetDay(7);
    $('#tour-select').value = TOURS[0].id;
  }
  $('#trip-date').min = id ? '' : offsetDay(0);
  recalculateTotal();
  $('#reservation-dialog').showModal();
  $('#customer-name').focus();
}
function submitBooking(event) {
  event.preventDefault();
  const form = $('#reservation-form');
  const phone = $('#customer-phone');
  const cleanPhone = phone.value.trim();
  const digits = cleanPhone.replace(/\D/g, '');
  phone.setCustomValidity(digits.length >= 7 && /^[+\d\s()\-]+$/.test(cleanPhone) ? '' : 'Ingresa un teléfono válido de al menos 7 dígitos.');
  const nameInput = $('#customer-name');
  nameInput.value = nameInput.value.trim();
  $('#customer-email').value = $('#customer-email').value.trim();
  if (!form.reportValidity()) return;
  const tour = tourFor($('#tour-select').value);
  const guests = Number($('#guest-count').value);
  if (!tour || !Number.isInteger(guests) || guests < 1 || guests > 30) { showToast('Revisa la experiencia y el número de pasajeros.', true); return; }
  const oldId = $('#booking-id').value;
  const previous = state.reservations.find((r) => r.id === oldId);
  const now = new Date().toISOString();
  const booking = {
    id: previous?.id || idForNextBooking(), customerName: nameInput.value,
    customerEmail: $('#customer-email').value.toLowerCase(), customerPhone: cleanPhone,
    tourId: tour.id, tripDate: $('#trip-date').value, guests,
    unitPrice: tour.price, total: tour.price * guests, status: $('#reservation-status').value,
    notes: $('#booking-notes').value.trim(), createdAt: previous?.createdAt || now, updatedAt: now
  };
  if (!STATUS.includes(booking.status)) return;
  if (previous) state.reservations = state.reservations.map((r) => r.id === oldId ? booking : r);
  else state.reservations.unshift(booking);
  $('#reservation-dialog').close();
  persistBookings();
  showToast(previous ? `${booking.id} actualizada.` : `${booking.id} creada.`);
}
function askConfirmation(title, description, action, buttonLabel = 'Eliminar') {
  $('#confirm-title').textContent = title;
  $('#confirm-description').textContent = description;
  $('#confirm-accept').textContent = buttonLabel;
  confirmHandler = action;
  $('#confirm-dialog').showModal();
  $('#confirm-cancel').focus();
}
function exportCsv() {
  const list = filteredReservations();
  if (!list.length) { showToast('No hay registros para exportar.', true); return; }
  const headers = ['ID', 'Cliente', 'Correo', 'Teléfono', 'Experiencia', 'Fecha del viaje', 'Pasajeros', 'Precio por pasajero (USD)', 'Total (USD)', 'Estado', 'Notas', 'Fecha de creación'];
  const rows = list.map((r) => [r.id, r.customerName, r.customerEmail, r.customerPhone, tourFor(r.tourId)?.name || '', r.tripDate, r.guests, r.unitPrice, r.total, statusLabel(r.status), r.notes || '', r.createdAt]);
  // Prefix leading formula operators for safer opening in spreadsheet apps.
  const escapeCsv = (item) => {
    let value = String(item ?? '');
    if (/^[\s\u0000-\u001F]*[=+@\-\t\r]/.test(value) && !/^-?\d+(\.\d+)?$/.test(value)) value = `'${value}`;
    return `"${value.replaceAll('"', '""')}"`;
  };
  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `porter-reservas-${dateToInput(new Date())}.csv`;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`${list.length} reserva${list.length === 1 ? '' : 's'} exportada${list.length === 1 ? '' : 's'} a CSV.`);
}
function bindEvents() {
  window.addEventListener('hashchange', navigate);
  $$('[data-nav]').forEach((link) => link.addEventListener('click', closeMobileMenu));
  $('#menu-toggle').addEventListener('click', () => $('#sidebar').classList.contains('is-open') ? closeMobileMenu() : openMobileMenu());
  $('#mobile-overlay').addEventListener('click', closeMobileMenu);
  $$('[data-create]').forEach((b) => b.addEventListener('click', () => openBookingDialog()));
  $('#reservation-search').addEventListener('input', (e) => { state.search = e.target.value; state.page = 1; renderReservations(); });
  $('#tour-filter').addEventListener('change', (e) => { state.tour = e.target.value; state.page = 1; renderReservations(); });
  $('#status-filter').addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; renderReservations(); });
  $('#sort-filter').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; renderReservations(); });
  $('#customer-search').addEventListener('input', (e) => { state.customerSearch = e.target.value; renderCustomers(); });
  $('#prev-page').addEventListener('click', () => { state.page--; renderReservations(); });
  $('#next-page').addEventListener('click', () => { state.page++; renderReservations(); });
  $('#export-csv').addEventListener('click', exportCsv);
  $('#reservations-table').addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit]');
    const remove = e.target.closest('[data-delete]');
    if (edit) openBookingDialog(edit.dataset.edit);
    if (remove) {
      const id = remove.dataset.delete;
      askConfirmation('¿Eliminar reserva?', `¿Eliminar ${id}? Esta acción no se puede deshacer.`, () => {
        state.reservations = state.reservations.filter((r) => r.id !== id);
        persistBookings(); showToast(`${id} eliminada.`);
      });
    }
  });
  $('#reservations-table').addEventListener('change', (e) => {
    const control = e.target.closest('[data-status-id]');
    if (!control || !STATUS.includes(control.value)) return;
    const booking = state.reservations.find((r) => r.id === control.dataset.statusId);
    if (!booking) return;
    booking.status = control.value; booking.updatedAt = new Date().toISOString();
    persistBookings(); showToast(`${booking.id}: estado cambiado a ${statusLabel(booking.status).toLowerCase()}.`);
  });
  $('#customers-table').addEventListener('click', (e) => {
    const link = e.target.closest('[data-customer-email]');
    if (!link) return;
    state.search = link.dataset.customerEmail;
    state.tour = 'all'; state.status = 'all'; state.page = 1;
    $('#reservation-search').value = state.search;
    $('#tour-filter').value = 'all'; $('#status-filter').value = 'all';
    renderReservations();
    location.hash = '#reservations';
  });
  $$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => $('#reservation-dialog').close()));
  $('#tour-select').addEventListener('change', recalculateTotal);
  $('#guest-count').addEventListener('input', recalculateTotal);
  $('#customer-phone').addEventListener('input', () => $('#customer-phone').setCustomValidity(''));
  $('#reservation-form').addEventListener('submit', submitBooking);
  $('#confirm-cancel').addEventListener('click', () => { $('#confirm-dialog').close(); confirmHandler = null; });
  $('#confirm-accept').addEventListener('click', () => { const callback = confirmHandler; confirmHandler = null; $('#confirm-dialog').close(); callback?.(); });
  $('#confirm-dialog').addEventListener('close', () => { confirmHandler = null; });
  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    state.settings = {
      agencyName: $('#agency-name').value.trim(), agencyEmail: $('#agency-email').value.trim(),
      defaultStatus: $('#default-status').value, pageSize: Number($('#page-size').value)
    };
    if (state.settings.agencyName.length < 2 || !state.settings.agencyEmail) { showToast('Ingresa un nombre de agencia y correo válidos.', true); return; }
    state.page = 1;
    writeStore(KEYS.settings, state.settings);
    renderAll(); showToast('Configuración guardada.');
  });
  $('#reset-demo').addEventListener('click', () => {
    askConfirmation('¿Restablecer datos de ejemplo?', 'Se reemplazarán todas las reservas y los clientes actuales por los datos de ejemplo originales.', () => {
      state.reservations = sampleData();
      state.page = 1; state.search = ''; state.tour = 'all'; state.status = 'all'; state.customerSearch = '';
      $('#reservation-search').value = ''; $('#tour-filter').value = 'all'; $('#status-filter').value = 'all'; $('#customer-search').value = '';
      persistBookings(); showToast('Reservas de ejemplo restablecidas.');
    }, 'Restablecer');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileMenu(); });
}

document.addEventListener('DOMContentLoaded', initialize);
