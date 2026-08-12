import { searchIngredients } from "./recipeApi.js";

let debounceTimer;

const input = document.querySelector("#ingredient-input");
const suggestionBox = document.querySelector("#suggestions");
const tagContainer = document.querySelector("#ingredient-tags");

let selectedIngredients = [];

if(input){
    input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const value = input.value.trim();
            if(value.length < 2){
                suggestionBox.innerHTML = "";
                return;
            }

            const suggestions = await searchIngredients(value);
            suggestionBox.innerHTML="";
            suggestions.forEach(food => {
                const li = document.createElement("li");
                li.textContent = food.name;
                li.addEventListener("click", () =>{
                    addIngredient(food.name);

                    input.value = "";
                    suggestionBox.innerHTML = "";
                });
                suggestionBox.appendChild(li);
            });
        }, 300);    
    });


    input.addEventListener("keydown", (e)=>{
        if(e.key==="Enter"){
            e.preventDefault();
            if(input.value.trim()!==""){
                addIngredient(input.value.trim());

                input.value = "";
                suggestionBox.innerHTML = "";
            }
        }
    });
};

function addIngredient(name){
    if (selectedIngredients.includes(name))
        return;
    selectedIngredients.push(name);
    const tag = document.createElement("div");
    tag.className = "tag";

    tag.innerHTML = `${name} <button>&times;</button>`;

    tag.querySelector("button").addEventListener("click", ()=>{
        selectedIngredients = selectedIngredients.filter(item=>item!==name);
        tag.remove();
    });
    tagContainer.appendChild(tag);

}

export function getIngredients(){
    return selectedIngredients;
}