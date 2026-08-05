import { loadHeaderFooter } from "./utils.mjs";
import { getIngredients } from "./ingredientInput.js";
loadHeaderFooter();
document.querySelector("#submit-btn").addEventListener("click", ()=>{
	const ingredients = getIngredients();
	console.log(ingredients);
});


