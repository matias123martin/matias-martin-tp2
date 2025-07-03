/**
 * Módulo para manejar todos los filtros de juegos
 */

// Estado de los filtros
let currentFilters = {
  search: "",
  platform: "",
  genre: "",
  ordering: "-rating",
};

//#region METODOS FILTROS
let onFiltersChangeCallback = null;
export function initializeFilters(onFiltersChange) {
  onFiltersChangeCallback = onFiltersChange;
  setupFilterEventListeners();
}

function setupFilterEventListeners() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearchChange, 500));
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearchChange();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearchChange);
  }

  // Filtros de plataforma y género
  const platformFilter = document.getElementById("filterPlatform");
  const genreFilter = document.getElementById("filterGenre");

  if (platformFilter) {
    platformFilter.addEventListener("change", handlePlatformChange);
  }

  if (genreFilter) {
    genreFilter.addEventListener("change", handleGenreChange);
  }
  //#endregion

  //#region botones orden
  const sortButtons = {
    name: document.getElementById("sortByName"),
    rating: document.getElementById("sortByRating"),
    released: document.getElementById("sortByReleased"),
  };

  if (sortButtons.name) {
    sortButtons.name.addEventListener("click", () => handleSortChange("name"));
  }

  if (sortButtons.rating) {
    sortButtons.rating.addEventListener("click", () =>
      handleSortChange("-rating")
    );
  }

  if (sortButtons.released) {
    sortButtons.released.addEventListener("click", () =>
      handleSortChange("-released")
    );
  }
}
//#endregion

//#region ESCUCHAR CAMBIOS
function handleSearchChange() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  const searchTerm = searchInput.value.trim();

  if (searchTerm === currentFilters.search) return;

  currentFilters.search = searchTerm;
  notifyFiltersChange();
}

function handlePlatformChange() {
  const platformFilter = document.getElementById("filterPlatform");
  if (!platformFilter) return;

  currentFilters.platform = platformFilter.value;
  notifyFiltersChange();
}

function handleGenreChange() {
  const genreFilter = document.getElementById("filterGenre");
  if (!genreFilter) return;

  currentFilters.genre = genreFilter.value;
  notifyFiltersChange();
}

function handleSortChange(ordering) {
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn =
    ordering === "name"
      ? document.getElementById("sortByName")
      : ordering === "-rating"
      ? document.getElementById("sortByRating")
      : document.getElementById("sortByReleased");

  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  currentFilters.ordering = ordering;
  notifyFiltersChange();
}

function notifyFiltersChange() {
  if (onFiltersChangeCallback) {
    onFiltersChangeCallback(getCurrentFilters());
  }
}

export function getCurrentFilters() {
  return { ...currentFilters };
}
//#endregion

//#region RESET DE FILTROS
export function resetFilters() {
  currentFilters = {
    search: "",
    platform: "",
    genre: "",
    ordering: "-rating",
  };

  const searchInput = document.getElementById("searchInput");
  const platformFilter = document.getElementById("filterPlatform");
  const genreFilter = document.getElementById("filterGenre");

  if (searchInput) searchInput.value = "";
  if (platformFilter) platformFilter.value = "";
  if (genreFilter) genreFilter.value = "";

  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const ratingBtn = document.getElementById("sortByRating");
  if (ratingBtn) {
    ratingBtn.classList.add("active");
  }

  notifyFiltersChange();
}

export function fillFilters(games, filterPlatform, filterGenre) {
  const platforms = new Set();
  const genres = new Set();

  games.forEach((game) => {
    if (game.platforms) {
      game.platforms.forEach((p) => platforms.add(p.platform.name));
    }
    if (game.genres) {
      game.genres.forEach((g) => genres.add(g.name));
    }
  });

  filterPlatform.innerHTML = `<option value="">Todas las plataformas</option>`;
  [...platforms].forEach((p) => {
    filterPlatform.innerHTML += `<option value="${p}">${p}</option>`;
  });

  filterGenre.innerHTML = `<option value="">Todos los géneros</option>`;
  [...genres].forEach((g) => {
    filterGenre.innerHTML += `<option value="${g}">${g}</option>`;
  });
}
//#endregion
//#region FILTROS
export function applyFilters(allGames, search, platform, genre) {
  let filtered = allGames;

  if (search) {
    filtered = filtered.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (platform) {
    filtered = filtered.filter(
      (g) =>
        g.platforms && g.platforms.some((p) => p.platform.name === platform)
    );
  }

  if (genre) {
    filtered = filtered.filter(
      (g) => g.genres && g.genres.some((g2) => g2.name === genre)
    );
  }

  return filtered;
}

export async function loadFilterOptions(
  filterPlatform,
  filterGenre,
  getPlatforms,
  getGenres
) {
  try {
    const [platforms, genres] = await Promise.all([
      getPlatforms(),
      getGenres(),
    ]);

    filterPlatform.innerHTML =
      '<option value="">Todas las plataformas</option>';
    platforms.slice(0, 15).forEach((platform) => {
      const option = document.createElement("option");
      option.value = platform.id;
      option.textContent = platform.name;
      filterPlatform.appendChild(option);
    });

    filterGenre.innerHTML = '<option value="">Todos los géneros</option>';
    genres.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre.id;
      option.textContent = genre.name;
      filterGenre.appendChild(option);
    });

    console.log("Filtros cargados correctamente");
  } catch (error) {
    console.error("Error al cargar filtros:", error);
  }
}
//#endregion
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
