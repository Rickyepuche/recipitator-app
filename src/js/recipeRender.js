import { isFavorite, toggleFavorite } from "./localStorage.js";
import { searchRecipesByName, fetchRandomRecipes } from "./recipeApi.js";

// I use this local image whenever the Spoonacular image is missing or broken.
const placeholderRecipeImage = new URL("../images/placeholder.jpg", import.meta.url).href;

// I keep track of the recipes currently shown so I can toggle favorites on the right cards.
let currentRecipes = [];

// I pick a safe image URL so the card always has something to display.
function getRecipeImageSrc(recipe) {
  return recipe?.image || placeholderRecipeImage;
}

// I grab the filter form from the page so I can read the selected diet and allergy values.
function getFilterForm() {
  return document.querySelector("#recipe-filter-form");
}

// I grab the filter toggle button so I can open and close the filter panel.
function getFilterButton() {
  return document.querySelector("#showFilter");
}

// I grab the wrapper that holds the filter panel.
function getFilterWrapper() {
  return document.querySelector(".recipe-filter");
}

// I grab the search field container so I can show and hide the recipe search box.
function getSearchWrapper() {
  return document.querySelector("#searchWrapper");
}

// I grab the search toggle button so I can switch the search box open or closed.
function getSearchButton() {
  return document.querySelector("#searchRecipes");
}

// I grab the actual search input so I can read what the user typed.
function getRecipeInput() {
  return document.querySelector("#recipe-input");
}

// I grab the button that starts the recipe search when the user clicks it.
function getRecipeSearchButton() {
  return document.querySelector("#recipe-search");
}

// I read the selected filter values from the form so I can search with the correct diet and allergies.
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

// I run a recipe search using the user's text and any selected filter options.
export async function performRecipeSearch() {
  const searchInput = getRecipeInput();
  const query = searchInput ? searchInput.value.trim() : "";
  const { diet, intolerances } = getSelectedFilters();

  // I show random recipes when the user hasn't typed anything and hasn't chosen any filters.
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

// I attach the filter form submit handler so the search runs when the form is submitted.
export function formFunction() {
  const form = getFilterForm();
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await performRecipeSearch();
  });
}

// I open and close the filter dropdown when the user clicks the filter button.
export function toggleFilterForm() {
  const filterButton = getFilterButton();
  const filterWrapper = getFilterWrapper();
  if (!filterButton || !filterWrapper) return;

  filterButton.addEventListener("click", (e) => {
    e.preventDefault();
    filterWrapper.classList.toggle("hidden");
  });
}

// I show and hide the recipe search box and make sure the button text stays in sync.
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

// I render the list of recipe cards on recipes.html.
export function renderRecipeResults(recipes) {
  const resultsContainer = document.querySelector("#recipe-results");
  if (!resultsContainer) return;

  currentRecipes = recipes;

  // I show a friendly message when the search returns no matching recipes.
  if (!recipes.length) {
    resultsContainer.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  // I build the recipe card HTML and add the image fallback in case the API image fails.
  resultsContainer.innerHTML = recipes
    .map((recipe) => `
      <article class="recipe-card">
        <img
          src="${getRecipeImageSrc(recipe)}"
          alt="${recipe.title}"
          onerror="this.onerror=null; this.src='${placeholderRecipeImage}';"
        >
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

  // I only attach the click listener once so I do not create duplicate event handlers.
  if (!resultsContainer.dataset.listenerAdded) {
    resultsContainer.addEventListener("click", handleRecipeResultClick);
    resultsContainer.dataset.listenerAdded = "true";
  }
}

// I render the featured recipe cards on the home page.
export function renderFeaturedRecipes(recipes) {
  const featuredContainer = document.querySelector(".featured-recipes");
  if (!featuredContainer) return;

  // I show a fallback message if the featured recipes cannot be loaded.
  if (!recipes.length) {
    featuredContainer.innerHTML = "<p>No featured recipes available.</p>";
    return;
  }

  // I build the featured cards and keep the image fallback in place for each card.
  featuredContainer.innerHTML = recipes
    .map((recipe) => {
      const ingredientText = recipe.extendedIngredients
        ? recipe.extendedIngredients.slice(0, 4).map((item) => item.name).join(", ")
        : recipe.usedIngredients
        ? recipe.usedIngredients.slice(0, 4).map((item) => item.name).join(", ")
        : "Ingredients unavailable";

      return `
        <article class="featured-card" data-id="${recipe.id}">
          <img
            src="${getRecipeImageSrc(recipe)}"
            alt="${recipe.title}"
            onerror="this.onerror=null; this.src='${placeholderRecipeImage}';"
          />
          <div class="featured-card-content">
            <h3>${recipe.title}</h3>
            <p>${ingredientText}</p>
          </div>
        </article>
      `;
    })
    .join("");

  // I only attach the featured click listener once to avoid duplicate navigation handlers.
  if (!featuredContainer.dataset.listenerAdded) {
    featuredContainer.addEventListener("click", handleFeaturedClick);
    featuredContainer.dataset.listenerAdded = "true";
  }
}

// I send the user to the recipe details page when they click a featured card.
function handleFeaturedClick(event) {
  const card = event.target.closest(".featured-card");
  if (!card) return;
  const recipeId = card.dataset.id;
  if (!recipeId) return;

  window.location.href = `src/recipe-display/index.html?id=${recipeId}`;
}

// I handle clicks inside the recipe results so a user can view a recipe or favorite it.
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

    // I save or remove the recipe from favorites and then update the button label.
    toggleFavorite(recipe);

    favoriteButton.textContent = isFavorite(recipe.id)
      ? "Remove favorite"
      : "Add favorite";
  }
}

// I render the cards on favorites.html using the saved favorite recipes in localStorage.
export function renderFavoritesPage() {
  const list = document.querySelector("#favorites-list");
  if (!list) return;

  const favorites = getFavorites();
  // I show a message when the user has not saved any favorites yet.
  if (!favorites.length) {
    list.innerHTML = "<p>No favorites yet.</p>";
    return;
  }

  // I build the favorite cards with the same fallback image pattern as the main recipe results.
  list.innerHTML = favorites
    .map((recipe) => `
      <article class="recipe-card">
        <img
          src="${getRecipeImageSrc(recipe)}"
          alt="${recipe.title}"
          onerror="this.onerror=null; this.src='${placeholderRecipeImage}';"
        >
        <h3>${recipe.title}</h3>
        <p>Ready in ${recipe.readyInMinutes || "?"} min</p>
        <button class="view-recipe" data-id="${recipe.id}">
          Open recipe
        </button>
      </article>
    `)
    .join("");

  // I attach one click handler so the user can open each favorite recipe from the list.
  if (!list.dataset.listenerAdded) {
    list.addEventListener("click", (event) => {
      const button = event.target.closest(".view-recipe");
      if (!button) return;
      window.location.href = `./index.html?id=${button.dataset.id}`;
    });
    list.dataset.listenerAdded = "true";
  }
}

// I read the favorites list from localStorage so I can rebuild the page whenever needed.
function getFavorites() {
  return JSON.parse(localStorage.getItem("recipeFavorites") || "[]");
}