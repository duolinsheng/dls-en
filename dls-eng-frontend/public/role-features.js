const WORKSPACE_TITLES = {
  student: "Student learning center",
  parent: "Parent dashboard",
  teacher: "Teacher workspace",
  admin: "Admin console",
};

const WORKSPACE_NAV_LABELS = {
  student: "Learning center",
  parent: "Parent view",
  teacher: "Teacher view",
  admin: "Admin console",
};

async function fetchDashboard() {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch("/auth/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function readLocalStudentStats() {
  const parse = (key, fb) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fb)); } catch { return fb; }
  };
  const stats = parse("dls-ai-progress-stats", {});
  const checkin = parse("dls-ai-checkin", {});
  return {
    xp: parseInt(localStorage.getItem("dls-ai-xp") || "0", 10),
    quizCount: parse("dls-ai-quiz-scores", []).length,
    favoritesCount: parse("dls-ai-favorites", []).length,
    wordbookCount: parse("dls-ai-wordbook", []).length,
    phrasesLearned: stats.phrasesLearned || 0,
    audioPlayed: stats.audioPlayed || 0,
    checkinStreak: checkin.streak || 0,
  };
}

function statCard(label, value, hint) {
  return `<div class="ws-stat-card"><div class="ws-stat-label">${label}</div><div class="ws-stat-value">${value}</div>${hint ? `<div class="ws-stat-hint">${hint}</div>` : ""}</div>`;
}

function renderStudentPanel(data) {
  const stats = { ...data.stats, ...readLocalStudentStats() };
  const assignments = data.assignments || [];
  return `
    <div class="ws-section">
      <h3>My learning stats</h3>
      <div class="ws-stat-grid">
        ${statCard("XP", stats.xp, "XP")}
        ${statCard("Check-in streak", `${stats.checkinStreak} days`)}
        ${statCard("Quizzes finished", `${stats.quizCount}`)}
        ${statCard("Wordbook", `${stats.wordbookCount} words`)}
        ${statCard("Phrases learned", `${stats.phrasesLearned}`)}
        ${statCard("Audio plays", `${stats.audioPlayed}`)}
      </div>
    </div>
    <div class="ws-section">
      <h3>Quick start</h3>
      <div class="ws-actions">
        <button type="button" class="btn ws-action-btn" data-go="quiz">Start a quiz</button>
        <button type="button" class="btn ws-action-btn" data-go="dictionary">Look up a word</button>
        <button type="button" class="btn ws-action-btn" data-go="wordbook">Wordbook</button>
        <button type="button" class="btn ws-action-btn" data-go="daily">Phrase of the day</button>
        <button type="button" class="btn ws-action-btn" data-go="chat">Tutor chat</button>
      </div>
    </div>
    ${assignments.length ? `
    <div class="ws-section">
      <h3>Assigned by your teacher</h3>
      <div class="ws-list">${assignments.map((a) => `
        <div class="ws-list-item">
          <strong>${escapeHtml(a.title)}</strong>
          <span class="ws-muted">${escapeHtml(a.teacherName || "Teacher")} · ${formatDate(a.createdAt)}</span>
          ${a.content ? `<p>${escapeHtml(a.content)}</p>` : ""}
        </div>`).join("")}</div>
    </div>` : ""}
  `;
}

function renderParentPanel(data) {
  const linked = data.linkedStudentUsername || "demo";
  const child = (data.students || []).find((s) => s.username === linked) || (data.students || [])[0];
  const stats = child?.stats || {};
  return `
    <div class="ws-section">
      <h3>Your child's progress</h3>
      ${child ? `
        <p>Viewing: <strong>${escapeHtml(child.displayName)}</strong>（@${escapeHtml(child.username)}）</p>
        <div class="ws-stat-grid">
          ${statCard("XP", stats.xp || 0)}
          ${statCard("Check-in streak", `${stats.checkinStreak || 0} days`)}
          ${statCard("Quizzes finished", `${stats.quizCount || 0}`)}
          ${statCard("Wordbook", `${stats.wordbookCount || 0} words`)}
        </div>` : `<p class="ws-muted">No student data yet. Link a student account.</p>`}
    </div>
    <div class="ws-section">
      <h3>Guardian settings</h3>
      <form id="parentSettingsForm" class="ws-form">
        <label>Linked student account<input id="parentLinkedStudent" value="${escapeHtml(linked)}" placeholder="demo" /></label>
        <label>Weekly goal<input id="parentWeeklyGoal" value="${escapeHtml(data.weeklyGoal || "")}" placeholder="For example: finish 3 quizzes" /></label>
        <label>Encouragement<textarea id="parentNote" rows="3" placeholder="Write a few kind words">${escapeHtml(data.parentNote || "")}</textarea></label>
        <button type="submit" class="btn">Save settings</button>
      </form>
    </div>
    <div class="ws-section">
      <h3>Learning together</h3>
      <ul class="ws-tips">${(data.tips || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    </div>
    <div class="ws-section">
      <h3>All students</h3>
      <div class="ws-table-wrap"><table class="ws-table">
        <thead><tr><th>Student</th><th>XP</th><th>Quizzes</th><th>Check-in</th></tr></thead>
        <tbody>${(data.students || []).map((s) => `<tr>
          <td>${escapeHtml(s.displayName)}</td>
          <td>${s.stats?.xp || 0}</td>
          <td>${s.stats?.quizCount || 0}</td>
          <td>${s.stats?.checkinStreak || 0} days</td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>
  `;
}

function renderTeacherPanel(data) {
  const students = data.students || [];
  const assignments = data.assignments || [];
  return `
    <div class="ws-section">
      <h3>Teaching shortcuts</h3>
      <div class="ws-actions">
        <button type="button" class="btn ws-action-btn" data-go="quiz">AI quiz maker</button>
        <button type="button" class="btn ws-action-btn" data-go="phrases">Phrase lesson plans</button>
        <button type="button" class="btn ws-action-btn" data-go="dictionary">Dictionary prep</button>
        <button type="button" class="btn ws-action-btn" data-go="chat">AI teaching chat</button>
      </div>
    </div>
    <div class="ws-section">
      <h3>Assign practice</h3>
      <form id="teacherAssignmentForm" class="ws-form">
        <label>Title<input id="assignmentTitle" placeholder="For example: Jyutping review this week" required /></label>
        <label>Instructions<textarea id="assignmentContent" rows="3" placeholder="Finish the tone drill and submit a quiz"></textarea></label>
        <label>Assign to
          <select id="assignmentTarget">
            <option value="all">All students</option>
            ${students.map((s) => `<option value="${s.id}">${escapeHtml(s.displayName)}</option>`).join("")}
          </select>
        </label>
        <button type="submit" class="btn">Publish</button>
      </form>
    </div>
    ${assignments.length ? `
    <div class="ws-section">
      <h3>Published practice</h3>
      <div class="ws-list">${assignments.map((a) => `
        <div class="ws-list-item">
          <strong>${escapeHtml(a.title)}</strong>
          <span class="ws-muted">${a.target === "all" ? "All students" : "Selected students"} · ${formatDate(a.createdAt)}</span>
          ${a.content ? `<p>${escapeHtml(a.content)}</p>` : ""}
        </div>`).join("")}</div>
    </div>` : ""}
    <div class="ws-section">
      <h3>Student progress</h3>
      <div class="ws-table-wrap"><table class="ws-table">
        <thead><tr><th>Student</th><th>XP</th><th>Quizzes</th><th>Words</th><th>Audio</th></tr></thead>
        <tbody>${students.map((s) => `<tr>
          <td>${escapeHtml(s.displayName)}<br><span class="ws-muted">@${escapeHtml(s.username)}</span></td>
          <td>${s.stats?.xp || 0}</td>
          <td>${s.stats?.quizCount || 0}</td>
          <td>${s.stats?.wordbookCount || 0}</td>
          <td>${s.stats?.audioPlayed || 0}</td>
        </tr>`).join("") || `<tr><td colspan="5">No student accounts yet</td></tr>`}</tbody>
      </table></div>
    </div>
  `;
}

function renderAdminPanel(data) {
  const { counts, users } = data;
  return `
    <div class="ws-section">
      <h3>System overview</h3>
      <div class="ws-stat-grid">
        ${statCard("All users", counts?.total || 0)}
        ${statCard("Students", counts?.byRole?.student || 0)}
        ${statCard("Parents", counts?.byRole?.parent || 0)}
        ${statCard("Teachers", counts?.byRole?.teacher || 0)}
        ${statCard("Admins", counts?.byRole?.admin || 0)}
      </div>
    </div>
    <div class="ws-section">
      <h3>Manage users</h3>
      <div class="ws-table-wrap"><table class="ws-table">
        <thead><tr><th>User</th><th>Role</th><th>XP</th><th>Quizzes</th><th>Actions</th></tr></thead>
        <tbody>${(users || []).map((u) => `<tr>
          <td>${escapeHtml(u.displayName)}<br><span class="ws-muted">@${escapeHtml(u.username)}</span></td>
          <td><span class="nav-role-badge" data-role="${u.role}">${escapeHtml(u.roleLabel)}</span></td>
          <td>${u.stats?.xp || 0}</td>
          <td>${u.stats?.quizCount || 0}</td>
          <td>${u.role === "admin" ? "—" : `
            <select class="ws-role-select" data-user-id="${u.id}">
              <option value="student" ${u.role === "student" ? "selected" : ""}>Student</option>
              <option value="parent" ${u.role === "parent" ? "selected" : ""}>Parent</option>
              <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>Teacher</option>
            </select>`}
          </td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>
    <div class="ws-section">
      <h3>Admin shortcuts</h3>
      <div class="ws-actions">
        <button type="button" class="btn ws-action-btn" data-go="settings">System settings</button>
        <button type="button" class="btn secondary ws-action-btn" id="wsRefreshAdmin">Refresh data</button>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("zh-CN");
}

function bindWorkspaceActions(container) {
  container.querySelectorAll(".ws-action-btn[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => navigateTo(btn.dataset.go));
  });

  container.querySelector("#parentSettingsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      linkedStudentUsername: document.getElementById("parentLinkedStudent")?.value.trim(),
      weeklyGoal: document.getElementById("parentWeeklyGoal")?.value.trim(),
      parentNote: document.getElementById("parentNote")?.value.trim(),
    };
    const { ok, data } = await authRequest("/auth/parent/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (ok) {
      showPixelToast?.("Guardian settings saved");
      renderRoleWorkspace();
    } else {
      alert(data.error || "Could not save");
    }
  });

  container.querySelector("#teacherAssignmentForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const targetVal = document.getElementById("assignmentTarget")?.value;
    const body = {
      title: document.getElementById("assignmentTitle")?.value.trim(),
      content: document.getElementById("assignmentContent")?.value.trim(),
      target: targetVal === "all" ? "all" : undefined,
      targetStudentId: targetVal === "all" ? undefined : targetVal,
    };
    const { ok, data } = await authRequest("/auth/teacher/assignments", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (ok) {
      showPixelToast?.("Practice published");
      renderRoleWorkspace();
    } else {
      alert(data.error || "Could not publish");
    }
  });

  container.querySelectorAll(".ws-role-select").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const userId = sel.dataset.userId;
      const role = sel.value;
      const { ok, data } = await authRequest(`/auth/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      if (ok) {
        showPixelToast?.("Role updated");
        renderRoleWorkspace();
      } else {
        alert(data.error || "Could not update");
        renderRoleWorkspace();
      }
    });
  });

  container.querySelector("#wsRefreshAdmin")?.addEventListener("click", renderRoleWorkspace);
}

async function renderRoleWorkspace() {
  const root = document.getElementById("roleWorkspaceContent");
  const titleEl = document.getElementById("roleWorkspaceTitle");
  if (!root) return;

  const user = getCurrentUser();
  if (!user) {
    root.innerHTML = `<p class="ws-muted">Please <a href="#" data-go="auth">log in</a> to use your workspace.</p>`;
    root.querySelector("[data-go=auth]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("auth");
    });
    return;
  }

  const role = user.role || "student";
  if (titleEl) titleEl.textContent = WORKSPACE_TITLES[role] || "Workspace";

  root.innerHTML = `<p class="ws-loading">Loading…</p>`;
  const data = await fetchDashboard();
  if (!data) {
    root.innerHTML = `<p class="ws-muted">Could not load. Make sure you are logged in and the service is running.</p>`;
    return;
  }

  let html = "";
  if (role === "student") html = renderStudentPanel(data);
  else if (role === "parent") html = renderParentPanel(data);
  else if (role === "teacher") html = renderTeacherPanel(data);
  else if (role === "admin") html = renderAdminPanel(data);
  else html = `<p class="ws-muted">Unknown role</p>`;

  root.innerHTML = html;
  bindWorkspaceActions(root);
}

function updateWorkspaceNav() {
  const item = document.getElementById("navWorkspaceItem");
  const btn = document.getElementById("navWorkspaceBtn");
  const user = getCurrentUser();
  if (!item || !btn) return;
  if (user?.role) {
    item.hidden = false;
    btn.textContent = WORKSPACE_NAV_LABELS[user.role] || "Workspace";
  } else {
    item.hidden = true;
  }
}

const THEME_KEY = "dls-ai-theme";
const THEME_CYCLE = ["auto", "light", "dark"];
const THEME_ICON = { auto: "🌗", light: "☀️", dark: "🌙" };
const THEME_LABEL = { auto: "Match system", light: "Light", dark: "Dark" };

function getTheme() {
  return THEME_CYCLE.includes(localStorage.getItem(THEME_KEY)) ? localStorage.getItem(THEME_KEY) : "auto";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("navThemeBtn");
  if (btn) {
    btn.textContent = THEME_ICON[theme] || "🌗";
    btn.title = `Theme: ${THEME_LABEL[theme] || "Auto"} (click to switch)`;
  }
}

function cycleTheme() {
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(getTheme()) + 1) % THEME_CYCLE.length];
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  if (typeof showPixelToast === "function") {
    showPixelToast(`Theme: ${THEME_LABEL[next]}`);
  }
}

function initThemeToggle() {
  applyTheme(getTheme());
  document.getElementById("navThemeBtn")?.addEventListener("click", cycleTheme);
}

function initRoleFeatures() {
  initThemeToggle();
  updateWorkspaceNav();
  const origUpdateNav = window.updateNavAuthUI;
  window.updateNavAuthUI = function () {
    origUpdateNav?.();
    updateWorkspaceNav();
  };

  const origNavigate = window.navigateTo;
  if (origNavigate) {
    window.navigateTo = function (pageName) {
      origNavigate(pageName);
      if (pageName === "workspace") renderRoleWorkspace();
    };
  }

  if (document.getElementById("page-workspace")?.classList.contains("active")) {
    renderRoleWorkspace();
  }
}

window.renderRoleWorkspace = renderRoleWorkspace;
document.addEventListener("DOMContentLoaded", initRoleFeatures);
