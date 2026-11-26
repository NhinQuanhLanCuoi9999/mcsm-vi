(() => {
  "use strict";

  const REPO_OWNER = "NhinQuanhLanCuoi9999";
  const REPO_NAME = "mcsm-vi";
  const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
  const API_RELEASES_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=30`;
  const CACHE_KEY = `mcsm_vi_releases_${REPO_OWNER}_${REPO_NAME}_v2`;
  const CACHE_TTL_MS = 5 * 60 * 1000;

  // Verified fallback snapshot of v1.0.2-a if GitHub API is rate-limited or offline
  const FALLBACK_RELEASES = [
    {
      tag_name: "v1.0.2-a",
      name: "Minecraft: Story Mode - Season 1 VIỆT HÓA",
      draft: false,
      prerelease: false,
      published_at: "2026-11-26T01:20:48Z",
      html_url: `${REPO_URL}/releases/tag/v1.0.2-a`,
      assets: [
        {
          name: "MCSM-Vietnamese-Setup.exe",
          size: 11765760,
          download_count: null,
          browser_download_url: `${REPO_URL}/releases/download/v1.0.2-a/MCSM-Vietnamese-Setup.exe`,
        },
      ],
      body: [
        "# Minecraft: Story Mode — Season One · Việt hóa `v1.0.2`",
        "",
        "Bản phát hành công khai đầu tiên của dự án Việt hóa cộng đồng miễn phí **Minecraft: Story Mode — Season One (Windows PC)** bởi **`@naphelem.`**, bao gồm trọn bộ giao diện, font chữ pixel tiếng Việt và **đầy đủ Tập 1–8** trong một bộ cài duy nhất.",
        "",
        "## Có gì mới",
        "- **Trọn bộ Tập 1–8:** Hỗ trợ cả Jesse nam & nữ, lựa chọn thoại, bảng hiệu trong cảnh và danh đề đầu/cuối tập.",
        "- **Bỏ qua tóm tắt đầu tập (giữ phím `K`):** Huy hiệu đặt ở góc trên-phải, không đè phụ đề phía dưới.",
        "- **Discord Rich Presence:** Hiển thị trạng thái đang chơi Tập 1–8 cùng phần trăm tiến độ lên Discord.",
        "- **Trình cài đặt 1 tệp duy nhất:** Tự hỗ trợ DirectX cho máy mới, không sửa tệp game gốc và không mất save.",
        "",
        "## Kiểm tra tệp",
        "- **Tệp tải về:** `MCSM-Vietnamese-Setup.exe` (`~11.22` MB)",
        "- **SHA-256:** `4a98c8bb1353f50fef72921a8a2b3b453f278b37a16d860e3ed7eb8331e16c43`",
      ].join("\n"),
    },
  ];

  // Lightbox gallery matching data-lightbox-index="0..5"
  const GALLERY_ITEMS = [
    {
      src: "./assets/new/skip_recap.png",
      title: "Nút bỏ qua tóm tắt thực tế trong game",
      desc: "Ảnh chụp thực tế trong cảnh Wither Storm: nút [K | Giữ để bỏ qua] nằm gọn ở góc trên-phải, tách biệt hoàn toàn với vùng phụ đề phía dưới.",
    },
    {
      src: "./assets/recap-skip-macro.png",
      title: "Cận cảnh 8 trạng thái của nút Skip (giữ phím K)",
      desc: "Viền xanh chạy dọc 4 cạnh quanh ô phím K theo tiến độ giữ phím, lóe sáng “Đang bỏ qua...” khi đủ và tự hạ sáng sau 6 giây chờ.",
    },
    {
      src: "./assets/new/main.png",
      title: "Menu chính trong game",
      desc: "Ảnh chụp thực tế màn hình Menu chính với bộ chữ pixel tiếng Việt đầy đủ dấu, giữ đúng phong cách Minecraft.",
    },
    {
      src: "./assets/new/loichoi.png",
      title: "Cài đặt lối chơi — Bỏ qua tóm tắt & Discord Presence",
      desc: "Bật hoặc tắt nhanh hai tiện ích ngay trong menu Cài đặt → Lối chơi của game bất kỳ lúc nào.",
    },
    {
      src: "./assets/new/guide.png",
      title: "Hướng dẫn thao tác phím & chuột trong game",
      desc: "Màn hình điều khiển chi tiết các phím di chuyển, chạy, tương tác và chuột được dịch đầy đủ, rõ ràng.",
    },
    {
      src: "./assets/showcase-installer.png",
      title: "Trình cài đặt MCSM-Vietnamese-Setup.exe",
      desc: "Giao diện cài đặt từng bước, hỗ trợ chọn tập muốn cài, bổ sung DirectX khi cần và gỡ sạch về tiếng Anh gốc chỉ với 1 ô tích.",
    },
  ];

  const state = {
    source: "loading", // "loading" | "live" | "cache" | "fallback"
    releases: {
      a: null,
      b: null,
    },
    activeModalSeason: null,
    lastFocusedEl: null,
    lightboxIndex: 0,
  };

  /* --------------------------------------------------------------------------
     Utilities
     -------------------------------------------------------------------------- */

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
    const re = new RegExp(`(?:^|[-_.\\d])${seasonSuffix}$`, "i");
    return re.test(tagName.trim());
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
     GitHub Releases Fetching + Caching + Fallback
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
      // Ignore private-mode storage restrictions
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

    updateSeasonUi();

    const syncEl = document.getElementById("github-sync-status");
    if (syncEl) {
      if (source === "loading") {
        syncEl.textContent = "Đang đồng bộ từ GitHub...";
      } else if (source === "live") {
        syncEl.textContent = "Đã đồng bộ trực tiếp từ GitHub Releases.";
      } else if (source === "cache") {
        syncEl.textContent = "Đã đồng bộ từ GitHub Releases.";
      } else {
        const suffix = errorReason ? ` (${errorReason})` : "";
        syncEl.textContent = `Tạm dùng bản lưu dự phòng v1.0.2-a${suffix}.`;
      }
    }

    if (state.activeModalSeason) {
      renderReleaseModal(state.activeModalSeason);
    }
  }

  function updateSeasonUi() {
    // --- Season 1 (a) ---
    const relA = state.releases.a;
    if (relA) {
      const assetA = pickPrimaryAsset(relA);
      const sizeStr = assetA ? formatBytes(assetA.size) : "Xem trên GitHub";
      const dateShort = formatDateShortVi(relA.published_at);

      setText("hero-ss1-tag", relA.tag_name);
      setText("hero-ss1-meta", `${sizeStr} · ${dateShort}`);
      setText("hero-btn-tag", relA.tag_name);

      setText("card-a-title", relA.name || "Season One — Việt hóa");
      setText("card-a-tag", relA.tag_name);
      setText("card-a-date", formatDateVi(relA.published_at));
      setText("card-a-asset", assetA ? `${assetA.name} (${sizeStr})` : "Xem trên GitHub");

      const badgeA = document.getElementById("card-a-badge");
      if (badgeA) {
        badgeA.textContent = relA.prerelease ? "THỬ NGHIỆM" : "ĐÃ RA MẮT";
        badgeA.className = "status-badge is-live pixel";
      }
      const heroBadgeA = document.getElementById("hero-ss1-badge");
      if (heroBadgeA) {
        heroBadgeA.textContent = relA.prerelease ? "THỬ NGHIỆM" : "ĐÃ RA MẮT";
        heroBadgeA.className = "status-badge is-live pixel";
      }
      const ghA = document.getElementById("card-a-gh");
      if (ghA && isSafeHttpUrl(relA.html_url)) {
        ghA.href = relA.html_url;
      }
    }

    // --- Season 2 (b) ---
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
      if (badgeB) {
        badgeB.textContent = relB.prerelease ? "THỬ NGHIỆM" : "ĐÃ RA MẮT";
        badgeB.className = "status-badge is-live-s2 pixel";
      }
      if (heroBadgeB) {
        heroBadgeB.textContent = relB.prerelease ? "THỬ NGHIỆM" : "ĐÃ RA MẮT";
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
      setText("hero-ss2-meta", "Cập nhật sau bản Season 1");
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
     Release Modal
     -------------------------------------------------------------------------- */

  const releaseModal = document.getElementById("release-modal");
  const releaseDialog = releaseModal ? releaseModal.querySelector(".modal-dialog") : null;

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
      const dlCount =
        typeof primaryAsset.download_count === "number"
          ? ` · ${primaryAsset.download_count.toLocaleString("vi-VN")} lượt tải`
          : "";
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

  /* --------------------------------------------------------------------------
     Lightbox
     -------------------------------------------------------------------------- */

  const lightbox = document.getElementById("lightbox");
  const lightboxDialog = lightbox ? lightbox.querySelector(".lightbox-dialog") : null;
  const lightboxImg = document.getElementById("lightbox-img");

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
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => fetchReleases({ forceRefresh: true }));
    }
    const modalRefreshBtn = document.getElementById("modal-refresh-btn");
    if (modalRefreshBtn) {
      modalRefreshBtn.addEventListener("click", () => fetchReleases({ forceRefresh: true }));
    }

    document.querySelectorAll("[data-lightbox-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number.parseInt(btn.getAttribute("data-lightbox-index") || "0", 10);
        openLightbox(Number.isNaN(idx) ? 0 : idx, btn);
      });
    });

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

    document.querySelectorAll("[data-copy-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-copy-target");
        if (targetId) copyFromElement(btn, targetId);
      });
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (lightbox && !lightbox.hidden) closeLightbox();
        else if (releaseModal && !releaseModal.hidden) closeReleaseModal();
      } else if (lightbox && !lightbox.hidden) {
        if (ev.key === "ArrowLeft") showLightboxItem(state.lightboxIndex - 1);
        else if (ev.key === "ArrowRight") showLightboxItem(state.lightboxIndex + 1);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyReleaseList(FALLBACK_RELEASES, "loading");
    bindEvents();
    fetchReleases({ forceRefresh: false });
  });
})();
