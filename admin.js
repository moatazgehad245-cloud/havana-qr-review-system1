(() => {
  const config = window.HAVANA_CONFIG || {};
  const configured = config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
    config.SUPABASE_URL.startsWith("https://") &&
    !config.SUPABASE_URL.includes("PASTE_YOUR");
  const $ = (id) => document.getElementById(id);
  let db = null;

  function notice(message) { $("loginNotice").textContent = message; }
  function dashNotice(message) { $("dashboardNotice").textContent = message; }

  if (!configured || !window.supabase) {
    notice("لازم تضيف بيانات Supabase في config.js الأول. راجع README.");
    $("loginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      notice("بيانات قاعدة البيانات غير مكتملة.");
    });
    return;
  }

  db = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    notice("جاري التحقق من بيانات الدخول...");
    const { error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });
    if (error) {
      notice("تعذر تسجيل الدخول. راجع البريد وكلمة المرور وصلاحية حساب المدير.");
      return;
    }
    await checkAdmin();
  });

  async function checkAdmin() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
      showLogin();
      return;
    }

    // RLS allows a signed-in user to read only their own admin_users row.
    const { data, error } = await db.from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      await db.auth.signOut();
      showLogin();
      notice("الحساب صحيح لكنه غير معتمد كمدير. أضف حسابه في جدول admin_users عبر SQL.");
      return;
    }

    $("loginPanel").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    await loadReviews();
  }

  function showLogin() {
    $("dashboard").classList.add("hidden");
    $("loginPanel").classList.remove("hidden");
  }

  async function loadReviews() {
    dashNotice("جاري تحميل التقييمات...");
    const { data, error } = await db.from("reviews")
      .select("id,rating,favorite,comment,visit_type,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      dashNotice("تعذر تحميل التقييمات. راجع صلاحيات قاعدة البيانات في schema.sql.");
      return;
    }

    const rows = data || [];
    $("totalCount").textContent = rows.length;
    $("averageRating").textContent = rows.length
      ? (rows.reduce((sum, item) => sum + item.rating, 0) / rows.length).toFixed(1) + " / 5"
      : "—";
    $("positiveCount").textContent = rows.filter((item) => item.rating >= 4).length;

    const body = $("reviewsBody");
    body.replaceChildren();
    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty-cell";
      td.textContent = "لسه مفيش تقييمات.";
      tr.appendChild(td);
      body.appendChild(tr);
    } else {
      rows.forEach((item) => {
        const tr = document.createElement("tr");
        const date = new Date(item.created_at).toLocaleString("ar-EG", {
          dateStyle: "medium", timeStyle: "short"
        });
        const values = [
          date,
          "★".repeat(item.rating) + "☆".repeat(5 - item.rating),
          item.visit_type || "—",
          item.favorite || "—",
          item.comment || "—"
        ];
        values.forEach((value, index) => {
          const td = document.createElement("td");
          td.textContent = value;
          if (index === 1) td.className = "rating-stars";
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    }
    dashNotice(rows.length === 500 ? "يعرض النظام أحدث 500 تقييم." : "");
  }

  $("refreshBtn").addEventListener("click", loadReviews);
  $("logoutBtn").addEventListener("click", async () => {
    await db.auth.signOut();
    showLogin();
  });

  db.auth.getSession().then(({ data }) => {
    if (data.session) checkAdmin();
  });
})();