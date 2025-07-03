const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;

//#region API CONFIG
async function apiRequest(endpoint, params = {}) {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append("key", API_KEY);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.append(key, value);
      }
    });

    console.log("API Request:", url.toString());

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Request Error:", error);
    throw new Error(`Error en la petición: ${error.message}`);
  }
}
//#endregion
//#region OBTENER DATA MEDIANTE FILTROS

export async function getGames(options = {}) {
  const {
    search = "",
    platforms = "",
    genres = "",
    ordering = "-rating",
    page = 1,
    page_size = 20,
  } = options;

  const params = {
    search,
    platforms,
    genres,
    ordering,
    page,
    page_size,
  };

  const data = await apiRequest("/games", params);
  return {
    games: data.results || [],
    count: data.count || 0,
    next: data.next,
    previous: data.previous,
  };
}

export async function getGameById(id) {
  if (!id) {
    throw new Error("ID del juego es requerido");
  }

  const response = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
  if (!response.ok) throw new Error("Error al cargar detalles");
  return await response.json();
}

export async function getGameScreenshots(id) {
  const data = await apiRequest(`/games/${id}/screenshots`);
  return data.results || [];
}

export async function getPlatforms() {
  const data = await apiRequest("/platforms", { page_size: 50 });
  return data.results || [];
}

export async function getGenres() {
  const data = await apiRequest("/genres", { page_size: 50 });
  return data.results || [];
}

export async function searchGames(query, options = {}) {
  if (!query.trim()) {
    throw new Error("El término de búsqueda no puede estar vacío");
  }

  return await getGames({
    search: query.trim(),
    ...options,
  });
}
//#endregion
