// Disapp Frontend — Hybrid Chat App
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

$('#tab-login')?.addEventListener('click', () => {
  $('#tab-login').classList.add('bg-primary', 'text-on-primary');
  $('#tab-login').classList.remove('text-on-surface-variant');
  $('#tab-register').classList.remove('bg-primary', 'text-on-primary');
  $('#tab-register').classList.add('text-on-surface-variant');
  $('#form-login').classList.remove('hidden');
  $('#form-register').classList.add('hidden');
});

$('#tab-register')?.addEventListener('click', () => {
  $('#tab-register').classList.add('bg-primary', 'text-on-primary');
  $('#tab-register').classList.remove('text-on-surface-variant');
  $('#tab-login').classList.remove('bg-primary', 'text-on-primary');
  $('#tab-login').classList.add('text-on-surface-variant');
  $('#form-register').classList.remove('hidden');
  $('#form-login').classList.add('hidden');
});

function togglePassword(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function handleLogin(e) {
  e.preventDefault();
  const username = $('#login-username').value.trim();
  if (!username) return;
  showToast(`Selamat datang, @${username}!`);
  setTimeout(() => {
    $('#view-login').classList.add('hidden');
    $('#view-app').classList.remove('hidden');
    $('#view-app').classList.add('flex');
  }, 400);
}

function handleRegister(e) {
  e.preventDefault();
  showToast('Akun berhasil dibuat! Silakan masuk.');
  $('#tab-login').click();
}

const chatData = {
  sarah: { name: 'Sarah Jenkins', avatar: 'SJ', status: 'Active Now · Typing...', gradient: 'from-pink-500 to-rose-600' },
  product: { name: 'Product Strategy', avatar: 'hub', status: '12 anggota · 3 online', gradient: 'from-blue-500 to-indigo-600', isGroup: true },
  leo: { name: 'Leo Kwang', avatar: 'LK', status: 'Active Now', gradient: 'from-emerald-500 to-teal-600' },
  david: { name: 'David Chen', avatar: 'DC', status: 'Offline', gradient: 'from-amber-500 to-orange-600' },
};

function selectChat(id) {
  $$('.conv-item').forEach((el) => el.classList.remove('bg-surface-container'));
  const item = $(`.conv-item[data-id="${id}"]`);
  if (item) item.classList.add('bg-surface-container');
  const data = chatData[id];
  if (!data) return;
  $('#chat-name').textContent = data.name;
  $('#chat-status').textContent = data.status;
  const avatar = $('#chat-avatar');
  if (data.isGroup) avatar.innerHTML = '<span class="material-symbols-outlined text-[20px]">hub</span>';
  else avatar.textContent = data.avatar;
  avatar.className = `w-10 h-10 rounded-full bg-gradient-to-br ${data.gradient} flex items-center justify-center text-white font-semibold`;
}

function sendMessage() {
  const input = $('#msg-input');
  const text = input.value.trim();
  if (!text) return;
  const area = $('#messages-area');
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const bubble = document.createElement('div');
  bubble.className = 'flex gap-3 max-w-[75%] ml-auto flex-row-reverse msg-bubble';
  bubble.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold shrink-0 mt-1">AR</div>
    <div>
      <div class="bg-primary text-on-primary rounded-2xl rounded-tr-md px-4 py-2.5">
        <p class="text-sm leading-relaxed">${escapeHtml(text)}</p>
      </div>
      <span class="text-[11px] text-on-surface-variant mt-1 block text-right flex items-center justify-end gap-1">
        ${time} <span class="material-symbols-outlined text-[14px] text-primary">done_all</span>
      </span>
    </div>`;
  area.appendChild(bubble);
  area.scrollTop = area.scrollHeight;
  input.value = '';
  input.style.height = 'auto';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

$('#msg-input')?.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 128) + 'px';
});

function showToast(msg) {
  const toast = $('#toast');
  $('#toast-msg').textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
    toast.classList.remove('opacity-100');
  }, 2500);
}

function showCreateServer() { showToast('Fitur Buat Server — segera hadir di Sprint 3'); }
function showSettings() { showToast('Pengaturan akun — tema, privasi, notifikasi'); }

console.log('%cDisapp Frontend ready', 'color:#ffc300;font-weight:bold');
