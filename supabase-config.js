// supabase-config.js — shared across all pages
const SUPABASE_URL = 'https://cdztunjaymnwklvguvuu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkenR1bmpheW1ud2tsdmd1dnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzUxODEsImV4cCI6MjA5MjkxMTE4MX0.26Gh6ZlYYa91bPKCtKl_d-6zZ4UBGCwrOIyx4lybXG4';
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const CHECKPOINTS = [
  'DAC 1','DAC 2','DAC 3','DAC 4','Comprehensive Exam',
  'DAC 5','DAC 6','DAC 7','DAC 8','Colloquium',
  'Thesis submission','Viva voce'
];

// ── Get profile with role fallback from auth metadata ─────────
async function getProfile(userId) {
  // Try profiles table first
  const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (profile && profile.role) return profile;

  // Fallback: read role from auth user metadata
  const { data: { user } } = await sb.auth.getUser();
  const metaRole = user?.user_metadata?.role || 'student';

  // Try to upsert the missing profile row
  try {
    await sb.from('profiles').upsert({
      id:         userId,
      role:       metaRole,
      full_name:  user?.user_metadata?.full_name || '',
      email:      user?.email || ''
    });
  } catch(e) {}

  return { id: userId, role: metaRole, full_name: user?.user_metadata?.full_name || '', email: user?.email || '' };
}

// ── Auth guard ────────────────────────────────────────────────
async function requireAuth(allowedRoles = []) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return null; }

  const profile = await getProfile(session.user.id);
  if (!profile) { window.location.href = 'index.html'; return null; }

  if (allowedRoles.length && !allowedRoles.includes(profile.role)) {
    const dest = profile.role === 'admin' ? 'admin.html'
               : profile.role === 'supervisor' ? 'supervisor.html'
               : 'student.html';
    if (!window.location.pathname.endsWith(dest)) {
      window.location.href = dest;
    }
    return null;
  }
  return { user: session.user, profile };
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// ── File upload ───────────────────────────────────────────────
async function uploadFile(file, bucket, folder) {
  const ext  = file.name.split('.').pop();
  const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await sb.storage.from(bucket).upload(name, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(name);
  return urlData.publicUrl;
}

// ── Ensure timeline rows exist for a student ──────────────────
async function ensureTimeline(studentId) {
  const { data: existing } = await sb.from('academic_timeline')
    .select('checkpoint').eq('student_id', studentId);
  const existingSet = new Set((existing || []).map(r => r.checkpoint));
  const toInsert = CHECKPOINTS
    .filter(cp => !existingSet.has(cp))
    .map((cp, i) => ({
      student_id:       studentId,
      checkpoint:       cp,
      checkpoint_order: CHECKPOINTS.indexOf(cp) + 1,
      status:           'Pending'
    }));
  if (toInsert.length > 0) {
    await sb.from('academic_timeline').insert(toInsert);
  }
}

// ── Toast notification ────────────────────────────────────────
function showToast(msg, type = 'success') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.style.cssText = `
    position:fixed;top:76px;right:1.5rem;z-index:9999;
    padding:12px 18px;border-radius:10px;font-size:0.875rem;font-weight:500;
    font-family:'Poppins',sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.15);
    animation:slideIn 0.3s ease;max-width:340px;
    ${type === 'success' ? 'background:#d1fae5;color:#065f46;border-left:4px solid #059669;' : ''}
    ${type === 'error'   ? 'background:#fee2e2;color:#991b1b;border-left:4px solid #dc2626;' : ''}
    ${type === 'info'    ? 'background:#dbeafe;color:#1e40af;border-left:4px solid #3b82f6;' : ''}
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    t.style.transition = 'all 0.4s';
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Shared navbar ─────────────────────────────────────────────
function renderNavbar(role, activePage) {
  const links = {
    admin:      [['admin.html','Dashboard'],['common.html','Common']],
    supervisor: [['supervisor.html','My Students'],['common.html','Common']],
    student:    [['student.html','My Portal'],['common.html','Common']],
  };
  const roleColors = { admin:'#ef4444', supervisor:'#8b5cf6', student:'#0a7c6e' };
  return `
  <nav class="navbar">
    <a href="${role === 'admin' ? 'admin.html' : role === 'supervisor' ? 'supervisor.html' : 'student.html'}" class="navbar-brand">
      <div class="navbar-logo">A</div>
      <div class="navbar-title">AcSIR <span>Portal</span></div>
    </a>
    <div class="navbar-nav">
      ${(links[role]||[]).map(([href,label]) =>
        `<a href="${href}" class="nav-link ${activePage===href?'active':''}">${label}</a>`
      ).join('')}
      <div class="nav-sep"></div>
      <span class="role-badge" style="background:${roleColors[role]||'#0a7c6e'}">${role}</span>
      <button class="btn-logout" onclick="signOut()">Sign out</button>
    </div>
  </nav>`;
}
