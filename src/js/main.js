import { loadHeaderFooter } from "./utils.mjs";
import { getIngredients } from "./ingredientInput.js";
loadHeaderFooter();

const submitBtn = document.querySelector("#submit-btn");

if(submitBtn){
	submitBtn.addEventListener("click", ()=>{
		const ingredients = getIngredients();
		console.log(ingredients);
	});
}

