const FAVORITES_KEY = "elvis-birthday-favorites";

const byId = (id) => document.getElementById(id);
const safeMediaUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    // The cards remain usable when browser storage is unavailable.
  }
}

function setCopy(data) {
  const { infos, lettrePardon } = data;
  document.title = infos.titreSite;
  byId("hero-title").innerHTML = `Joyeux anniversaire,<br><em>${escapeHtml(infos.nom)}</em>`;
  byId("hero-subtitle").textContent = infos.sousTitre;
  byId("letter-heading").textContent = lettrePardon.titre || "Une lettre que je te devais";
  byId("letter-content").replaceChildren(...lettrePardon.paragraphes.map((paragraph) => {
    const element = document.createElement("p");
    element.textContent = paragraph;
    return element;
  }));
  byId("letter-signoff").textContent = lettrePardon.signature || "Avec toute ma sincérité,";

  const replyAction = byId("reply-action");
  if (infos.emailReponse) {
    const link = document.createElement("a");
    link.href = `mailto:${encodeURIComponent(infos.emailReponse)}?subject=${encodeURIComponent(`Pour ${infos.nom}`)}`;
    link.textContent = "M'écrire, si tu le souhaites";
    replyAction.append(link);
  } else {
    const note = document.createElement("span");
    note.className = "reply-note";
    note.textContent = "Tu peux me répondre quand tu le voudras, par le moyen qui te convient.";
    replyAction.append(note);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function renderGallery(data) {
  const photos = data.galeriePhotos.map((photo) => ({ ...photo, type: "photo" }));
  const videos = data.galerieVideos.map((video) => ({ ...video, type: "video" }));
  const items = [...photos, ...videos];
  const gallery = byId("gallery");
  byId("count-all").textContent = items.length;
  byId("count-photos").textContent = photos.length;
  byId("count-videos").textContent = videos.length;

  const renderItems = (filter = "all") => {
    const visibleItems = items.filter((item) => filter === "all" || item.type === filter);
    if (!visibleItems.length) {
      const empty = document.createElement("div");
      empty.className = "gallery-empty";
      const title = document.createElement("strong");
      const message = document.createElement("p");
      title.textContent = filter === "all" ? "Un espace pour vos souvenirs" : `Aucune ${filter === "photo" ? "photo" : "vidéo"} pour l'instant`;
      message.textContent = filter === "all"
        ? "Ajoute tes images et vidéos dans data.json pour les voir apparaître ici."
        : "Tu peux ajouter tes souvenirs dans data.json quand tu le souhaites.";
      empty.append(title, message);
      gallery.replaceChildren(empty);
      return;
    }

    const cards = visibleItems.map((item) => createMediaCard(item));
    gallery.replaceChildren(...cards);
  };

  document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter-button").forEach((option) => {
        const active = option === button;
        option.classList.toggle("is-active", active);
        option.setAttribute("aria-pressed", String(active));
      });
      renderItems(button.dataset.filter);
    });
  });
  renderItems();
}

function createMediaCard(item) {
  const card = document.createElement("article");
  card.className = "media-card";
  card.dataset.type = item.type;
  const frame = document.createElement("div");
  frame.className = "media-frame";
  const mediaUrl = safeMediaUrl(item.url);

  if (item.type === "video" && mediaUrl) {
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = mediaUrl;
    const poster = safeMediaUrl(item.poster);
    if (poster) video.poster = poster;
    video.setAttribute("aria-label", item.caption || "Souvenir vidéo");
    frame.append(video);
  } else if (mediaUrl) {
    const image = document.createElement("img");
    image.src = mediaUrl;
    image.alt = item.caption || "Souvenir photo";
    image.loading = "lazy";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "media-open";
    openButton.setAttribute("aria-label", `Agrandir : ${item.caption || "souvenir photo"}`);
    openButton.addEventListener("click", () => openMedia(item));
    frame.append(image, openButton);
  } else {
    const missing = document.createElement("p");
    missing.textContent = "Chemin de média à vérifier dans data.json";
    missing.className = "gallery-empty";
    frame.append(missing);
  }

  const caption = document.createElement("div");
  caption.className = "media-caption";
  const text = document.createElement("p");
  text.textContent = item.caption || "Un souvenir";
  caption.append(text);
  if (item.date) {
    const date = document.createElement("time");
    date.textContent = item.date;
    caption.append(date);
  }
  if (item.type === "video" && mediaUrl) {
    const enlarge = document.createElement("button");
    enlarge.type = "button";
    enlarge.className = "filter-button";
    enlarge.textContent = "Agrandir";
    enlarge.addEventListener("click", () => openMedia(item));
    caption.append(enlarge);
  }
  card.append(frame, caption);
  return card;
}

function openMedia(item) {
  const url = safeMediaUrl(item.url);
  if (!url) return;
  const container = byId("dialog-media");
  const media = document.createElement(item.type === "video" ? "video" : "img");
  if (item.type === "video") {
    media.controls = true;
    media.autoplay = true;
    media.playsInline = true;
    const poster = safeMediaUrl(item.poster);
    if (poster) media.poster = poster;
  } else {
    media.alt = item.caption || "Souvenir photo agrandi";
  }
  media.src = url;
  container.replaceChildren(media);
  byId("media-dialog").returnValue = "";
  byId("dialog-caption").textContent = item.caption || "";
  byId("media-dialog").showModal();
}

function renderQualities(qualities) {
  const grid = byId("qualities-grid");
  const favorites = readFavorites();
  const cards = qualities.map((item, index) => {
    const details = document.createElement("details");
    details.className = "quality-card reveal";
    const summary = document.createElement("summary");
    const number = document.createElement("span");
    number.className = "quality-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("span");
    title.className = "quality-title";
    title.textContent = item.titre;
    const prompt = document.createElement("span");
    prompt.className = "quality-prompt";
    prompt.innerHTML = '<span>Découvrir</span><span aria-hidden="true">+</span>';
    summary.append(number, title, prompt);
    const message = document.createElement("p");
    message.className = "quality-message";
    message.textContent = item.message;
    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className = "quality-favorite";
    favorite.dataset.favoriteId = String(item.id);
    favorite.setAttribute("aria-pressed", String(favorites.has(String(item.id))));
    favorite.textContent = favorites.has(String(item.id)) ? "♥ Garder près de moi" : "♡ Garder près de moi";
    favorite.addEventListener("click", () => {
      const id = String(item.id);
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      saveFavorites(favorites);
      const isFavorite = favorites.has(id);
      favorite.setAttribute("aria-pressed", String(isFavorite));
      favorite.textContent = isFavorite ? "♥ Garder près de moi" : "♡ Garder près de moi";
    });
    details.append(summary, message, favorite);
    return details;
  });
  grid.replaceChildren(...cards);
}

function enableRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  elements.forEach((element) => observer.observe(element));
}

async function init() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    setCopy(data);
    renderGallery(data);
    renderQualities(data.qualites || data.souvenirs || []);
    enableRevealAnimations();
  } catch (error) {
    console.error("Impossible de charger data.json :", error);
    const message = byId("load-error");
    message.textContent = "Les contenus n'ont pas pu être chargés. Ouvre cette page via un petit serveur local pour autoriser fetch() sur data.json.";
    message.hidden = false;
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
  }
}

byId("media-dialog").addEventListener("click", (event) => {
  if (event.target === byId("media-dialog")) byId("media-dialog").close();
});
byId("media-dialog").addEventListener("close", () => byId("dialog-media").replaceChildren());
init();
