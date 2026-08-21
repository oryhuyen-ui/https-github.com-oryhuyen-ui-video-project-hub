import './style.css';

const USERS_KEY = 'ory-users-v2';
const VIDEOS_KEY = 'ory-videos-v2';
const SESSION_KEY = 'ory-session-v2';
const demo = { id: 'user-demo', name: 'ORY Demo', email: 'demo@oryvideo.local', password: 'Demo123!' };
const samples = [
  { id: 'video-serum', title: 'Quảng cáo serum phục hồi da', status: 'Bản nháp', duration: '45 giây', format: 'Video dọc 9:16', audience: 'Nữ 22–35 tuổi quan tâm chăm sóc da', goal: 'Giới thiệu serum và thúc đẩy dùng thử', script: 'Làn da mệt mỏi sau một ngày dài? Serum phục hồi giúp cấp ẩm, làm dịu và trả lại vẻ căng bóng tự nhiên.' },
  { id: 'video-ai-day', title: 'Một ngày làm việc cùng AI', status: 'Đang thực hiện', duration: '60 giây', format: 'Video dọc 9:16', audience: 'Người trẻ yêu công nghệ', goal: 'Chia sẻ cách AI hỗ trợ công việc', script: 'Bắt đầu ngày mới cùng trợ lý AI: lên kế hoạch, ghi chú và biến ý tưởng thành hành động.' },
  { id: 'video-cafe', title: 'Quảng cáo quán cà phê 30 giây', status: 'Hoàn thành', duration: '30 giây', format: 'Video ngang 16:9', audience: 'Khách hàng tại khu vực lân cận', goal: 'Thu hút khách ghé quán', script: 'Một góc nhỏ thơm mùi cà phê, nơi bạn có thể chậm lại và tận hưởng từng khoảnh khắc.' }
].map(video => ({ ...video, ownerId: demo.id }));

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function init() {
  const users = read(USERS_KEY, []);
  if (!users.some(u => u.id === demo.id)) write(USERS_KEY, [...users, demo]);
  const videos = read(VIDEOS_KEY, []);
  const existing = new Set(videos.map(v => v.id));
  write(VIDEOS_KEY, [...videos, ...samples.filter(v => !existing.has(v.id))]);
}

const app = document.querySelector('#app');
let screen = location.hash.startsWith('#video/') ? 'detail' : 'login';
let selectedId = location.hash.startsWith('#video/') ? decodeURIComponent(location.hash.slice(7)) : null;
let notice = '';
const currentUser = () => read(USERS_KEY, []).find(u => u.id === localStorage.getItem(SESSION_KEY));
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));

function authShell(content, subtitle) {
  return `<main class="auth-page"><section class="auth-card"><div class="brand"><span>ORY</span><h1>ORY Video AI Studio</h1></div><p class="subtitle">${subtitle}</p>${content}</section></main>`;
}
function field(label, name, type='text', placeholder='', autocomplete='') { return `<label>${label}<input required name="${name}" type="${type}" placeholder="${placeholder}"${autocomplete ? ` autocomplete="${autocomplete}"` : ''} /></label>`; }
function renderLogin(error='') {
  app.innerHTML = authShell(`<form id="login-form">${field('Email','email','email','ban@example.com','email')}${field('Mật khẩu','password','password','Nhập mật khẩu','current-password')}${error ? `<p class="error" role="alert">${error}</p>` : ''}<button class="primary">Đăng nhập</button></form><p class="switch">Chưa có tài khoản? <button class="link" id="go-register">Tạo tài khoản</button></p><aside class="demo"><strong>Tài khoản thử</strong><span>Email: demo@oryvideo.local</span><span>Mật khẩu: Demo123!</span></aside>`, 'Đăng nhập để tiếp tục với khu vực video của bạn.');
  document.querySelector('#go-register').onclick = () => { screen='register'; render(); };
  document.querySelector('#login-form').onsubmit = e => {
    e.preventDefault(); const data = new FormData(e.target);
    const user = read(USERS_KEY, []).find(u => u.email === data.get('email').trim().toLowerCase() && u.password === data.get('password'));
    if (!user) return renderLogin('Email hoặc mật khẩu chưa đúng. Vui lòng thử lại.');
    localStorage.setItem(SESSION_KEY, user.id); history.replaceState(null,'',location.pathname); selectedId=null; screen='list'; render();
  };
}
function renderRegister(error='') {
  app.innerHTML = authShell(`<form id="register-form">${field('Tên','name','text','Tên hiển thị','name')}${field('Email','email','email','ban@example.com','email')}${field('Mật khẩu','password','password','Tạo mật khẩu','new-password')}${field('Nhập lại mật khẩu','confirm','password','Nhập lại mật khẩu','new-password')}${error ? `<p class="error" role="alert">${error}</p>` : ''}<button class="primary">Tạo tài khoản</button></form><p class="switch">Đã có tài khoản? <button class="link" id="go-login">Đăng nhập</button></p>`, 'Tạo tài khoản để bắt đầu khu vực riêng của bạn.');
  document.querySelector('#go-login').onclick = () => { screen='login'; render(); };
  document.querySelector('#register-form').onsubmit = e => {
    e.preventDefault(); const d = new FormData(e.target); const email=d.get('email').trim().toLowerCase();
    if (d.get('password') !== d.get('confirm')) return renderRegister('Hai mật khẩu chưa giống nhau.');
    const users=read(USERS_KEY, []); if (users.some(u => u.email === email)) return renderRegister('Email này đã có tài khoản. Vui lòng đăng nhập.');
    const user={ id:`user-${crypto.randomUUID()}`, name:d.get('name').trim(), email, password:d.get('password') };
    write(USERS_KEY,[...users,user]); localStorage.setItem(SESSION_KEY,user.id); screen='list'; render();
  };
}
function header(user) { return `<header><div class="brand"><span>ORY</span><h1>Video AI Studio</h1></div><div class="account"><div><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)}</small></div><button id="logout" class="secondary">Đăng xuất</button></div></header>`; }
function wireHeader() { document.querySelector('#logout').onclick=()=>{ localStorage.removeItem(SESSION_KEY); history.replaceState(null,'',location.pathname); selectedId=null; screen='login'; render(); }; }
function renderList(user) {
  const videos=read(VIDEOS_KEY,[]).filter(v=>v.ownerId===user.id);
  app.innerHTML=`${header(user)}<main class="workspace"><div class="heading"><p>Không gian làm việc</p><h2>Video của tôi</h2><span>Quản lý và cập nhật hồ sơ video của riêng bạn.</span></div>${videos.length ? `<div class="video-list">${videos.map(v=>`<button class="video-row" data-id="${v.id}"><div><h3>${escapeHtml(v.title)}</h3><p>${escapeHtml(v.goal)}</p></div><span class="status">${escapeHtml(v.status)}</span><b>→</b></button>`).join('')}</div>` : `<section class="empty"><div>▤</div><h3>Bạn chưa có video nào.</h3><p>Các video bạn tạo sau này sẽ xuất hiện tại đây.</p></section>`}</main>`;
  wireHeader(); document.querySelectorAll('.video-row').forEach(el=>el.onclick=()=>{notice='';location.hash=`video/${encodeURIComponent(el.dataset.id)}`;});
}
function renderDetail(user) {
  const video=read(VIDEOS_KEY,[]).find(v=>v.id===selectedId && v.ownerId===user.id);
  if (!video) { app.innerHTML=`${header(user)}<main class="workspace"><button id="back" class="back">← Video của tôi</button><section class="empty"><h3>Không thể mở video này.</h3><p>Video không tồn tại hoặc không thuộc tài khoản của bạn.</p></section></main>`; wireHeader(); document.querySelector('#back').onclick=()=>{location.hash='';screen='list';render();}; return; }
  app.innerHTML=`${header(user)}<main class="workspace detail"><button id="back" class="back">← Video của tôi</button><div class="heading"><p>Hồ sơ video</p><h2>${escapeHtml(video.title)}</h2><span>Chỉnh sửa thông tin và lưu lại thay đổi.</span></div>${notice ? `<div class="success">✓ ${notice}</div>`:''}<form id="video-form" class="profile">${field('Tên video','title')}${field('Trạng thái','status')}${field('Thời lượng','duration')}${field('Định dạng','format')}<label>Đối tượng khán giả<textarea name="audience" required></textarea></label><label>Mục tiêu video<textarea name="goal" required></textarea></label><label class="wide">Kịch bản<textarea name="script" rows="7" required></textarea></label><div class="actions"><button class="primary">Lưu thay đổi</button></div></form></main>`;
  for (const [key,value] of Object.entries(video)) { const input=document.querySelector(`[name="${key}"]`); if(input) input.value=value; }
  wireHeader(); document.querySelector('#back').onclick=()=>{notice='';location.hash='';screen='list';render();};
  document.querySelector('#video-form').onsubmit=e=>{e.preventDefault();const d=new FormData(e.target);const videos=read(VIDEOS_KEY,[]);const index=videos.findIndex(v=>v.id===video.id && v.ownerId===user.id);if(index<0)return;videos[index]={...videos[index],...Object.fromEntries(d)};write(VIDEOS_KEY,videos);notice='Đã lưu thay đổi thành công.';render();};
}
function syncRoute() {
  if (location.hash.startsWith('#video/')) {
    selectedId=decodeURIComponent(location.hash.slice(7));
    screen='detail';
  } else if (currentUser()) {
    selectedId=null;
    screen='list';
  }
  render();
}
function render() { const user=currentUser(); if (!user) { localStorage.removeItem(SESSION_KEY); return screen==='register' ? renderRegister() : renderLogin(); } if(screen==='detail') renderDetail(user); else renderList(user); }
window.addEventListener('hashchange', syncRoute);
init(); syncRoute();
