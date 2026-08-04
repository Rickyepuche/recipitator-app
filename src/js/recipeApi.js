const API_KEY = "";

export async function searchIngredients(query){
    if (query.length < 2) return [];
    const response = await fetch(`https://api.spooncular.com/food/ingredients/autocomplete?query=${query}&number=5&apikey=${API_KEY}`);

    return await response.json();
}