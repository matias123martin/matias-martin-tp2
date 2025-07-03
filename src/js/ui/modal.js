import { getGameScreenshots } from "../api.js";

//#region MODAL CREACION
export async function renderModal(game) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modalBody");

  // Mostrar modal si no está visible
  if (!modal.classList.contains("show")) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  try {
    const screenshots = await getGameScreenshots(game.id).catch(() => []);

    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const isFavorite = favorites.includes(game.id.toString());

    const rating = game.rating ? game.rating.toFixed(1) : "N/A";
    const stars = getStarRating(game.rating);

    const releaseDate = game.released
      ? new Date(game.released).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "No disponible";

    const platforms = game.platforms
      ? game.platforms.map((p) => p.platform.name).join(", ")
      : "No disponible";
    const genres = game.genres
      ? game.genres.map((g) => g.name).join(", ")
      : "No disponible";
    const developers = game.developers
      ? game.developers.map((d) => d.name).join(", ")
      : "No disponible";

    modalBody.innerHTML = `
      <div class="game-detail">
        <div class="game-detail-header">
          <h2 class="game-detail-title">${game.name}</h2>
          <img src="${
            game.background_image || "/placeholder.svg?height=300&width=600"
          }" 
               alt="${game.name}" 
               class="game-detail-image">
          
          <div class="game-rating" style="justify-content: center; margin: 1rem 0;">
            <span class="rating-stars" style="font-size: 1.5rem;">${stars}</span>
            <span class="rating-number" style="font-size: 1.25rem; margin-left: 0.5rem;">${rating}</span>
          </div>
          
          <button class="favorite-btn ${isFavorite ? "active" : ""}" 
                  style="font-size: 2rem; margin: 1rem 0;"
                  onclick="toggleFavoriteFromModal('${game.id}')"
                  title="${
                    isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                  }">
            ${isFavorite ? "❤️" : "🤍"}
          </button>
        </div>
        
        <div class="game-detail-info">
          ${
            game.description_raw
              ? `
            <div class="info-section">
              <h3>📝 Descripción</h3>
              <p>${game.description_raw}</p>
            </div>
          `
              : ""
          }
          
          <div class="info-section">
            <h3>ℹ️ Información General</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Fecha de lanzamiento:</span>
                <span class="info-value">${releaseDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Plataformas:</span>
                <span class="info-value">${platforms}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Géneros:</span>
                <span class="info-value">${genres}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Desarrolladores:</span>
                <span class="info-value">${developers}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Metacritic:</span>
                <span class="info-value">${game.metacritic || "N/A"}</span>
              </div>
            </div>
          </div>
          
          ${
            screenshots.length > 0
              ? `
            <div class="info-section">
              <h3>📸 Capturas de pantalla</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                ${screenshots
                  .slice(0, 6)
                  .map(
                    (screenshot) => `
                  <img src="${screenshot.image}" 
                       alt="Screenshot" 
                       style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer;"
                       onclick="window.open('${screenshot.image}', '_blank')">
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error al renderizar modal:", error);
    modalBody.innerHTML = `
      <div class="error-message">
        <p>❌ Error al cargar los detalles del juego.</p>
        <button onclick="closeModal()">Cerrar</button>
      </div>
    `;
  }
}
//#endregion

//#region metodos modal
export function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("show");
  document.body.style.overflow = "auto";
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

// Función global para toggle de favorito desde modal
window.toggleFavoriteFromModal = (gameId) => {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const gameIdStr = gameId.toString();

  if (favorites.includes(gameIdStr)) {
    const updatedFavorites = favorites.filter((id) => id !== gameIdStr);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    showToast("Juego eliminado de favoritos", "warning");
  } else {
    favorites.push(gameIdStr);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    showToast("Juego agregado a favoritos", "success");
  }

  // Actualizar botón en modal
  const favoriteBtn = document.querySelector(".modal .favorite-btn");
  const isNowFavorite = JSON.parse(localStorage.getItem("favorites")).includes(
    gameIdStr
  );

  favoriteBtn.classList.toggle("active", isNowFavorite);
  favoriteBtn.textContent = isNowFavorite ? "❤️" : "🤍";
  favoriteBtn.title = isNowFavorite
    ? "Quitar de favoritos"
    : "Agregar a favoritos";

  // Actualizar botones en la página principal
  updateAllFavoriteButtons();
};

// Función para mostrar toast
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Función para actualizar botones de favoritos
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
