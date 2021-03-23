const recipeList = document.getElementById('recipe-list');
const recipeDetailsContent = document.querySelector('.recipe-details-content');
const recipeCloseBtn = document.getElementById('recipe-close-btn');

let recipeData = [];
let specialData = [];

// Event Listeners
recipeList.addEventListener('click', getRecipe);
recipeCloseBtn.addEventListener('click', () => {
    recipeDetailsContent.parentElement.classList.remove('showRecipe');
});

// Get Recipe List from API
function getRecipeList() {
    fetch(`http://localhost:3001/recipes`)
        .then((response) => response.json())
        .then(
            fetch(`http://localhost:3001/specials`)
                .then((response) => response.json())
                .then((data) => (specialData = data))
        )
        .then((data) => {
            let html = '';

            if (data) {
                // Save the recipe data for creating modals later.
                recipeData = data;

                // Display all the resulting recipes.
                for (let i = 0; i < data.length; i++) {
                    html += `
                    <div class="recipe-item" data-id="${data[i].uuid}">
                        <div class="recipe">
                            <div class="recipe-img">
                                <img src=".${data[i].images.small}">
                            </div>
                            <div class="recipe-name">
                                <h3>${data[i].title}</h3>
                                <a href="#" class="recipe-btn">Get Recipe</a>
                            </div>
                        </div>
                    </div>
                    `;
                }

                recipeList.classList.remove('notFound');
            } else {
                html = "Sorry, we didn't find anything";
                recipeList.classList.add('notFound');
            }

            recipeList.innerHTML = html;
        });
}

// Get recipe for this recipe.
function getRecipe(e) {
    e.preventDefault();

    if (e.target.classList.contains('recipe-btn')) {
        let recipeItem = e.target.parentElement.parentElement.parentElement;

        recipeModal(recipeItem.dataset.id);
    }
}

// Create recipe modal
function recipeModal(recipe) {
    // API doesn't have an endpoint for a specific uuid, so go through the list we already fetched and find the right one.
    recipeData.forEach((r) => {
        if (r.uuid === recipe) {
            // Build list of ingredients.
            let ingredients = '<ul>';

            r.ingredients.forEach((i) => {
                ingredients += `<li class='recipe-ingredient-item'>${i.amount} ${i.measurement} ${i.name}</li>`;

                // Check for specials.
                let specials = '';

                // Again, no endpoint for finding a specific uuid, so go through the list we already fetched.
                specialData.forEach((s) => {
                    if (s.ingredientId === i.uuid) {
                        specials += '<ul>';

                        specials += `<li class='recipe-special-item'>${
                            s.type.charAt(0).toUpperCase() + s.type.slice(1)
                        }: ${s.title}!</li>`;
                        specials += `<li class='recipe-special-item'>${s.text}</li>`;

                        specials += '</ul>';
                    }
                });

                if (specials) {
                    ingredients += specials;
                }
            });

            ingredients += '</ul>';

            // Build list of directions.
            let directions = '<ul>';

            r.directions.forEach((d) => {
                directions += `<li class='recipe-direction-item'>`;

                if (d.optional) {
                    directions += '(OPTIONAL)';
                }

                directions += `
                    ${d.instructions}</li>
                `;
            });

            directions += '</ul>';

            // Build each content page.
            let html = `
                <div>
                    <div class="recipe-details-img">
                        <img src=".${r.images.small}" alt="" />
                    </div>
                    <div class="recipe-header">
                        <h2 class="recipe-title">${r.title}</h2>
                        <cite class="recipe-description">${r.description}</cite>
                    </div>
                </div>
                <div class="tab recipe-content">
                    <button
                        class="btn tablinks"
                        onclick="openTab(event,'Ingredients')"
                        id="defaultOpen"
                    >
                        Ingredients
                    </button>
                    <button
                        class="btn tablinks"
                        onclick="openTab(event,'Directions')"
                    >
                        Directions
                    </button>
                    <div id="Ingredients" class="recipe-ingredients tabcontent">
                        <h3>Ingredients:</h3>
                        ${ingredients}
                    </div>
                    <div id="Directions" class="recipe-directions tabcontent">
                        <h3>Directions:</h3>
                        ${directions}
                    </div>
                </div>
            `;

            recipeDetailsContent.innerHTML = html;
            recipeDetailsContent.parentElement.classList.add('showRecipe');
            document.getElementById('defaultOpen').click();
        }
    });
}

function openTab(evt, tabName) {
    // Hide all tabcontent by default.
    let tabcontent = document.getElementsByClassName('tabcontent');

    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }

    // Deactivate all tablinks
    let tablinks = document.getElementsByClassName('tablinks');

    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
}
