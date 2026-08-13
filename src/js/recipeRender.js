import { isFavorite, toggleFavorite } from "./localStorage.js";
import { searchRecipesByName, fetchRandomRecipes } from "./recipeApi.js";

let currentRecipes = [];

const placeholderRecipeImage = new URL("../images/placeholder.jpg", import.meta.url).href;

function getRecipeImageSrc(recipe) {
  return recipe?.image || placeholderRecipeImage;
}

function getFilterForm() {
  return document.querySelector("#recipe-filter-form");
}

function getFilterButton() {
  return document.querySelector("#showFilter");
}

function getFilterWrapper() {
  return document.querySelector(".recipe-filter");
}

function getSearchWrapper() {
  return document.querySelector("#searchWrapper");
}

function getSearchButton() {
  return document.querySelector("#searchRecipes");
}

function getRecipeInput() {
  return document.querySelector("#recipe-input");
}

function getRecipeSearchButton() {
  return document.querySelector("#recipe-search");
}

function getSelectedFilters() {
  const form = getFilterForm();
  if (!form) {
    return { diet: "", intolerances: [] };
  }

  const formData = new FormData(form);
  return {
    diet: formData.get("diet") || "",
    intolerances: formData.getAll("intolerances")
  };
}

export async function performRecipeSearch() {
  const searchInput = getRecipeInput();
  const query = searchInput ? searchInput.value.trim() : "";
  const { diet, intolerances } = getSelectedFilters();

  if (!query && !diet && !intolerances.length) {
    const fallbackResults = await fetchRandomRecipes(12);
    renderRecipeResults(fallbackResults);
    return;
  }

  try {
    const results = await searchRecipesByName(query, { diet, intolerances });
    renderRecipeResults(results);
  } catch (error) {
    console.error("Recipe search failed:", error);
    const resultsContainer = document.querySelector("#recipe-results");
    if (resultsContainer) {
      resultsContainer.innerHTML = "<p>Unable to load recipes. Please try again later.</p>";
    }
  }
}

// Handle recipe filter form submit
export function formFunction() {
  const form = getFilterForm();
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await performRecipeSearch();
  });
}

// Toggle the filter panel
export function toggleFilterForm() {
  const filterButton = getFilterButton();
  const filterWrapper = getFilterWrapper();
  if (!filterButton || !filterWrapper) return;

  filterButton.addEventListener("click", (e) => {
    e.preventDefault();
    filterWrapper.classList.toggle("hidden");
  });
}

// Toggle the search input
export function toggleSearch() {
  const searchButton = getSearchButton();
  const searchWrapper = getSearchWrapper();
  const recipeSearchButton = getRecipeSearchButton();
  const recipeInput = getRecipeInput();

  if (searchButton && searchWrapper) {
    const syncSearchToggle = () => {
      const isHidden = searchWrapper.classList.contains("search-hidden");
      searchButton.setAttribute("aria-expanded", String(!isHidden));
      searchButton.textContent = isHidden ? "🔍 search" : "✕ close";
    };

    searchButton.addEventListener("click", (e) => {
      e.preventDefault();
      searchWrapper.classList.toggle("search-hidden");
      syncSearchToggle();

      if (!searchWrapper.classList.contains("search-hidden") && recipeInput) {
        recipeInput.focus();
      }
    });

    syncSearchToggle();
  }

  if (recipeSearchButton) {
    recipeSearchButton.addEventListener("click", async (e) => {
      e.preventDefault();
      await performRecipeSearch();
      if (searchWrapper) {
        searchWrapper.classList.add("search-hidden");
      }
      if (searchButton) {
        searchButton.setAttribute("aria-expanded", "false");
        searchButton.textContent = "🔍 search";
      }
    });
  }

  if (recipeInput) {
    recipeInput.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await performRecipeSearch();
        if (searchWrapper) {
          searchWrapper.classList.add("search-hidden");
        }
        if (searchButton) {
          searchButton.setAttribute("aria-expanded", "false");
          searchButton.textContent = "🔍 search";
        }
      }
    });
  }
}

// Render the recipe cards on recipes.html
export function renderRecipeResults(recipes) {
  const resultsContainer = document.querySelector("#recipe-results");
  if (!resultsContainer) return;

  currentRecipes = recipes;

  if (!recipes.length) {
    resultsContainer.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  resultsContainer.innerHTML = recipes
    .map((recipe) => `
      <article class="recipe-card">
        <img src="${getRecipeImageSrc(recipe)}" alt="${recipe.title}">
        <h3>${recipe.title}</h3>
        <p>Used ingredients: ${recipe.usedIngredients?.length || 0}</p>
        <div class="recipe-actions">
          <button class="view-recipe" data-id="${recipe.id}">
            View recipe
          </button>
          <button class="favorite-recipe" data-id="${recipe.id}">
            ${isFavorite(recipe.id) ? "Remove favorite" : "Add favorite"}
          </button>
        </div>
      </article>
    `)
    .join("");

  if (!resultsContainer.dataset.listenerAdded) {
    resultsContainer.addEventListener("click", handleRecipeResultClick);
    resultsContainer.dataset.listenerAdded = "true";
  }
}

export function renderFeaturedRecipes(recipes) {
  const featuredContainer = document.querySelector(".featured-recipes");
  if (!featuredContainer) return;

  if (!recipes.length) {
    featuredContainer.innerHTML = "<p>No featured recipes available.</p>";
    return;
  }

  featuredContainer.innerHTML = recipes
    .map((recipe) => {
      const ingredientText = recipe.extendedIngredients
        ? recipe.extendedIngredients.slice(0, 4).map((item) => item.name).join(", ")
        : recipe.usedIngredients
        ? recipe.usedIngredients.slice(0, 4).map((item) => item.name).join(", ")
        : "Ingredients unavailable";

      return `
        <article class="featured-card" data-id="${recipe.id}">
          <img src="${getRecipeImageSrc(recipe)}" alt="${recipe.title}" />
          <div class="featured-card-content">
            <h3>${recipe.title}</h3>
            <p>${ingredientText}</p>
          </div>
        </article>
      `;
    })
    .join("");

  if (!featuredContainer.dataset.listenerAdded) {
    featuredContainer.addEventListener("click", handleFeaturedClick);
    featuredContainer.dataset.listenerAdded = "true";
  }
}

function handleFeaturedClick(event) {
  const card = event.target.closest(".featured-card");
  if (!card) return;
  const recipeId = card.dataset.id;
  if (!recipeId) return;

  window.location.href = `src/recipe-display/index.html?id=${recipeId}`;
}

function handleRecipeResultClick(event) {
  const viewButton = event.target.closest(".view-recipe");
  if (viewButton) {
    const recipeId = viewButton.dataset.id;
    window.location.href = `./index.html?id=${recipeId}`;
    return;
  }

  const favoriteButton = event.target.closest(".favorite-recipe");
  if (favoriteButton) {
    const recipeId = favoriteButton.dataset.id;
    const recipe = currentRecipes.find(
      (item) => String(item.id) === String(recipeId)
    );

    if (!recipe) return;

    toggleFavorite(recipe);

    favoriteButton.textContent = isFavorite(recipe.id)
      ? "Remove favorite"
      : "Add favorite";
  }
}

// Render the favorites page using saved localStorage data
export function renderFavoritesPage() {
  const list = document.querySelector("#favorites-list");
  if (!list) return;

  const favorites = getFavorites();
  if (!favorites.length) {
    list.innerHTML = "<p>No favorites yet.</p>";
    return;
  }

  list.innerHTML = favorites
    .map((recipe) => `
      <article class="recipe-card">
        <img src="${getRecipeImageSrc(recipe)}" alt="${recipe.title}">
        <h3>${recipe.title}</h3>
        <p>Ready in ${recipe.readyInMinutes || "?"} min</p>
        <button class="view-recipe" data-id="${recipe.id}">
          Open recipe
        </button>
      </article>
    `)
    .join("");

  if (!list.dataset.listenerAdded) {
    list.addEventListener("click", (event) => {
      const button = event.target.closest(".view-recipe");
      if (!button) return;
      window.location.href = `./index.html?id=${button.dataset.id}`;
    });
    list.dataset.listenerAdded = "true";
  }
}

// Helper for favorites page rendering
function getFavorites() {
  return JSON.parse(localStorage.getItem("recipeFavorites") || "[]");
}