export function createGameCard(game, onToggleFavorite, onShowDetails) {
  const card = document.createElement("div");
  card.className = "game-card";
  card.setAttribute("data-game-id", game.id);

  const rating = game.rating ? game.rating.toFixed(1) : "N/A";
  const stars = getStarRating(game.rating);

  const platforms = game.platforms
    ? game.platforms.slice(0, 3).map((p) => p.platform.name)
    : [];

  const genres = game.genres ? game.genres.slice(0, 3).map((g) => g.name) : [];

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const isFavorite = favorites.some((fav) => fav.id === game.id);

  const imageUrl =
    game.background_image || "/placeholder.svg?height=200&width=300";

  card.innerHTML = `
    <img src="${imageUrl}" alt="${game.name}" class="game-image" loading="lazy">
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
                data-game-id="${game.id}" 
                title="${
                  isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                }">
          ${isFavorite ? "❤️" : "🤍"}
        </button>
        <button class="view-details" data-game-id="${game.id}">
          Ver detalles
        </button>
      </div>
    </div>
  `;
  const favoriteBtn = card.querySelector(".favorite-btn");
  const detailsBtn = card.querySelector(".view-details");

  if (favoriteBtn && onToggleFavorite) {
    favoriteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onToggleFavorite(game);
    });
  }

  if (detailsBtn && onShowDetails) {
    detailsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onShowDetails(game.id);
    });
  }

  if (onShowDetails) {
    card.addEventListener("click", () => {
      onShowDetails(game.id);
    });
  }

  return card;
}

export function updateGameCardFavorite(gameId, isFavorite) {
  const card = document.querySelector(`[data-game-id="${gameId}"]`);
  if (!card) return;

  const favoriteBtn = card.querySelector(".favorite-btn");
  if (!favoriteBtn) return;

  favoriteBtn.classList.toggle("active", isFavorite);
  favoriteBtn.textContent = isFavorite ? "❤️" : "🤍";
  favoriteBtn.title = isFavorite
    ? "Quitar de favoritos"
    : "Agregar a favoritos";
}

export function updateAllFavoriteButtons() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  document.querySelectorAll(".favorite-btn").forEach((btn) => {
    const gameId = Number.parseInt(btn.getAttribute("data-game-id"));
    const isFavorite = favorites.some((fav) => fav.id === gameId);

    btn.classList.toggle("active", isFavorite);
    btn.textContent = isFavorite ? "❤️" : "🤍";
    btn.title = isFavorite ? "Quitar de favoritos" : "Agregar a favoritos";
  });
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
