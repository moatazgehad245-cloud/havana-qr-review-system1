(() => {
  const config = window.HAVANA_CONFIG || {};
  const configured = config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
    config.SUPABASE_URL.startsWith("https://") &&
    !config.SUPABASE_URL.includes("PASTE_YOUR");

  let db = null;
  if (configured && window.supabase) {
    db = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  }

  let rating = 0;
  let choice = "";
  const $ = (id) => document.getElementById(id);
  const ratingLabels = {
    1: "محتاجين نتحسن — شكرًا لصراحتك",
    2: "هنحاول نقدم تجربة أفضل",
    3: "تجربة كويسة",
    4: "تجربة ممتازة",
    5: "تجربة استثنائية! ❤️"
  };

  document.querySelectorAll("[data-rating]").forEach((button) => {
    button.addEventListener("click", () => {
      rating = Number(button.dataset.rating);
      document.querySelectorAll("[data-rating]").forEach((star) => {
        star.classList.toggle("active", Number(star.dataset.rating) <= rating);
      });
      $("ratingCaption").textContent = ratingLabels[rating];
    });
  });

  document.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      choice = button.dataset.choice;
      document.querySelectorAll("[data-choice]").forEach((chip) => {
        chip.classList.toggle("selected", chip === button);
      });
    });
  });

  $("reviewText").addEventListener("input", () => {
    $("charCount").textContent = $("reviewText").value.length;
  });

  $("submitReview").addEventListener("click", async () => {
    const notice = $("notice");
    notice.textContent = "";
    if (!rating) {
      notice.textContent = "من فضلك اختار عدد النجوم الأول.";
      return;
    }
    if (!db) {
      notice.textContent = "الموقع لسه مش متوصل بقاعدة البيانات. راجع إعدادات config.js وملف README.";
      return;
    }

    const button = $("submitReview");
    button.disabled = true;
    button.textContent = "جاري إرسال تقييمك...";
    const payload = {
      rating,
      favorite: choice || null,
      comment: $("reviewText").value.trim() || null,
      visit_type: $("visitType").value
    };

    try {
      const { error } = await db.from("reviews").insert(payload);
      if (error) throw error;
      $("reviewPanel").classList.add("hidden");
      $("successPanel").classList.remove("hidden");
    } catch (error) {
      console.error(error);
      notice.textContent = "حصلت مشكلة أثناء إرسال التقييم. جرّب مرة تانية بعد قليل.";
      button.disabled = false;
      button.innerHTML = 'إرسال التقييم <span>←</span>';
    }
  });
})();