// localStorage helpers for favorite recipes

export function getFavorites() {
  const raw = localStorage.getItem("recipeFavorites");
  return raw ? JSON.parse(raw) : [];
}

export function saveFavorites(list) {
  localStorage.setItem("recipeFavorites", JSON.stringify(list));
}

export function isFavorite(recipeId) {
  return getFavorites().some(
    (item) => String(item.id) === String(recipeId)
  );
}

export function toggleFavorite(recipe) {
  const favorites = getFavorites();
  const exists = favorites.some(
    (item) => String(item.id) === String(recipe.id)
  );

  if (exists) {
    // Remove favorite if already stored
    saveFavorites(
      favorites.filter(
        (item) => String(item.id) !== String(recipe.id)
      )
    );
  } else {
    // Add recipe to favorites
    favorites.push({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
    });
    saveFavorites(favorites);
  }
}