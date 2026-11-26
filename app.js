(() => {
  "use strict";

  const REPO_OWNER = "NhinQuanhLanCuoi9999";
  const REPO_NAME = "mcsm-vi";
  const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
  const API_RELEASES_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=100`;
  const CACHE_KEY = `mcsm_vi_releases_${REPO_OWNER}_${REPO_NAME}_v3`;
  const CACHE_TTL_MS = 5 * 60 * 1000;

  // Verified fallback snapshot of v1.0.3-a if GitHub API is rate-limited or offline
  const FALLBACK_RELEASES = [
    {
      tag_name: "v1.0.3-a",
      name: "Minecraft: Story Mode - Season 1 VIỆT HÓA v1.0.3",
      draft: false,
      prerelease: false,
      published_at: "2026-11-26T12:25:04Z",
      html_url: `${REPO_URL}/releases/tag/v1.0.3-a`,
      assets: [
        {
          name: "MCSM-Vietnamese-Setup.exe",
          size: 11766272,
          download_count: null,
          browser_download_url: `${REPO_URL}/releases/download/v1.0.3-a/MCSM-Vietnamese-Setup.exe`,
        },
      ],
      body: [
        "# Minecraft: Story Mode — Season One · Việt hóa `v1.0.3` (`v1.0.3-a`)",
        "",
        "Bản cập nhật sửa toàn diện **101 dòng thoại & lựa chọn nhánh** sai xưng hô xuyên suốt Tập 2–8 (trọng tâm Gabriel, Petra, Magnus, Ellegaard, Soren, Ivor, Harper, Hadrian & Mevia), đồng bộ cả hai tuyến Jesse Nữ & Jesse Nam.",
        "",
        "## Tính năng đầy đủ",
        "- **Trọn bộ Tập 1–8:** Hỗ trợ cả Jesse nam & nữ, 7 font pixel tiếng Việt, bảng hiệu 3D và danh đề đầu/cuối tập.",
        "- **Bỏ qua tóm tắt đầu tập (giữ phím `K`):** Huy hiệu đặt ở góc trên-phải, không đè phụ đề phía dưới.",
        "- **Discord Rich Presence:** Hiển thị trạng thái đang chơi Tập 1–8 cùng phần trăm tiến độ theo thời gian thực.",
        "- **Trình cài đặt 1 tệp duy nhất:** Tự hỗ trợ DirectX 9.0c / VC++ runtime, cài đè nâng cấp an toàn, không sửa tệp game gốc và không mất save.",
        "",
        "## Kiểm tra tệp",
        "- **Tệp tải về:** `MCSM-Vietnamese-Setup.exe` (`~11.22` MB)",
        "- **SHA-256:** `cf41fd86b7fb5d66e89d1bf6f2abf110b0aa96d25035f2109123db4a33ce6c51`",
      ].join("\n"),
    },
  ];

  // Cinema Screening Room & Lightbox shots (index 0..5)
  const GALLERY_ITEMS = [
    {
      src: "./assets/new/skip_recap.png",
      tag: "CHỤP THỰC TẾ · RECAP",
      title: "Bỏ qua tóm tắt thực tế trong game",
      desc: "Huy hiệu [K | Giữ để bỏ qua] nằm gọn ở góc trên-phải trong các đoạn recap đầu tập, tách biệt hoàn toàn với vùng phụ đề tiếng Việt phía dưới.",
      showSkipDemo: true,
    },
    {
      src: "./assets/recap-skip-macro.png",
      tag: "RENDER CẬN CẢNH · 8 TRẠNG THÁI",
      title: "Cận cảnh 8 trạng thái nút Skip (giữ phím K)",
      desc: "Viền xanh chạy dọc 4 cạnh quanh ô phím K theo tiến độ giữ phím, lóe sáng “Đang bỏ qua...” khi đủ và tự hạ sáng sau 6 giây chờ.",
      showSkipDemo: true,
    },
    {
      src: "./assets/new/main.png",
      tag: "CHỤP THỰC TẾ · MENU CHÍNH",
      title: "Menu chính trong game",
      desc: "Ảnh chụp thực tế màn hình Menu chính với bộ chữ pixel tiếng Việt đầy đủ dấu, giữ đúng phong cách Minecraft.",
      showSkipDemo: false,
    },
    {
      src: "./assets/new/loichoi.png",
      tag: "CHỤP THỰC TẾ · TIỆN ÍCH",
      title: "Bật / tắt tiện ích trong Cài đặt lối chơi",
      desc: "Bật hoặc tắt nhanh Bỏ qua tóm tắt và Discord Presence ngay trong menu Cài đặt → Lối chơi của game bất kỳ lúc nào.",
      showSkipDemo: false,
    },
    {
      src: "./assets/new/guide.png",
      tag: "CHỤP THỰC TẾ · ĐIỀU KHIỂN",
      title: "Hướng dẫn thao tác phím & chuột trong game",
      desc: "Màn hình điều khiển chi tiết các phím di chuyển, chạy, tương tác và chuột được dịch đầy đủ, rõ ràng.",
      showSkipDemo: false,
    },
    {
      src: "./assets/showcase-installer.png",
      tag: "TRÌNH CÀI ĐẶT · WINDOWS",
      title: "Trình cài đặt MCSM-Vietnamese-Setup.exe",
      desc: "Chọn từng tập muốn cài, hỗ trợ bổ sung DirectX khi cần và gỡ sạch về tiếng Anh gốc chỉ với 1 ô tích.",
      showSkipDemo: false,
    },
  ];

  // Spoiler-free episode showcase metadata for the Telltale 8-episode selector
  const EPISODES = {
    1: {
      num: "TẬP 1 / 8",
      vi: "Hội Đá",
      en: "The Order of the Stone",
      blurb: "Khởi đầu hành trình của Jesse và nhóm bạn tại EnderCon khi một thế lực cổ xưa bất ngờ thức tỉnh.",
      skip: "Mở màn mùa 1 · Không có recap đầu tập",
    },
    2: {
      num: "TẬP 2 / 8",
      vi: "Đến lúc tập hợp",
      en: "Assembly Required",
      blurb: "Chia ngã rẽ đi tìm những huyền thoại còn lại của Hội Đá giữa Redstonia và Boom Town.",
      skip: "Hỗ trợ giữ phím K bỏ qua tóm tắt đầu tập",
    },
    3: {
      num: "TẬP 3 / 8",
      vi: "Nơi chẳng ai ngờ",
      en: "The Last Place You Look",
      blurb: "Cuộc chạy đua xuyên qua The End để tìm kiếm kiến trúc sư Soren cùng bí mật của Hội Đá.",
      skip: "Hỗ trợ giữ phím K bỏ qua tóm tắt đầu tập",
    },
    4: {
      num: "TẬP 4 / 8",
      vi: "Một khối, một thế bí",
      en: "A Block and a Hard Place",
      blurb: "Đoạn kết cao trào của chương Wither Storm khi sự thật về Hội Đá được phơi bày ở Far Lands.",
      skip: "Hỗ trợ giữ phím K bỏ qua tóm tắt đầu tập",
    },
    5: {
      num: "TẬP 5 / 8",
      vi: "Hội Đá ra tay!",
      en: "Order Up!",
      blurb: "Mở ra hành trình mới dẫn tới Thành phố Mây lơ lửng trên bầu trời và cuộc truy tìm Nguồn Vĩnh Hằng.",
      skip: "Mở tuyến phiêu lưu mới · Không có recap đầu tập",
    },
    6: {
      num: "TẬP 6 / 8",
      vi: "Cánh cổng bí ẩn",
      en: "A Portal to Mystery",
      blurb: "Lạc vào tòa dinh thự u ám qua hành lang cổng dịch chuyển, nơi bí ẩn kẻ mang mặt nạ Bí Ngô Trắng chờ lời giải.",
      skip: "Hỗ trợ giữ phím K bỏ qua tóm tắt đầu tập",
    },
    7: {
      num: "TẬP 7 / 8",
      vi: "Truy cập bị từ chối",
      en: "Access Denied",
      blurb: "Bước vào thế giới bị kiểm soát bởi trí tuệ nhân tạo PAMA và giải cứu cư dân bằng công nghệ kính VR của Harper.",
      skip: "Hỗ trợ giữ phím K bỏ qua tóm tắt đầu tập",
    },
    8: {
      num: "TẬP 8 / 8",
      vi: "Hành trình kết thúc?",
      en: "A Journey's End?",
      blurb: "Thử thách sinh tử tại đấu trường của các Old Builders để giành lấy Bản Đồ Thế Giới và tìm đường trở về nhà.",
      skip: "Hỗ trợ giữ phím K bỏ qua tóm tắt đầu tập",
    },
  };

  // Cinema Camera Keyframes per normalized scroll progress [0..1]
  // Gives subtle, physical dolly push-in + gentle pan across bg.png without ever breaking readability
  const CAMERA_SHOTS = [
    { at: 0.0, scale: 1.03, panX: 0, panY: 0, veil: 0.34 },
    { at: 0.22, scale: 1.06, panX: -14, panY: -8, veil: 0.58 },
    { at: 0.48, scale: 1.09, panX: 12, panY: -12, veil: 0.62 },
    { at: 0.72, scale: 1.07, panX: -10, panY: 6, veil: 0.60 },
    { at: 1.0, scale: 1.045, panX: 6, panY: 10, veil: 0.56 },
  ];

  const state = {
    source: "loading",
    releases: { a: null, b: null },
    downloadTotals: {
      all: { total: 0, releaseCount: 0, known: false },
      a: { total: 0, releaseCount: 0, known: false },
      b: { total: 0, releaseCount: 0, known: false },
    },
    activeModalSeason: null,
    lastFocusedEl: null,
    stageIndex: 0,
    lightboxIndex: 0,
    screeningInView: false,
    reducedMotion: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };

  /* --------------------------------------------------------------------------
     Utilities
     -------------------------------------------------------------------------- */

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function formatBytes(bytes) {
    if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDateVi(isoString) {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return d.toISOString().slice(0, 10);
    }
  }

  function formatDateShortVi(isoString) {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    } catch {
      return d.toISOString().slice(0, 10);
    }
  }

  function tagMatchesSeason(tagName, seasonSuffix) {
    if (typeof tagName !== "string") return false;
    return new RegExp(`(?:^|[-_.\\d])${seasonSuffix}$`, "i").test(tagName.trim());
  }

  function pickLatestForSeason(releases, seasonSuffix) {
    const matching = releases.filter(
      (rel) => rel && !rel.draft && tagMatchesSeason(rel.tag_name, seasonSuffix)
    );
    if (!matching.length) return null;
    const stable = matching.filter((rel) => !rel.prerelease);
    const pool = stable.length ? stable : matching;
    pool.sort((x, y) => {
      const tx = Date.parse(x.published_at || x.created_at || 0) || 0;
      const ty = Date.parse(y.published_at || y.created_at || 0) || 0;
      return ty - tx;
    });
    return pool[0];
  }

  function pickPrimaryAsset(release) {
    if (!release || !Array.isArray(release.assets) || !release.assets.length) return null;
    const exe = release.assets.find((a) => /\.exe$/i.test(a.name || ""));
    if (exe) return exe;
    const archive = release.assets.find((a) => /\.(zip|7z|msi)$/i.test(a.name || ""));
    if (archive) return archive;
    return release.assets[0];
  }

  function sumReleaseDownloads(releases, seasonSuffix = null) {
    if (!Array.isArray(releases)) {
      return { total: 0, releaseCount: 0, known: false };
    }
    let total = 0;
    let releaseCount = 0;
    let known = false;

    for (const rel of releases) {
      if (!rel || rel.draft) continue;
      if (seasonSuffix && !tagMatchesSeason(rel.tag_name, seasonSuffix)) continue;
      const assets = Array.isArray(rel.assets) ? rel.assets : [];
      const installers = assets.filter((a) => /\.(exe|zip|7z|msi)$/i.test(a.name || ""));
      const targets = installers.length ? installers : (pickPrimaryAsset(rel) ? [pickPrimaryAsset(rel)] : []);
      if (!targets.length) continue;

      let countedThisRelease = false;
      for (const asset of targets) {
        if (typeof asset.download_count === "number" && Number.isFinite(asset.download_count)) {
          total += asset.download_count;
          known = true;
          countedThisRelease = true;
        }
      }
      if (countedThisRelease) releaseCount += 1;
    }

    return { total, releaseCount, known };
  }

  function extractSha256(bodyText) {
    if (typeof bodyText !== "string") return null;
    const explicit = bodyText.match(/SHA-?256[^\n`]*`([a-f0-9]{64})`/i);
    if (explicit) return explicit[1].toLowerCase();
    const plain = bodyText.match(/\b([a-f0-9]{64})\b/i);
    return plain ? plain[1].toLowerCase() : null;
  }

  function isSafeHttpUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* --------------------------------------------------------------------------
     Living Cinema Camera Rig (Scroll Dolly + Smooth Steadicam Pointer Inertia)
     -------------------------------------------------------------------------- */

  function sampleCameraShot(progress) {
    const p = clamp(progress, 0, 1);
    for (let i = 0; i < CAMERA_SHOTS.length - 1; i += 1) {
      const a = CAMERA_SHOTS[i];
      const b = CAMERA_SHOTS[i + 1];
      if (p >= a.at && p <= b.at) {
        const span = Math.max(0.0001, b.at - a.at);
        const t = (p - a.at) / span;
        return {
          scale: lerp(a.scale, b.scale, t),
          panX: lerp(a.panX, b.panX, t),
          panY: lerp(a.panY, b.panY, t),
          veil: lerp(a.veil, b.veil, t),
        };
      }
    }
    return CAMERA_SHOTS[CAMERA_SHOTS.length - 1];
  }

  function initCinemaCamera() {
    const rootStyle = document.documentElement.style;
    const isFinePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

    let targetScroll = 0;
    let smoothScroll = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;
    // Opening cinema pull-back settle (starts gently closer, settles to establishing shot)
    let introScaleBoost = state.reducedMotion ? 0 : 0.055;
    let rafId = null;

    function readScrollProgress() {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      return clamp(window.scrollY / maxScroll, 0, 1);
    }

    function tick() {
      smoothScroll = lerp(smoothScroll, targetScroll, 0.085);
      smoothMouseX = lerp(smoothMouseX, targetMouseX, 0.065);
      smoothMouseY = lerp(smoothMouseY, targetMouseY, 0.065);
      introScaleBoost = lerp(introScaleBoost, 0, 0.05);

      const shot = sampleCameraShot(smoothScroll);
      const finalX = shot.panX + smoothMouseX;
      const finalY = shot.panY + smoothMouseY;
      const finalScale = shot.scale + introScaleBoost;

      rootStyle.setProperty("--cam-x", `${finalX.toFixed(2)}px`);
      rootStyle.setProperty("--cam-y", `${finalY.toFixed(2)}px`);
      rootStyle.setProperty("--cam-scale", finalScale.toFixed(4));
      rootStyle.setProperty("--veil-alpha", shot.veil.toFixed(3));
      rootStyle.setProperty("--scroll-progress", smoothScroll.toFixed(4));

      const stillMoving =
        Math.abs(targetScroll - smoothScroll) > 0.0004 ||
        Math.abs(targetMouseX - smoothMouseX) > 0.06 ||
        Math.abs(targetMouseY - smoothMouseY) > 0.06 ||
        introScaleBoost > 0.0005;

      if (stillMoving) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function scheduleTick() {
      if (state.reducedMotion) {
        const p = readScrollProgress();
        const shot = sampleCameraShot(p);
        rootStyle.setProperty("--veil-alpha", shot.veil.toFixed(3));
        rootStyle.setProperty("--scroll-progress", p.toFixed(4));
        return;
      }
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    }

    window.addEventListener(
      "scroll",
      () => {
        targetScroll = readScrollProgress();
        scheduleTick();
      },
      { passive: true }
    );

    if (isFinePointer && !state.reducedMotion) {
      window.addEventListener(
        "pointermove",
        (ev) => {
          const nx = ev.clientX / Math.max(1, window.innerWidth) - 0.5;
          const ny = ev.clientY / Math.max(1, window.innerHeight) - 0.5;
          // Restrained physical steadicam sway (±12px horizontal, ±8px vertical)
          targetMouseX = -nx * 24;
          targetMouseY = -ny * 16;
          scheduleTick();
        },
        { passive: true }
      );
    }

    targetScroll = readScrollProgress();
    scheduleTick();
  }

  /* --------------------------------------------------------------------------
     Scroll Scene Tracker + Shutter Reveal Observer
     -------------------------------------------------------------------------- */

  function initObservers() {
    const revealEls = document.querySelectorAll("[data-reveal]");
    if (state.reducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-revealed"));
    } else {
      const revealObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              revealObs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -36px 0px" }
      );
      revealEls.forEach((el) => revealObs.observe(el));
    }

    // Track active scene for bottom cinema HUD & top nav highlight
    const scenes = Array.from(document.querySelectorAll("[data-scene]"));
    const hudLabel = document.getElementById("hud-scene-label");
    const hudDots = Array.from(document.querySelectorAll("[data-hud-scene]"));
    const navLinks = Array.from(document.querySelectorAll("[data-nav-scene]"));

    function setActiveScene(sceneId, labelText) {
      if (hudLabel && labelText) hudLabel.textContent = labelText;
      hudDots.forEach((dot) => {
        dot.classList.toggle("is-active", dot.getAttribute("data-hud-scene") === sceneId);
      });
      navLinks.forEach((link) => {
        link.classList.toggle("is-current", link.getAttribute("data-nav-scene") === sceneId);
      });
    }

    if ("IntersectionObserver" in window && scenes.length) {
      const sceneObs = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible.length) {
            const target = visible[0].target;
            setActiveScene(
              target.getAttribute("data-scene"),
              target.getAttribute("data-scene-label")
            );
          }
        },
        { threshold: [0.22, 0.45, 0.65], rootMargin: "-15% 0px -30% 0px" }
      );
      scenes.forEach((sec) => sceneObs.observe(sec));

      // Also track when the Screening Room is in view so holding keyboard K works naturally
      const screeningEl = document.getElementById("anh-game");
      if (screeningEl) {
        const srObs = new IntersectionObserver(
          (entries) => {
            state.screeningInView = Boolean(entries[0] && entries[0].isIntersecting);
          },
          { threshold: 0.18 }
        );
        srObs.observe(screeningEl);
      }
    }
  }

  /* --------------------------------------------------------------------------
     Cinema Screening Room + Playable [K | Giữ để bỏ qua] Interactive Engine
     -------------------------------------------------------------------------- */

  let shutterTimer = null;

  function selectStageShot(index, { withShutter = true } = {}) {
    const total = GALLERY_ITEMS.length;
    const safeIdx = ((index % total) + total) % total;
    state.stageIndex = safeIdx;
    const item = GALLERY_ITEMS[safeIdx];

    const viewport = document.getElementById("screening-viewport");
    const shutter = document.getElementById("stage-shutter");
    const imgEl = document.getElementById("stage-img");
    const skipDock = document.getElementById("skip-demo-dock");

    function applySwap() {
      if (imgEl) {
        imgEl.src = item.src;
        imgEl.alt = item.title;
      }
      setText("stage-counter", `CẢNH 0${safeIdx + 1} / 0${total}`);
      setText("stage-tag", item.tag);
      setText("stage-title", item.title);
      setText("stage-desc", item.desc);

      if (skipDock) {
        skipDock.hidden = !item.showSkipDemo;
      }

      document.querySelectorAll("[data-stage-index]").forEach((btn) => {
        const idx = Number.parseInt(btn.getAttribute("data-stage-index") || "0", 10);
        const active = idx === safeIdx;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });
    }

    if (!withShutter || state.reducedMotion || !shutter || !viewport) {
      applySwap();
      return;
    }

    window.clearTimeout(shutterTimer);
    viewport.classList.add("is-cutting");
    shutter.classList.remove("is-wiping");
    void shutter.offsetWidth; // trigger crisp cinema wipe
    shutter.classList.add("is-wiping");

    shutterTimer = window.setTimeout(() => {
      applySwap();
      viewport.classList.remove("is-cutting");
    }, 150);
  }

  function initHoldKDemo() {
    const hud = document.getElementById("skip-demo-hud");
    const edgeTop = document.getElementById("skip-edge-top");
    const edgeRight = document.getElementById("skip-edge-right");
    const edgeBottom = document.getElementById("skip-edge-bottom");
    const edgeLeft = document.getElementById("skip-edge-left");
    const label = document.getElementById("skip-demo-text");
    if (!hud || !edgeTop || !edgeRight || !edgeBottom || !edgeLeft || !label) return;

    const HOLD_DURATION_MS = 950;
    const DRAIN_RATE = 2.6;

    let holdingPointer = false;
    let holdingKey = false;
    let progress = 0;
    let completed = false;
    let lastTs = 0;
    let rafId = null;

    function paintProgress(p) {
      const top = clamp(p / 0.25, 0, 1);
      const right = clamp((p - 0.25) / 0.25, 0, 1);
      const bottom = clamp((p - 0.5) / 0.25, 0, 1);
      const left = clamp((p - 0.75) / 0.25, 0, 1);

      edgeTop.style.transform = `scaleX(${top.toFixed(4)})`;
      edgeRight.style.transform = `scaleY(${right.toFixed(4)})`;
      edgeBottom.style.transform = `scaleX(${bottom.toFixed(4)})`;
      edgeLeft.style.transform = `scaleY(${left.toFixed(4)})`;
    }

    function step(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(64, ts - lastTs);
      lastTs = ts;

      const isHolding = holdingPointer || holdingKey;
      hud.classList.toggle("is-holding", isHolding && !completed);

      if (!completed) {
        if (isHolding) {
          progress = clamp(progress + dt / HOLD_DURATION_MS, 0, 1);
          if (progress >= 1) {
            completed = true;
            paintProgress(1);
            hud.classList.remove("is-holding");
            hud.classList.add("is-complete");
            label.textContent = "Đang bỏ qua...";

            // Diamond Flash -> Cinema shutter cut straight to Main Menu (shot index 2)!
            window.setTimeout(() => {
              selectStageShot(2, { withShutter: true });
              window.setTimeout(() => {
                completed = false;
                progress = 0;
                paintProgress(0);
                hud.classList.remove("is-complete");
                label.textContent = "Thử giữ để bỏ qua";
              }, 260);
            }, 380);
            rafId = null;
            return;
          }
        } else {
          progress = clamp(progress - (dt / HOLD_DURATION_MS) * DRAIN_RATE, 0, 1);
        }
        paintProgress(progress);
      }

      if (isHolding || progress > 0) {
        rafId = requestAnimationFrame(step);
      } else {
        lastTs = 0;
        rafId = null;
      }
    }

    function ensureRunning() {
      if (!rafId) {
        lastTs = 0;
        rafId = requestAnimationFrame(step);
      }
    }

    // Pointer hold directly on the HUD button
    hud.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      if (completed) return;
      holdingPointer = true;
      if (hud.setPointerCapture) {
        try {
          hud.setPointerCapture(ev.pointerId);
        } catch {
          // Ignore if unsupported
        }
      }
      ensureRunning();
    });

    const releasePointer = () => {
      holdingPointer = false;
      ensureRunning();
    };
    hud.addEventListener("pointerup", releasePointer);
    hud.addEventListener("pointercancel", releasePointer);
    hud.addEventListener("lostpointercapture", releasePointer);

    function isScreeningVisibleNow() {
      const screeningEl = document.getElementById("anh-game");
      if (!screeningEl) return false;
      const rect = screeningEl.getBoundingClientRect();
      return rect.bottom > 80 && rect.top < window.innerHeight - 60;
    }

    // Keyboard K hold when the Screening Room is on screen & showing Recap shot
    document.addEventListener("keydown", (ev) => {
      if (ev.repeat) return;
      if (ev.key !== "k" && ev.key !== "K") return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (isAnyOverlayOpen()) return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!isScreeningVisibleNow()) return;
      if (!GALLERY_ITEMS[state.stageIndex] || !GALLERY_ITEMS[state.stageIndex].showSkipDemo) return;
      holdingKey = true;
      ensureRunning();
    });

    document.addEventListener("keyup", (ev) => {
      if (ev.key === "k" || ev.key === "K") {
        holdingKey = false;
        ensureRunning();
      }
    });

    window.addEventListener("blur", () => {
      holdingKey = false;
      holdingPointer = false;
      ensureRunning();
    });
  }

  /* --------------------------------------------------------------------------
     Interactive Telltale 8-Episode Board
     -------------------------------------------------------------------------- */

  function selectEpisode(epNumber) {
    const ep = EPISODES[epNumber];
    if (!ep) return;
    setText("ep-spot-num", ep.num);
    setText("ep-spot-title", ep.vi);
    setText("ep-spot-en", ep.en);
    setText("ep-spot-blurb", ep.blurb);
    setText("ep-spot-skip", ep.skip);

    document.querySelectorAll("#episode-grid .episode-tile").forEach((tile) => {
      const active = Number(tile.getAttribute("data-ep")) === epNumber;
      tile.classList.toggle("is-selected", active);
      const btn = tile.querySelector("button");
      if (btn) btn.setAttribute("aria-pressed", String(active));
    });
  }

  /* --------------------------------------------------------------------------
     Safe DOM-only Markdown Renderer (zero raw HTML injection)
     -------------------------------------------------------------------------- */

  function appendInlineMarkdown(parent, text) {
    const tokenRe = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = tokenRe.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const token = match[0];

      if (token.startsWith("[")) {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch && isSafeHttpUrl(linkMatch[2])) {
          const a = document.createElement("a");
          a.href = linkMatch[2];
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = linkMatch[1];
          parent.appendChild(a);
        } else {
          parent.appendChild(document.createTextNode(token));
        }
      } else if (token.startsWith("`")) {
        const code = document.createElement("code");
        code.textContent = token.slice(1, -1);
        parent.appendChild(code);
      } else if (token.startsWith("**")) {
        const strong = document.createElement("strong");
        appendInlineMarkdown(strong, token.slice(2, -2));
        parent.appendChild(strong);
      } else if (token.startsWith("*")) {
        const em = document.createElement("em");
        em.textContent = token.slice(1, -1);
        parent.appendChild(em);
      }

      lastIndex = tokenRe.lastIndex;
    }

    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function parseTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function renderMarkdownSafe(container, rawText) {
    container.textContent = "";
    const text = (rawText || "").replace(/\r\n/g, "\n").trim();
    if (!text) {
      const p = document.createElement("p");
      p.textContent = "Bản phát hành này chưa có ghi chú chi tiết trên GitHub.";
      container.appendChild(p);
      return;
    }

    const lines = text.split("\n");
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i += 1;
        continue;
      }

      if (/^([-*_]){3,}$/.test(trimmed)) {
        container.appendChild(document.createElement("hr"));
        i += 1;
        continue;
      }

      if (trimmed.startsWith("```")) {
        const codeLines = [];
        i += 1;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i += 1;
        }
        i += 1;
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = codeLines.join("\n");
        pre.appendChild(code);
        container.appendChild(pre);
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const h = document.createElement(`h${headingMatch[1].length}`);
        appendInlineMarkdown(h, headingMatch[2]);
        container.appendChild(h);
        i += 1;
        continue;
      }

      if (
        trimmed.startsWith("|") &&
        i + 1 < lines.length &&
        /^\|?[\s:-]+\|[\s|:-]+$/.test(lines[i + 1].trim())
      ) {
        const wrap = document.createElement("div");
        wrap.className = "md-table-wrap";
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        parseTableRow(trimmed).forEach((cellText) => {
          const th = document.createElement("th");
          appendInlineMarkdown(th, cellText);
          headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        i += 2;
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          const tr = document.createElement("tr");
          parseTableRow(lines[i]).forEach((cellText) => {
            const td = document.createElement("td");
            appendInlineMarkdown(td, cellText);
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
          i += 1;
        }
        table.appendChild(tbody);
        wrap.appendChild(table);
        container.appendChild(wrap);
        continue;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        const ul = document.createElement("ul");
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          const li = document.createElement("li");
          if (/^\s{2,}[-*]\s+/.test(lines[i])) {
            li.className = "md-sub-item";
          }
          appendInlineMarkdown(li, lines[i].replace(/^\s*[-*]\s+/, ""));
          ul.appendChild(li);
          i += 1;
        }
        container.appendChild(ul);
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const ol = document.createElement("ol");
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          const li = document.createElement("li");
          appendInlineMarkdown(li, lines[i].replace(/^\s*\d+\.\s+/, ""));
          ol.appendChild(li);
          i += 1;
        }
        container.appendChild(ol);
        continue;
      }

      const paraLines = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,3})\s+/.test(lines[i].trim()) &&
        !/^([-*_]){3,}$/.test(lines[i].trim()) &&
        !lines[i].trim().startsWith("```") &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !lines[i].trim().startsWith("|")
      ) {
        paraLines.push(lines[i].trim());
        i += 1;
      }
      const p = document.createElement("p");
      appendInlineMarkdown(p, paraLines.join(" "));
      container.appendChild(p);
    }
  }

  /* --------------------------------------------------------------------------
     GitHub Releases Sync + Caching + Fallback
     -------------------------------------------------------------------------- */

  function readCachedReleases() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.data)) return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeCachedReleases(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      // Ignore private-mode restrictions
    }
  }

  async function fetchReleases({ forceRefresh = false } = {}) {
    const syncEl = document.getElementById("github-sync-status");

    if (!forceRefresh) {
      const cached = readCachedReleases();
      if (cached) {
        applyReleaseList(cached.data, "cache");
        return;
      }
    }

    if (syncEl) syncEl.textContent = "Đang kiểm tra bản mới nhất từ GitHub...";

    try {
      const response = await fetch(API_RELEASES_URL, {
        headers: { Accept: "application/vnd.github+json" },
        cache: forceRefresh ? "no-store" : "default",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Dữ liệu không hợp lệ");
      writeCachedReleases(data);
      applyReleaseList(data, "live");
    } catch (err) {
      applyReleaseList(FALLBACK_RELEASES, "fallback", err && err.message ? err.message : "");
    }
  }

  function applyReleaseList(list, source, errorReason = "") {
    state.source = source;
    state.releases.a = pickLatestForSeason(list, "a");
    state.releases.b = pickLatestForSeason(list, "b");
    state.downloadTotals.all = sumReleaseDownloads(list, null);
    state.downloadTotals.a = sumReleaseDownloads(list, "a");
    state.downloadTotals.b = sumReleaseDownloads(list, "b");

    updateSeasonUi();

    const headerDlEl = document.getElementById("header-downloads");
    const headerDlCountEl = document.getElementById("header-downloads-count");
    if (headerDlEl && headerDlCountEl) {
      const stats = state.downloadTotals.all;
      if (source === "loading") {
        headerDlCountEl.textContent = "...";
      } else if (stats.known) {
        headerDlCountEl.textContent = stats.total.toLocaleString("vi-VN");
        headerDlEl.title = `Tổng ${stats.total.toLocaleString("vi-VN")} lượt tải bộ cài trên ${stats.releaseCount} phiên bản phát hành`;
      } else {
        headerDlCountEl.textContent = "—";
        headerDlEl.title = "Chưa lấy được tổng lượt tải từ GitHub";
      }
    }

    const syncEl = document.getElementById("github-sync-status");
    if (syncEl) {
      if (source === "loading") {
        syncEl.textContent = "Đang đồng bộ từ GitHub...";
      } else if (source === "live" || source === "cache") {
        syncEl.textContent = "Đã đồng bộ trực tiếp từ GitHub Releases.";
      } else {
        const suffix = errorReason ? ` (${errorReason})` : "";
        syncEl.textContent = `Tạm dùng bản lưu dự phòng v1.0.3-a${suffix}.`;
      }
    }

    if (state.activeModalSeason) {
      renderReleaseModal(state.activeModalSeason);
    }
  }

  function updateSeasonUi() {
    const relA = state.releases.a;
    if (relA) {
      const assetA = pickPrimaryAsset(relA);
      const sizeStr = assetA ? formatBytes(assetA.size) : "Xem trên GitHub";
      const dateShort = formatDateShortVi(relA.published_at);

      setText("hero-sync-chip", `SEASON 1 · ${relA.tag_name}`);
      setText("hero-ss1-tag", relA.tag_name);
      setText("hero-ss1-meta", `${sizeStr} · ${dateShort}`);
      setText("hero-btn-tag", relA.tag_name);

      setText("card-a-title", relA.name || "Season One — Việt hóa");
      setText("card-a-tag", relA.tag_name);
      setText("card-a-date", formatDateVi(relA.published_at));
      setText("card-a-asset", assetA ? `${assetA.name} (${sizeStr})` : "Xem trên GitHub");

      const badgeTextA = relA.prerelease ? "THỬ NGHIỆM" : "ĐÃ RA MẮT";
      const badgeA = document.getElementById("card-a-badge");
      if (badgeA) {
        badgeA.textContent = badgeTextA;
        badgeA.className = "status-badge is-live pixel";
      }
      const heroBadgeA = document.getElementById("hero-ss1-badge");
      if (heroBadgeA) {
        heroBadgeA.textContent = badgeTextA;
        heroBadgeA.className = "status-badge is-live pixel";
      }
      const ghA = document.getElementById("card-a-gh");
      if (ghA && isSafeHttpUrl(relA.html_url)) {
        ghA.href = relA.html_url;
      }
    }

    const relB = state.releases.b;
    const cardB = document.getElementById("card-season-b");
    const btnB = document.getElementById("card-b-btn");
    const badgeB = document.getElementById("card-b-badge");
    const heroBadgeB = document.getElementById("hero-ss2-badge");
    const ghB = document.getElementById("card-b-gh");

    if (relB) {
      const assetB = pickPrimaryAsset(relB);
      const sizeStr = assetB ? formatBytes(assetB.size) : "Xem trên GitHub";
      const dateShort = formatDateShortVi(relB.published_at);

      if (cardB) {
        cardB.classList.remove("is-upcoming");
        cardB.classList.add("is-active-s2");
      }
      const badgeTextB = relB.prerelease ? "THỬ NGHIỆM" : "ĐÃ RA MẮT";
      if (badgeB) {
        badgeB.textContent = badgeTextB;
        badgeB.className = "status-badge is-live-s2 pixel";
      }
      if (heroBadgeB) {
        heroBadgeB.textContent = badgeTextB;
        heroBadgeB.className = "status-badge is-live-s2 pixel";
      }

      setText("hero-ss2-tag", relB.tag_name);
      setText("hero-ss2-meta", `${sizeStr} · ${dateShort}`);
      setText("card-b-title", relB.name || "Season Two — Việt hóa");
      setText(
        "card-b-summary",
        "Bản Việt hóa Season Two đã ra mắt trên GitHub! Nhấn nút bên dưới để xem thông tin phiên bản và tải xuống."
      );
      setText("card-b-tag", relB.tag_name);
      setText("card-b-date", formatDateVi(relB.published_at));
      setText("card-b-asset", assetB ? `${assetB.name} (${sizeStr})` : "Xem trên GitHub");

      if (btnB) {
        btnB.disabled = false;
        btnB.className = "btn btn-primary pixel";
        btnB.textContent = `Xem chi tiết & Tải về (${relB.tag_name})`;
      }
      if (ghB && isSafeHttpUrl(relB.html_url)) {
        ghB.href = relB.html_url;
        ghB.textContent = "GitHub →";
      }
    } else {
      if (cardB) {
        cardB.classList.add("is-upcoming");
        cardB.classList.remove("is-active-s2");
      }
      if (badgeB) {
        badgeB.textContent = "SẮP RA MẮT";
        badgeB.className = "status-badge is-soon pixel";
      }
      if (heroBadgeB) {
        heroBadgeB.textContent = "SẮP RA MẮT";
        heroBadgeB.className = "status-badge is-soon pixel";
      }
      setText("hero-ss2-tag", "Chưa phát hành");
      setText("hero-ss2-meta", "Cập nhật sau SS1");
      setText("card-b-tag", "Chưa phát hành");
      setText("card-b-date", "Sẽ cập nhật sau Season 1");
      setText("card-b-asset", "Đang chờ bản phát hành đuôi -b");
      if (btnB) {
        btnB.disabled = true;
        btnB.className = "btn btn-disabled pixel";
        btnB.textContent = "Season 2 sắp ra mắt";
      }
      if (ghB) {
        ghB.href = `${REPO_URL}/releases`;
        ghB.textContent = "Theo dõi →";
      }
    }
  }

  /* --------------------------------------------------------------------------
     Release Modal & Lightbox
     -------------------------------------------------------------------------- */

  const releaseModal = document.getElementById("release-modal");
  const releaseDialog = releaseModal ? releaseModal.querySelector(".modal-dialog") : null;
  const lightbox = document.getElementById("lightbox");
  const lightboxDialog = lightbox ? lightbox.querySelector(".lightbox-dialog") : null;
  const lightboxImg = document.getElementById("lightbox-img");

  function isAnyOverlayOpen() {
    return (
      (releaseModal && !releaseModal.hidden) ||
      (lightbox && !lightbox.hidden)
    );
  }

  function openReleaseModal(seasonSuffix, triggerEl) {
    const rel = state.releases[seasonSuffix];
    if (!rel || !releaseModal) return;

    state.activeModalSeason = seasonSuffix;
    state.lastFocusedEl = triggerEl || document.activeElement;
    renderReleaseModal(seasonSuffix);

    releaseModal.hidden = false;
    releaseModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    if (releaseDialog) releaseDialog.focus();
  }

  function closeReleaseModal() {
    if (!releaseModal || releaseModal.hidden) return;
    releaseModal.hidden = true;
    releaseModal.setAttribute("aria-hidden", "true");
    state.activeModalSeason = null;
    document.body.classList.remove("is-locked");
    if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === "function") {
      state.lastFocusedEl.focus();
    }
  }

  function renderReleaseModal(seasonSuffix) {
    const rel = state.releases[seasonSuffix];
    if (!rel) return;

    const primaryAsset = pickPrimaryAsset(rel);
    const sha256 = extractSha256(rel.body);

    setText("modal-tag", rel.tag_name);
    setText("modal-title", rel.name || `Bản phát hành ${rel.tag_name}`);

    const sourcePill = document.getElementById("modal-source");
    if (sourcePill) {
      if (state.source === "loading") {
        sourcePill.textContent = "Đang đồng bộ GitHub...";
        sourcePill.className = "modal-source-pill pixel";
      } else if (state.source === "live" || state.source === "cache") {
        sourcePill.textContent = "Đồng bộ trực tiếp từ GitHub";
        sourcePill.className = "modal-source-pill pixel";
      } else {
        sourcePill.textContent = "Bản lưu dự phòng";
        sourcePill.className = "modal-source-pill is-fallback pixel";
      }
    }

    setText("meta-tag", `${rel.tag_name} (${seasonSuffix === "a" ? "Season 1" : "Season 2"})`);
    setText("meta-date", formatDateVi(rel.published_at));
    setText("meta-asset", primaryAsset ? primaryAsset.name : "Xem trên GitHub");

    if (primaryAsset) {
      const sizeStr = formatBytes(primaryAsset.size);
      const seasonStats = state.downloadTotals[seasonSuffix];
      let dlCount = "";
      if (typeof primaryAsset.download_count === "number") {
        dlCount = ` · ${primaryAsset.download_count.toLocaleString("vi-VN")} lượt bản này`;
        if (seasonStats && seasonStats.known && seasonStats.releaseCount > 1) {
          dlCount += ` (${seasonStats.total.toLocaleString("vi-VN")} tổng)`;
        }
      }
      setText("meta-size-dl", `${sizeStr}${dlCount}`);
    } else {
      setText("meta-size-dl", "—");
    }

    const shaBox = document.getElementById("modal-sha-box");
    const shaVal = document.getElementById("modal-sha-value");
    if (shaBox && shaVal) {
      if (sha256) {
        shaVal.textContent = sha256;
        shaBox.hidden = false;
      } else {
        shaBox.hidden = true;
      }
    }

    const notesEl = document.getElementById("modal-notes");
    if (notesEl) renderMarkdownSafe(notesEl, rel.body);

    const extraWrap = document.getElementById("modal-extra-assets");
    const extraList = document.getElementById("modal-asset-list");
    if (extraWrap && extraList) {
      extraList.textContent = "";
      if (Array.isArray(rel.assets) && rel.assets.length > 1) {
        rel.assets.forEach((asset) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.textContent = asset.name;
          a.className = "pixel";
          if (isSafeHttpUrl(asset.browser_download_url)) {
            a.href = asset.browser_download_url;
            a.rel = "noopener noreferrer";
          }
          const meta = document.createElement("span");
          meta.textContent = formatBytes(asset.size);
          li.appendChild(a);
          li.appendChild(meta);
          extraList.appendChild(li);
        });
        extraWrap.hidden = false;
      } else {
        extraWrap.hidden = true;
      }
    }

    const ghLink = document.getElementById("modal-github-link");
    if (ghLink) {
      ghLink.href = isSafeHttpUrl(rel.html_url) ? rel.html_url : `${REPO_URL}/releases`;
    }

    const dlLink = document.getElementById("modal-download-link");
    if (dlLink) {
      if (primaryAsset && isSafeHttpUrl(primaryAsset.browser_download_url)) {
        dlLink.href = primaryAsset.browser_download_url;
        dlLink.textContent = `Tải ${primaryAsset.name} (${formatBytes(primaryAsset.size)})`;
      } else {
        dlLink.href = isSafeHttpUrl(rel.html_url) ? rel.html_url : `${REPO_URL}/releases`;
        dlLink.textContent = "Mở trang tải trên GitHub →";
      }
    }
  }

  function openLightbox(index, triggerEl) {
    if (!lightbox || !GALLERY_ITEMS.length) return;
    state.lastFocusedEl = triggerEl || document.activeElement;
    showLightboxItem(index);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    if (lightboxDialog) lightboxDialog.focus();
  }

  function showLightboxItem(index) {
    const total = GALLERY_ITEMS.length;
    const safeIdx = ((index % total) + total) % total;
    state.lightboxIndex = safeIdx;
    const item = GALLERY_ITEMS[safeIdx];

    if (lightboxImg) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.title;
    }
    setText("lightbox-counter", `${safeIdx + 1} / ${total}`);
    setText("lightbox-title", item.title);
    setText("lightbox-desc", item.desc);
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === "function") {
      state.lastFocusedEl.focus();
    }
  }

  /* --------------------------------------------------------------------------
     Clipboard
     -------------------------------------------------------------------------- */

  async function copyFromElement(button, targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const text = (el.textContent || "").trim();
    if (!text) return;

    const originalLabel = button.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    button.textContent = "Đã chép";
    button.classList.add("is-copied");
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove("is-copied");
    }, 1800);
  }

  /* --------------------------------------------------------------------------
     Event Wiring
     -------------------------------------------------------------------------- */

  function bindEvents() {
    // Mobile nav toggle
    const navToggle = document.getElementById("nav-toggle");
    const siteNav = document.getElementById("site-nav");
    if (navToggle && siteNav) {
      navToggle.addEventListener("click", () => {
        const isOpen = siteNav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
      });
      siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          siteNav.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Release modal triggers
    document.querySelectorAll("[data-open-release]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const season = btn.getAttribute("data-open-release");
        if (season) openReleaseModal(season, btn);
      });
    });

    const modalCloseBtn = document.getElementById("modal-close");
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeReleaseModal);
    if (releaseModal) {
      releaseModal.addEventListener("click", (ev) => {
        if (ev.target === releaseModal) closeReleaseModal();
      });
    }

    const refreshBtn = document.getElementById("refresh-releases-btn");
    if (refreshBtn) refreshBtn.addEventListener("click", () => fetchReleases({ forceRefresh: true }));
    const modalRefreshBtn = document.getElementById("modal-refresh-btn");
    if (modalRefreshBtn) modalRefreshBtn.addEventListener("click", () => fetchReleases({ forceRefresh: true }));

    // Screening Room controls
    document.querySelectorAll("[data-stage-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number.parseInt(btn.getAttribute("data-stage-index") || "0", 10);
        if (!Number.isNaN(idx) && idx !== state.stageIndex) {
          selectStageShot(idx, { withShutter: true });
        }
      });
    });

    const stagePrev = document.getElementById("stage-prev");
    const stageNext = document.getElementById("stage-next");
    const stageZoom = document.getElementById("stage-zoom");
    const stageImgBtn = document.getElementById("stage-img-btn");
    if (stagePrev) stagePrev.addEventListener("click", () => selectStageShot(state.stageIndex - 1));
    if (stageNext) stageNext.addEventListener("click", () => selectStageShot(state.stageIndex + 1));
    if (stageZoom) stageZoom.addEventListener("click", () => openLightbox(state.stageIndex, stageZoom));
    if (stageImgBtn) stageImgBtn.addEventListener("click", () => openLightbox(state.stageIndex, stageImgBtn));

    // Hero direct lightbox trigger
    document.querySelectorAll("[data-lightbox-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number.parseInt(btn.getAttribute("data-lightbox-index") || "0", 10);
        openLightbox(Number.isNaN(idx) ? 0 : idx, btn);
      });
    });

    // Lightbox controls
    const lbPrev = document.getElementById("lightbox-prev");
    const lbNext = document.getElementById("lightbox-next");
    const lbClose = document.getElementById("lightbox-close");
    if (lbPrev) lbPrev.addEventListener("click", () => showLightboxItem(state.lightboxIndex - 1));
    if (lbNext) lbNext.addEventListener("click", () => showLightboxItem(state.lightboxIndex + 1));
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lightbox) {
      lightbox.addEventListener("click", (ev) => {
        if (ev.target === lightbox) closeLightbox();
      });
    }

    // Telltale 8-Episode selector
    document.querySelectorAll("#episode-grid .episode-tile").forEach((tile) => {
      const epNum = Number.parseInt(tile.getAttribute("data-ep") || "1", 10);
      const btn = tile.querySelector("button");
      if (!btn) return;
      btn.addEventListener("click", () => selectEpisode(epNum));
    });

    // Clipboard copy
    document.querySelectorAll("[data-copy-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-copy-target");
        if (targetId) copyFromElement(btn, targetId);
      });
    });

    // Global keyboard controls (Escape, Arrows for Lightbox & Screening Room)
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (lightbox && !lightbox.hidden) closeLightbox();
        else if (releaseModal && !releaseModal.hidden) closeReleaseModal();
        return;
      }

      if (lightbox && !lightbox.hidden) {
        if (ev.key === "ArrowLeft") showLightboxItem(state.lightboxIndex - 1);
        else if (ev.key === "ArrowRight") showLightboxItem(state.lightboxIndex + 1);
        return;
      }

      if (!isAnyOverlayOpen() && state.screeningInView) {
        const tag = (document.activeElement && document.activeElement.tagName) || "";
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          if (ev.key === "ArrowLeft") selectStageShot(state.stageIndex - 1);
          else if (ev.key === "ArrowRight") selectStageShot(state.stageIndex + 1);
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyReleaseList(FALLBACK_RELEASES, "loading");
    selectStageShot(0, { withShutter: false });
    selectEpisode(1);
    bindEvents();
    initCinemaCamera();
    initObservers();
    initHoldKDemo();
    fetchReleases({ forceRefresh: false });
  });
})();
