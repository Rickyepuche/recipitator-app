import { loadHeaderFooter } from "./utils.mjs";
import { getIngredients } from "./ingredientInput.js";
import { formFunction, toggleFilterForm, toggleSearch, renderRecipeResults, renderFeaturedRecipes, renderFavoritesPage } from "./recipeRender.js";
import { searchRecipesByIngredients, fetchRecipeDetails, fetchRandomRecipes } from "./recipeApi.js";
import { searchUnsplashPhotos } from "./upsplashApi.js";

const INGREDIENTS_STORE_KEY = "recipeSearchIngredients";
let galleryImageUrls = [];
let currentGalleryIndex = 0;

function initializeApp() {
    const submitBtn = document.querySelector("#submit-btn");
    const recipeResultsContainer = document.querySelector("#recipe-results");
    const featuredContainer = document.querySelector(".featured-recipes");
    const recipeTitle = document.querySelector("#recipe-title");
    const recipeDescription = document.querySelector("#recipe-description");
    const recipeMeta = document.querySelector("#recipe-meta");
    const recipeInstructions = document.querySelector("#recipe-instructions");
    const recipeMainImage = document.querySelector("#recipe-main-image");
    const galleryImage = document.querySelector("#gallery-image");
    const prevImageButton = document.querySelector("#prev-image");
    const nextImageButton = document.querySelector("#next-image");
    const recipeNutrition = document.querySelector("#recipe-nutrition");

    toggleSearch();
    toggleFilterForm();
    formFunction();

    if (prevImageButton) {
        prevImageButton.addEventListener("click", (e) => {
            e.preventDefault();
            showPrevGalleryImage();
        });
    }

    if (nextImageButton) {
        nextImageButton.addEventListener("click", (e) => {
            e.preventDefault();
            showNextGalleryImage();
        });
    }

    function saveSearchIngredients(ingredients) {
        sessionStorage.setItem(INGREDIENTS_STORE_KEY, JSON.stringify(ingredients));
    }

    function getSavedSearchIngredients() {
        const saved = sessionStorage.getItem(INGREDIENTS_STORE_KEY);
        return saved ? JSON.parse(saved) : [];
    }

    function getRecipeIdFromUrl() {
        return new URLSearchParams(window.location.search).get("id");
    }

    function formatNutrients(nutrition) {
        if (!nutrition || !nutrition.nutrients) return "";
        return nutrition.nutrients
            .slice(0, 6)
            .map((nutrient) => `<div class="nutrition-item"><strong>${nutrient.title}:</strong> ${nutrient.amount}${nutrient.unit}</div>`)
            .join("");
    }

    async function renderRecipeDetail(recipe) {
        if (!recipe) return;

        if (recipeTitle) recipeTitle.textContent = recipe.title || "Recipe";
        if (recipeDescription) recipeDescription.innerHTML = recipe.summary || "";

        if (recipeMeta) {
            recipeMeta.innerHTML = `
                <p><strong>Ready in:</strong> ${recipe.readyInMinutes || "N/A"} min</p>
                <p><strong>Servings:</strong> ${recipe.servings || "N/A"}</p>
                <p><strong>Cuisine:</strong> ${recipe.cuisines?.join(", ") || "Unknown"}</p>
            `;
        }

        if (recipeInstructions) {
            const steps = recipe.analyzedInstructions?.[0]?.steps || [];
            if (steps.length) {
                recipeInstructions.innerHTML = `<ol>${steps
                    .map((step) => `<li>${step.step}</li>`)
                    .join("")}</ol>`;
            } else if (recipe.instructions) {
                recipeInstructions.innerHTML = recipe.instructions;
            } else {
                recipeInstructions.innerHTML = "<p>No instructions available.</p>";
            }
        }

        if (recipeNutrition) {
            recipeNutrition.innerHTML = formatNutrients(recipe.nutrition) || "<p>No nutrition data available.</p>";
        }

        renderRecipeMainImage(recipe);
        await loadUnsplashGallery(recipe.title || "food");
        renderCurrentGalleryImage();
    }

    function renderRecipeMainImage(recipe) {
        if (!recipeMainImage) return;

        if (recipe.image) {
            recipeMainImage.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}" />
            `;
        } else {
            recipeMainImage.innerHTML = "<p>No recipe image available.</p>";
        }
    }

    function renderCurrentGalleryImage() {
        if (!galleryImage) return;

        if (!galleryImageUrls.length) {
            galleryImage.innerHTML = "<p>No gallery images available.</p>";
            return;
        }

        const imageUrl = galleryImageUrls[currentGalleryIndex];
        galleryImage.innerHTML = `
            <img src="${imageUrl}" alt="Recipe gallery image ${currentGalleryIndex + 1}" />
        `;
    }

    function showNextGalleryImage() {
        if (!galleryImageUrls.length) return;
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryImageUrls.length;
        renderCurrentGalleryImage();
    }

    function showPrevGalleryImage() {
        if (!galleryImageUrls.length) return;
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryImageUrls.length) % galleryImageUrls.length;
        renderCurrentGalleryImage();
    }

    async function loadUnsplashGallery(query) {
        if (!query) return;

        try {
            galleryImageUrls = await searchUnsplashPhotos(`${query} food recipe`);
            currentGalleryIndex = 0;
        } catch (error) {
            console.error("Failed to load Upsplash gallery images:", error);
            galleryImageUrls = [];
        }
    }

    async function loadRecipeDetailPage(recipeId) {
        if (!recipeId) return;

        try {
            const recipe = await fetchRecipeDetails(recipeId);
            await renderRecipeDetail(recipe);
        } catch (error) {
            console.error("Failed to load recipe detail:", error);
            if (recipeTitle) recipeTitle.textContent = "Unable to load recipe details.";
        }
    }

    async function loadFeaturedRecipes() {
        if (!featuredContainer) return;

        try {
            const randomRecipes = await fetchRandomRecipes(9);
            renderFeaturedRecipes(randomRecipes);
        } catch (error) {
            console.error("Failed to load featured recipes:", error);
            featuredContainer.innerHTML = "<p>Unable to load featured recipes.</p>";
        }
    }

    async function searchAndRenderRecipes(ingredients) {
        if (!ingredients.length) {
            if (recipeResultsContainer) {
                recipeResultsContainer.innerHTML = "<p>Please add ingredients on the home page and click Generate recipe.</p>";
            }
            return;
        }

        try {
            const recipes = await searchRecipesByIngredients(ingredients);
            renderRecipeResults(recipes);
        } catch (error) {
            console.error("Recipe search failed:", error);
            if (recipeResultsContainer) {
                recipeResultsContainer.innerHTML = "<p>Unable to load recipes. Please try again later.</p>";
            }
        }
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const ingredients = getIngredients();
            if (!ingredients.length) {
                console.log("No ingredients selected");
                return;
            }

            saveSearchIngredients(ingredients);
            window.location.href = "src/recipe-display/recipes.html";
        });
    }

    if (recipeResultsContainer) {
        const savedIngredients = getSavedSearchIngredients();
        searchAndRenderRecipes(savedIngredients);
    }

    if (featuredContainer) {
        loadFeaturedRecipes();
    }

    if (document.querySelector("#favorites-list")) {
        renderFavoritesPage();
    }

    const recipeId = getRecipeIdFromUrl();
    if (recipeId) {
        loadRecipeDetailPage(recipeId);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadHeaderFooter().then(() => {
        initializeApp();
    });
});

