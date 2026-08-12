const API_KEY = "61adb936952545458353555ac64b0527";

export async function searchIngredients(query){
    if (query.length < 2) return [];
    const response = await fetch(`https://api.spoonacular.com/food/ingredients/autocomplete?query=${query}&number=5&apiKey=${API_KEY}`);

    if (!response.ok) {
        throw new Error("Failed to fetch ingredient suggestions");
    }

    return await response.json();
}

export async function searchRecipesByIngredients(ingredients) {
    if (!API_KEY || ingredients.length === 0) return [];

    const query = ingredients.join(", ");

    const response = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(query)}&number=6&ranking=2&ignorePantry=true&apiKey=${API_KEY}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch recipes");
    }

    return response.json();
}

export async function searchRecipesByName(query = "", options = {}) {
    if (!API_KEY) return [];

    const params = new URLSearchParams({
        number: "12",
        addRecipeInformation: "true"
    });

    const trimmedQuery = query.trim();
    if (trimmedQuery) {
        params.set("query", trimmedQuery);
    }

    if (options.diet) {
        params.set("diet", options.diet);
    }

    if (options.intolerances && options.intolerances.length) {
        params.set("intolerances", options.intolerances.join(","));
    }

    const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}&apiKey=${API_KEY}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch recipes by name");
    }

    const data = await response.json();
    return data.results || [];
}

export async function fetchRandomRecipes(number = 9) {
    if (!API_KEY) return [];

    const response = await fetch(
        `https://api.spoonacular.com/recipes/random?number=${number}&apiKey=${API_KEY}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch featured recipes");
    }

    const data = await response.json();
    return data.recipes || [];
}

export async function fetchRecipeDetails(recipeId) {
  if (!API_KEY) return null;

  const response = await fetch(
    `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${API_KEY}`
  );

  if (!response.ok) throw new Error("Failed to fetch recipe details");
  return response.json();
}