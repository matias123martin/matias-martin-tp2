const FAVORITES_KEY = "favorites";

//#region METODOS PARA FAVORITOS
export function getFavorites() {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    return [];
  }
}

export function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error al guardar favoritos:", error);
  }
}

export function isFavorite(gameId) {
  const favorites = getFavorites();
  return favorites.some((fav) => fav.id === gameId);
}

export function addToFavorites(game) {
  const favorites = getFavorites();

  // Verifica si ya está en favoritos
  if (favorites.some((fav) => fav.id === game.id)) {
    return false;
  }

  favorites.push(game);
  saveFavorites(favorites);
  return true;
}

export function removeFromFavorites(gameId) {
  const favorites = getFavorites();
  const initialLength = favorites.length;

  const updatedFavorites = favorites.filter((fav) => fav.id !== gameId);

  if (updatedFavorites.length < initialLength) {
    saveFavorites(updatedFavorites);
    return true;
  }

  return false;
}
//#endregion

//#region mensaje del toast
export function toggleFavorite(game) {
  const wasAdded = addToFavorites(game);

  if (wasAdded) {
    return {
      added: true,
      message: "Juego agregado a favoritos",
    };
  } else {
    const wasRemoved = removeFromFavorites(game.id);
    return {
      added: false,
      message: wasRemoved
        ? "Juego eliminado de favoritos"
        : "Error al modificar favoritos",
    };
  }
}
//#endregion
export function getFavoritesCount() {
  return getFavorites().length;
}

export function clearFavorites() {
  saveFavorites([]);
}
