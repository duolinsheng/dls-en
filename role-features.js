// Workspace titles and nav labels come from i18n: workspace.title.<role> / workspace.nav.<role>
const WORKSPACE_ROLES = ["student", "parent", "teacher", "admin"];

function workspaceText(kind, role) {
  return WORKSPACE_ROLES.includes(role) ? t(`workspace.${kind}.${role}`) : t("workspace.generic");
}

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
      <h3>${t("workspace.student.stats")}</h3>
      <div class="ws-stat-grid">
        ${statCard("XP", stats.xp, "XP")}
        ${statCard(t("stats.checkinStreak"), t("common.days", { count: stats.checkinStreak }))}
        ${statCard(t("stats.quizzesFinished"), `${stats.quizCount}`)}
        ${statCard(t("nav.wordbook"), t("common.words", { count: stats.wordbookCount }))}
        ${statCard(t("stats.phrasesLearned"), `${stats.phrasesLearned}`)}
        ${statCard(t("stats.audioPlays"), `${stats.audioPlayed}`)}
      </div>
    </div>
    <div class="ws-section">
      <h3>${t("workspace.student.quickStart")}</h3>
      <div class="ws-actions">
        <button type="button" class="btn ws-action-btn" data-go="quiz">${t("workspace.student.startQuiz")}</button>
        <button type="button" class="btn ws-action-btn" data-go="dictionary">${t("workspace.student.lookUp")}</button>
        <button type="button" class="btn ws-action-btn" data-go="wordbook">${t("nav.wordbook")}</button>
        <button type="button" class="btn ws-action-btn" data-go="daily">${t("nav.daily")}</button>
        <button type="button" class="btn ws-action-btn" data-go="chat">${t("nav.chat")}</button>
      </div>
    </div>
    ${assignments.length ? `
    <div class="ws-section">
      <h3>${t("workspace.student.assigned")}</h3>
      <div class="ws-list">${assignments.map((a) => `
        <div class="ws-list-item">
          <strong>${escapeHtml(a.title)}</strong>
          <span class="ws-muted">${escapeHtml(a.teacherName || t("role.teacher"))} · ${formatDate(a.createdAt)}</span>
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
      <h3>${t("workspace.parent.childProgress")}</h3>
      ${child ? `
        <p>${t("workspace.parent.viewing")} <strong>${escapeHtml(child.displayName)}</strong> (@${escapeHtml(child.username)})</p>
        <div class="ws-stat-grid">
          ${statCard("XP", stats.xp || 0)}
          ${statCard(t("stats.checkinStreak"), t("common.days", { count: stats.checkinStreak || 0 }))}
          ${statCard(t("stats.quizzesFinished"), `${stats.quizCount || 0}`)}
          ${statCard(t("nav.wordbook"), t("common.words", { count: stats.wordbookCount || 0 }))}
        </div>` : `<p class="ws-muted">${t("workspace.parent.noStudent")}</p>`}
    </div>
    <div class="ws-section">
      <h3>${t("workspace.parent.settings")}</h3>
      <form id="parentSettingsForm" class="ws-form">
        <label>${t("workspace.parent.linkedStudent")}<input id="parentLinkedStudent" value="${escapeHtml(linked)}" placeholder="demo" /></label>
        <label>${t("workspace.parent.weeklyGoal")}<input id="parentWeeklyGoal" value="${escapeHtml(data.weeklyGoal || "")}" placeholder="${escapeHtml(t("workspace.parent.weeklyGoalPlaceholder"))}" /></label>
        <label>${t("workspace.parent.note")}<textarea id="parentNote" rows="3" placeholder="${escapeHtml(t("workspace.parent.notePlaceholder"))}">${escapeHtml(data.parentNote || "")}</textarea></label>
        <button type="submit" class="btn">${t("settings.save")}</button>
      </form>
    </div>
    <div class="ws-section">
      <h3>${t("workspace.parent.together")}</h3>
      <ul class="ws-tips">${(data.tips || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
    </div>
    <div class="ws-section">
      <h3>${t("workspace.allStudents")}</h3>
      <div class="ws-table-wrap"><table class="ws-table">
        <thead><tr><th>${t("role.student")}</th><th>XP</th><th>${t("workspace.col.quizzes")}</th><th>${t("workspace.col.checkin")}</th></tr></thead>
        <tbody>${(data.students || []).map((s) => `<tr>
          <td>${escapeHtml(s.displayName)}</td>
          <td>${s.stats?.xp || 0}</td>
          <td>${s.stats?.quizCount || 0}</td>
          <td>${t("common.days", { count: s.stats?.checkinStreak || 0 })}</td>
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
      <h3>${t("workspace.teacher.shortcuts")}</h3>
      <div class="ws-actions">
        <button type="button" class="btn ws-action-btn" data-go="quiz">${t("workspace.teacher.quizMaker")}</button>
        <button type="button" class="btn ws-action-btn" data-go="phrases">${t("workspace.teacher.lessonPlans")}</button>
        <button type="button" class="btn ws-action-btn" data-go="dictionary">${t("workspace.teacher.dictPrep")}</button>
        <button type="button" class="btn ws-action-btn" data-go="chat">${t("workspace.teacher.chat")}</button>
      </div>
    </div>
    <div class="ws-section">
      <h3>${t("workspace.teacher.assign")}</h3>
      <form id="teacherAssignmentForm" class="ws-form">
        <label>${t("workspace.teacher.assignTitle")}<input id="assignmentTitle" placeholder="${escapeHtml(t("workspace.teacher.assignTitlePlaceholder"))}" required /></label>
        <label>${t("workspace.teacher.instructions")}<textarea id="assignmentContent" rows="3" placeholder="${escapeHtml(t("workspace.teacher.instructionsPlaceholder"))}"></textarea></label>
        <label>${t("workspace.teacher.assignTo")}
          <select id="assignmentTarget">
            <option value="all">${t("workspace.allStudents")}</option>
            ${students.map((s) => `<option value="${s.id}">${escapeHtml(s.displayName)}</option>`).join("")}
          </select>
        </label>
        <button type="submit" class="btn">${t("workspace.teacher.publish")}</button>
      </form>
    </div>
    ${assignments.length ? `
    <div class="ws-section">
      <h3>${t("workspace.teacher.published")}</h3>
      <div class="ws-list">${assignments.map((a) => `
        <div class="ws-list-item">
          <strong>${escapeHtml(a.title)}</strong>
          <span class="ws-muted">${a.target === "all" ? t("workspace.allStudents") : t("workspace.teacher.selectedStudents")} · ${formatDate(a.createdAt)}</span>
          ${a.content ? `<p>${escapeHtml(a.content)}</p>` : ""}
        </div>`).join("")}</div>
    </div>` : ""}
    <div class="ws-section">
      <h3>${t("workspace.teacher.progress")}</h3>
      <div class="ws-table-wrap"><table class="ws-table">
        <thead><tr><th>${t("role.student")}</th><th>XP</th><th>${t("workspace.col.quizzes")}</th><th>${t("workspace.col.words")}</th><th>${t("workspace.col.audio")}</th></tr></thead>
        <tbody>${students.map((s) => `<tr>
          <td>${escapeHtml(s.displayName)}<br><span class="ws-muted">@${escapeHtml(s.username)}</span></td>
          <td>${s.stats?.xp || 0}</td>
          <td>${s.stats?.quizCount || 0}</td>
          <td>${s.stats?.wordbookCount || 0}</td>
          <td>${s.stats?.audioPlayed || 0}</td>
        </tr>`).join("") || `<tr><td colspan="5">${t("workspace.teacher.noStudents")}</td></tr>`}</tbody>
      </table></div>
    </div>
  `;
}

function renderAdminPanel(data) {
  const { counts, users } = data;
  return `
    <div class="ws-section">
      <h3>${t("workspace.admin.overview")}</h3>
      <div class="ws-stat-grid">
        ${statCard(t("workspace.admin.allUsers"), counts?.total || 0)}
        ${statCard(t("workspace.admin.students"), counts?.byRole?.student || 0)}
        ${statCard(t("workspace.admin.parents"), counts?.byRole?.parent || 0)}
        ${statCard(t("workspace.admin.teachers"), counts?.byRole?.teacher || 0)}
        ${statCard(t("workspace.admin.admins"), counts?.byRole?.admin || 0)}
      </div>
    </div>
    <div class="ws-section">
      <h3>${t("workspace.admin.manageUsers")}</h3>
      <div class="ws-table-wrap"><table class="ws-table">
        <thead><tr><th>${t("workspace.col.user")}</th><th>${t("workspace.col.role")}</th><th>XP</th><th>${t("workspace.col.quizzes")}</th><th>${t("workspace.col.actions")}</th></tr></thead>
        <tbody>${(users || []).map((u) => `<tr>
          <td>${escapeHtml(u.displayName)}<br><span class="ws-muted">@${escapeHtml(u.username)}</span></td>
          <td><span class="nav-role-badge" data-role="${u.role}">${escapeHtml(getRoleLabel(u.role, u.roleLabel))}</span></td>
          <td>${u.stats?.xp || 0}</td>
          <td>${u.stats?.quizCount || 0}</td>
          <td>${u.role === "admin" ? "—" : `
            <select class="ws-role-select" data-user-id="${u.id}">
              <option value="student" ${u.role === "student" ? "selected" : ""}>${t("role.student")}</option>
              <option value="parent" ${u.role === "parent" ? "selected" : ""}>${t("role.parent")}</option>
              <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>${t("role.teacher")}</option>
            </select>`}
          </td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>
    <div class="ws-section">
      <h3>${t("workspace.admin.shortcuts")}</h3>
      <div class="ws-actions">
        <button type="button" class="btn ws-action-btn" data-go="settings">${t("workspace.admin.systemSettings")}</button>
        <button type="button" class="btn secondary ws-action-btn" id="wsRefreshAdmin">${t("workspace.admin.refresh")}</button>
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
  return new Date(ts).toLocaleDateString(I18n.getLocale());
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
      showPixelToast?.(t("workspace.parent.saved"));
      renderRoleWorkspace();
    } else {
      alert(data.error || t("workspace.error.save"));
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
      showPixelToast?.(t("workspace.teacher.publishedToast"));
      renderRoleWorkspace();
    } else {
      alert(data.error || t("workspace.error.publish"));
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
        showPixelToast?.(t("workspace.admin.roleUpdated"));
        renderRoleWorkspace();
      } else {
        alert(data.error || t("workspace.error.update"));
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
    root.innerHTML = `<p class="ws-muted">${t("workspace.loginPrompt", { link: `<a href="#" data-go="auth">${t("workspace.loginLink")}</a>` })}</p>`;
    root.querySelector("[data-go=auth]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("auth");
    });
    return;
  }

  const role = user.role || "student";
  if (titleEl) {
    // Point data-i18n at the role title so a language switch keeps it.
    titleEl.dataset.i18n = WORKSPACE_ROLES.includes(role) ? `workspace.title.${role}` : "workspace.generic";
    titleEl.textContent = workspaceText("title", role);
  }

  root.innerHTML = `<p class="ws-loading">${t("common.loading")}</p>`;
  const data = await fetchDashboard();
  if (!data) {
    root.innerHTML = `<p class="ws-muted">${t("workspace.loadFailed")}</p>`;
    return;
  }

  let html = "";
  if (role === "student") html = renderStudentPanel(data);
  else if (role === "parent") html = renderParentPanel(data);
  else if (role === "teacher") html = renderTeacherPanel(data);
  else if (role === "admin") html = renderAdminPanel(data);
  else html = `<p class="ws-muted">${t("workspace.unknownRole")}</p>`;

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
    btn.dataset.i18n = WORKSPACE_ROLES.includes(user.role) ? `workspace.nav.${user.role}` : "workspace.generic";
    btn.textContent = workspaceText("nav", user.role);
  } else {
    item.hidden = true;
  }
}

const THEME_KEY = "dls-ai-theme";
const THEME_CYCLE = ["auto", "light", "dark"];
const THEME_ICON = { auto: "🌗", light: "☀️", dark: "🌙" };

function getTheme() {
  return THEME_CYCLE.includes(localStorage.getItem(THEME_KEY)) ? localStorage.getItem(THEME_KEY) : "auto";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("navThemeBtn");
  if (btn) {
    btn.textContent = THEME_ICON[theme] || "🌗";
    btn.title = t("theme.buttonTitle", { theme: t(`theme.${THEME_CYCLE.includes(theme) ? theme : "auto"}`) });
  }
}

function cycleTheme() {
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(getTheme()) + 1) % THEME_CYCLE.length];
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  if (typeof showPixelToast === "function") {
    showPixelToast(t("theme.toast", { theme: t(`theme.${next}`) }));
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

  window.addEventListener("localechange", () => {
    applyTheme(getTheme());
    if (document.getElementById("page-workspace")?.classList.contains("active")) {
      renderRoleWorkspace();
    }
  });
}

window.renderRoleWorkspace = renderRoleWorkspace;
document.addEventListener("DOMContentLoaded", initRoleFeatures);
