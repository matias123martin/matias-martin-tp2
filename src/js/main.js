import "../styles/style.css";
import { getGames, getGameById, getPlatforms, getGenres } from "./api.js";
import { loadFilterOptions, applyFilters } from "./filters/game-filters.js";
import { renderModal, closeModal } from "./ui/modal.js";
import { showToast, showErrorToast } from "./ui/toast.js";

// Variables globales
let allGames = [];
let currentGames = [];
let currentPage = 1;
let hasMore = true;
let isLoading = false;
let favoriteGames = [];
let favoritesCurrentPage = 1;
const favoritesPerPage = 10;
let filteredFavorites = [];

// Referencias a elementos del DOM
const gamesContainer = document.getElementById("gamesContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const searchInput = document.getElementById("searchInput");
const filterPlatform = document.getElementById("filterPlatform");
const filterGenre = document.getElementById("filterGenre");
const sortByName = document.getElementById("sortByName");
const sortByRating = document.getElementById("sortByRating");
const loadingSpinner = document.getElementById("loadingSpinner");
const errorMessage = document.getElementById("errorMessage");
const retryBtn = document.getElementById("retryBtn");
const homeLink = document.getElementById("homeLink");
const favoritesLink = document.getElementById("favoritesLink");
const homePage = document.getElementById("homePage");
const favoritesPage = document.getElementById("favoritesPage");
const paginationControls = document.getElementById("paginationControls");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

//#region inicializar
async function init() {
  try {
    // Cargar filtros desde la API
    await loadFilterOptions(
      filterPlatform,
      filterGenre,
      getPlatforms,
      getGenres
    );

    // Cargar juegos iniciales
    await loadGames(true);

    // Configurar event listeners
    setupEventListeners();
  } catch (error) {
    console.error("Error al inicializar:", error);
    showError("Error al cargar la aplicación");
  }
}
//#endregion

//#region escucha de eventos
function setupEventListeners() {
  // Navegación
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("home");
  });

  favoritesLink.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("favorites");
  });

  // Búsqueda
  searchInput.addEventListener("input", debounce(handleSearch, 500));

  // Filtros
  filterPlatform.addEventListener("change", handleFilters);
  filterGenre.addEventListener("change", handleFilters);

  // Ordenamiento
  sortByName.addEventListener("click", () => handleSort("name"));
  sortByRating.addEventListener("click", () => handleSort("-rating"));

  // Reintentar
  retryBtn.addEventListener("click", () => {
    hideError();
    loadGames(true);
  });

  // Modal y favoritos
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("view-details")) {
      const id = e.target.dataset.id;
      try {
        showModal();
        const game = await getGameById(id);
        renderModal(game);
      } catch (error) {
        console.error("Error al cargar detalles:", error);
        showErrorToast("Error al cargar detalles del juego");
      }
    }

    if (e.target.classList.contains("close-btn")) {
      closeModal();
    }

    if (e.target.classList.contains("favorite-btn")) {
      const gameId = e.target.dataset.id;
      toggleFavorite(gameId);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  // Paginación
  prevPageBtn.addEventListener("click", async () => {
    if (favoritesPage.classList.contains("active")) {
      goToPreviousFavoritesPage();
    } else {
      if (currentPage > 1 && !isLoading) {
        currentPage--;
        await loadGames(false);
      }
    }
  });
  // Paginacion
  nextPageBtn.addEventListener("click", async () => {
    if (favoritesPage.classList.contains("active")) {
      goToNextFavoritesPage();
    } else {
      if (hasMore && !isLoading) {
        currentPage++;
        await loadGames(false);
      }
    }
  });
}
//#endregion

async function loadGames(reset = false) {
  if (isLoading) return;

  try {
    isLoading = true;

    if (reset) {
      currentPage = 1;
    }

    showLoading();
    hideError();

    const params = {
      page: currentPage,
      page_size: 20, // 20 juegos por página
      ordering: "-rating",
    };

    const result = await getGames(params);

    allGames = result.games;
    currentGames = result.games;
    hasMore = result.next !== null;

    renderGames();
  } catch (error) {
    console.error("Error al cargar juegos:", error);
    showError("Error al cargar los juegos");
    showErrorToast("Error al cargar los juegos");
  } finally {
    isLoading = false;
    hideLoading();
  }
}

function renderGames() {
  gamesContainer.innerHTML = "";

  if (currentGames.length === 0) {
    gamesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        <p>No se encontraron juegos.</p>
      </div>
    `;
    paginationControls.classList.add("hidden");
    return;
  }

  currentGames.forEach((game) => {
    const gameCard = createGameCard(game);
    gamesContainer.appendChild(gameCard);
  });

  updatePaginationControls();
}

function updatePaginationControls() {
  // Si no hay mas de una pagina quitar paginacion
  if (currentPage <= 1 && !hasMore) {
    paginationControls.classList.add("hidden");
    return;
  }

  paginationControls.classList.remove("hidden");
  pageInfo.textContent = `Página ${currentPage}`;

  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = !hasMore;
}

function updateFavoritesPaginationControls() {
  const totalPages = Math.ceil(filteredFavorites.length / favoritesPerPage);

  paginationControls.classList.remove("hidden");
  pageInfo.textContent = `Página ${favoritesCurrentPage} de ${totalPages}`;

  prevPageBtn.disabled = favoritesCurrentPage <= 1;
  nextPageBtn.disabled = favoritesCurrentPage >= totalPages;
}

//#region Crear Card
function createGameCard(game) {
  const card = document.createElement("div");
  card.className = "game-card";

  const rating = game.rating ? game.rating.toFixed(1) : "N/A";
  const stars = getStarRating(game.rating);
  const platforms = game.platforms
    ? game.platforms.slice(0, 3).map((p) => p.platform.name)
    : [];
  const genres = game.genres ? game.genres.slice(0, 3).map((g) => g.name) : [];

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const isFavorite = favorites.includes(game.id.toString());

  card.innerHTML = `
    <img src="${
      game.background_image || "/placeholder.svg?height=200&width=300"
    }" 
         alt="${game.name}" class="game-image" loading="lazy">
    <div class="game-info">
      <h3 class="game-title">${game.name}</h3>
      
      <div class="game-rating">
        <span class="rating-stars">${stars}</span>
        <span class="rating-number">${rating}</span>
      </div>
      
      ${
        platforms.length > 0
          ? `
        <div class="game-platforms">
          ${platforms
            .map((platform) => `<span class="platform-tag">${platform}</span>`)
            .join("")}
        </div>
      `
          : ""
      }
      
      ${
        genres.length > 0
          ? `
        <div class="game-genres">
          ${genres
            .map((genre) => `<span class="genre-tag">${genre}</span>`)
            .join("")}
        </div>
      `
          : ""
      }
      
      <div class="game-actions">
        <button class="favorite-btn ${isFavorite ? "active" : ""}" 
                data-id="${game.id}" 
                title="${
                  isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                }">
          ${isFavorite ? "❤️" : "🤍"}
        </button>
        <button class="view-details" data-id="${game.id}">
          Ver detalles
        </button>
      </div>
    </div>
  `;

  return card;
}
//#endregion

//#region filtros
async function handleSearch() {
  if (favoritesPage.classList.contains("active")) {
    handleFavoritesFilters();
  } else {
    await handleFilters();
  }
}

async function handleFilters() {
  if (favoritesPage.classList.contains("active")) {
    handleFavoritesFilters();
    return;
  }

  try {
    isLoading = true;
    showLoading();

    const params = {
      page: 1,
      page_size: 20,
      ordering: "-rating",
    };

    if (searchInput.value.trim()) {
      params.search = searchInput.value.trim();
    }

    if (filterPlatform.value) {
      params.platforms = filterPlatform.value;
    }

    if (filterGenre.value) {
      params.genres = filterGenre.value;
    }

    const result = await getGames(params);

    allGames = result.games;
    currentGames = result.games;
    currentPage = 1;
    hasMore = result.next !== null;

    renderGames();
  } catch (error) {
    console.error("Error al filtrar:", error);
    showErrorToast("Error al aplicar filtros");
  } finally {
    isLoading = false;
    hideLoading();
  }
}

function handleFavoritesFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const platform = filterPlatform.value;
  const genre = filterGenre.value;

  filteredFavorites = applyFilters(favoriteGames, searchTerm, platform, genre);
  favoritesCurrentPage = 1; // Reset a la primera página
  renderFavoritesPage();
}

function handleSort(sortType) {
  document
    .querySelectorAll(".sort-btn")
    .forEach((btn) => btn.classList.remove("active"));

  if (favoritesPage.classList.contains("active")) {
    if (sortType === "name") {
      sortByName.classList.add("active");
      filteredFavorites.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sortByRating.classList.add("active");
      filteredFavorites.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    renderFavoritesPage();
  } else {
    const uniqueGames = currentGames.filter(
      (game, index, self) => index === self.findIndex((g) => g.id === game.id)
    );

    if (sortType === "name") {
      sortByName.classList.add("active");
      currentGames = uniqueGames.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sortByRating.classList.add("active");
      currentGames = uniqueGames.sort(
        (a, b) => (b.rating || 0) - (a.rating || 0)
      );
    }
    renderGames(); // Cambiar de renderFilteredGames() a renderGames()
  }
}

function renderFavoritesPage() {
  favoritesContainer.innerHTML = "";

  if (filteredFavorites.length === 0) {
    favoritesContainer.innerHTML = `
      <div class="empty-favorites">
        <p>No se encontraron favoritos.</p>
      </div>
    `;
    paginationControls.classList.add("hidden");
    return;
  }

  // Calcular índices para la paginación
  const startIndex = (favoritesCurrentPage - 1) * favoritesPerPage;
  const endIndex = startIndex + favoritesPerPage;
  const gamesToShow = filteredFavorites.slice(startIndex, endIndex);

  gamesToShow.forEach((game) => {
    const gameCard = createGameCard(game);
    favoritesContainer.appendChild(gameCard);
  });

  updateFavoritesPaginationControls();
}
//#endregion

//#region Paginacion-filtros favs

function goToPreviousFavoritesPage() {
  if (favoritesCurrentPage > 1) {
    favoritesCurrentPage--;
    renderFavoritesPage();
  }
}

function goToNextFavoritesPage() {
  const totalPages = Math.ceil(filteredFavorites.length / favoritesPerPage);
  if (favoritesCurrentPage < totalPages) {
    favoritesCurrentPage++;
    renderFavoritesPage();
  }
}

function toggleFavorite(gameId) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const gameIdStr = gameId.toString();

  if (favorites.includes(gameIdStr)) {
    favorites = favorites.filter((id) => id !== gameIdStr);
    showToast("Juego eliminado de favoritos", "warning");
  } else {
    favorites.push(gameIdStr);
    showToast("Juego agregado a favoritos", "success");
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateAllFavoriteButtons();

  if (favoritesPage.classList.contains("active")) {
    loadFavorites();
  }
}

function updateAllFavoriteButtons() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  document.querySelectorAll(".favorite-btn").forEach((btn) => {
    const gameId = btn.getAttribute("data-id");
    const isFavorite = favorites.includes(gameId);

    btn.classList.toggle("active", isFavorite);
    btn.textContent = isFavorite ? "❤️" : "🤍";
    btn.title = isFavorite ? "Quitar de favoritos" : "Agregar a favoritos";
  });
}
//#endregion

function showPage(page) {
  document
    .querySelectorAll(".nav-link")
    .forEach((link) => link.classList.remove("active"));
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));

  if (page === "home") {
    homeLink.classList.add("active");
    homePage.classList.add("active");
    searchInput.value = "";
    filterPlatform.value = "";
    filterGenre.value = "";
  } else if (page === "favorites") {
    favoritesLink.classList.add("active");
    favoritesPage.classList.add("active");
    loadFavorites();
  }
}

async function loadFavorites() {
  const favoriteIds = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favoriteIds.length === 0) {
    favoritesContainer.innerHTML = `
      <div class="empty-favorites">
        <p>No tienes juegos favoritos aún.</p>
        <p>¡Explora y agrega algunos!</p>
      </div>
    `;
    favoriteGames = [];
    filteredFavorites = [];
    paginationControls.classList.add("hidden");
    return;
  }

  favoriteGames = [];
  favoritesCurrentPage = 1;

  for (const id of favoriteIds) {
    try {
      const game = await getGameById(id);
      favoriteGames.push(game);
    } catch (error) {
      console.error(`Error cargando favorito ${id}:`, error);
    }
  }

  filteredFavorites = [...favoriteGames];
  renderFavoritesPage();
}

function showModal() {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <div class="modal-loading">
      <div class="spinner"></div>
      <p>Cargando detalles del juego...</p>
    </div>
  `;

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

async function goToPreviousPage() {
  if (currentPage > 1 && !isLoading) {
    currentPage--;
    await loadGames(false);
  }
}

async function goToNextPage() {
  if (hasMore && !isLoading) {
    currentPage++;
    await loadGames(false);
  }
}

// Exponer funciones globales
window.goToPreviousPage = goToPreviousPage;
window.goToNextPage = goToNextPage;
window.closeModal = closeModal;

function showLoading() {
  loadingSpinner.classList.remove("hidden");
}
function hideLoading() {
  loadingSpinner.classList.add("hidden");
}

function showError(message) {
  errorMessage.classList.remove("hidden");
  errorMessage.querySelector("p").textContent = `❌ ${message}`;
}

function hideError() {
  errorMessage.classList.add("hidden");
}

function getStarRating(rating) {
  if (!rating) return "☆☆☆☆☆";

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    "★".repeat(fullStars) + (hasHalfStar ? "☆" : "") + "☆".repeat(emptyStars)
  );
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.addEventListener("DOMContentLoaded", init);
