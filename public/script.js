const socket = io();

const usernameInput = document.getElementById('username');
const enterChatBtn = document.getElementById('enterChat');
const namePrompt = document.getElementById('namePrompt');
const chatBox = document.getElementById('chatBox');

const keyInput = document.getElementById('key');
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const userList = document.getElementById('userList');
const recipientSelect = document.getElementById('recipient');

let myName = "";
let userMap = {};

enterChatBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (name) {
    myName = name;
    socket.emit('set username', myName);
    namePrompt.classList.add('hidden');
    chatBox.classList.remove('hidden');
  }
});

function addMessage(content, fromSelf = false) {
  const bubble = document.createElement('div');
  bubble.className = `inline-block px-4 py-2 rounded-xl shadow max-w-[80%] ${
    fromSelf ? 'bg-blue-200 self-end text-right' : 'bg-pink-200 self-start text-left'
  }`;
  bubble.innerHTML = content;

  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col';
  wrapper.appendChild(bubble);

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

function encryptMessage(message, key) {
  return CryptoJS.AES.encrypt(message, key).toString();
}

function decryptMessage(cipher, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    return bytes.toString(CryptoJS.enc.Utf8) || '[🔐 Sai khóa giải mã]';
  } catch {
    return '[❌ Lỗi giải mã]';
  }
}

socket.on('user list', (users) => {
  userList.innerHTML = '';
  recipientSelect.innerHTML = '<option value="all">🌍 Gửi tới tất cả</option>';
  userMap = users;

  for (const id in users) {
    if (users[id] === myName) continue;

    const li = document.createElement('li');
    li.textContent = '💡 ' + users[id];
    li.className = 'cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded';
    userList.appendChild(li);

    const option = document.createElement('option');
    option.value = id;
    option.textContent = `🔒 ${users[id]}`;
    recipientSelect.appendChild(option);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  const key = keyInput.value.trim();
  const recipient = recipientSelect.value;
  if (!msg || !key) return;

  const full = `${myName}: ${msg}`;
  const encrypted = encryptMessage(full, key);

  if (recipient === 'all') {
    socket.emit('public message', encrypted);
  } else {
    socket.emit('private message', { to: recipient, encrypted });
  }

  addMessage(full, true);
  input.value = '';
});

socket.on('public message', (encrypted) => {
  const key = keyInput.value.trim();
  const decrypted = decryptMessage(encrypted, key);
  if (decrypted.startsWith(`${myName}:`)) return;
  addMessage(decrypted);
});

socket.on('private message', ({ from, encrypted }) => {
  const key = keyInput.value.trim();
  const decrypted = decryptMessage(encrypted, key);
  const sender = userMap[from] || '🤖 Unknown';
  addMessage(`🔐 [Riêng tư] ${sender}: ${decrypted}`);
});
