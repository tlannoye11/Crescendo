const recipeList = document.getElementById('recipe-list');
const recipeDetailsContent = document.querySelector('.recipe-details-content');
const recipeCloseBtn = document.getElementById('recipe-close-btn');

let currentRecipe = '';

// Event Listeners
recipeList.addEventListener('click', getRecipe);
recipeCloseBtn.addEventListener('click', () => {
    recipeDetailsContent.parentElement.classList.remove('showRecipe');
    getRecipeList();
});

// Get Recipe List from API
function getRecipeList() {
    fetch(`http://localhost:3001/recipes`)
        .then((response) => response.json())
        .then((data) => {
            let html = '';

            if (data) {
                // Display all the resulting recipes.
                for (let i = 0; i < data.length; i++) {
                    html += `
                        <div class="recipe-item" data-id="${data[i].uuid}">
                            <div class="recipe">
                    `;

                    // Recipes uploaded by a user won't have any images.
                    html += `
                                <div class="recipe-img">
                                    <img src=".${
                                        data[i].images
                                            ? data[i].images.small
                                            : '/img/blanktable.png'
                                    }">
                                </div>
                                <div class="recipe-name">
                                    <h3>${data[i].title}</h3>
                                    <a href="#" class="recipe-btn">Get Recipe</a>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Add one more set of divs for a blank placeholder entry.
                html += `
                    <div class="recipe-item" data-id="New Recipe">
                        <div class="recipe">
                            <div class="recipe-img">
                                <img src="./img/blanktable.png">
                            </div>
                            <div class="recipe-name">
                                <h3>New recipe?</h3>
                                <a href="#" class="recipe-btn">Click Here</a>
                            </div>
                        </div>
                    </div>
                `;

                recipeList.classList.remove('notFound');
            } else {
                html = "Sorry, we didn't find anything";
                recipeList.classList.add('notFound');
            }

            recipeList.innerHTML = html;
        });
}

// Create a random ID for any new entries.
function createRandomID() {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

// Get details for this recipe.
function getRecipe(e) {
    e.preventDefault();

    if (e.target.classList.contains('recipe-btn')) {
        let recipeItem = e.target.parentElement.parentElement.parentElement;

        findRecipeData(recipeItem.dataset.id);
    }
}

// Determine if the current recipe is already among the API data.
async function findRecipeData(recipeID) {
    // Find out if any recipe data already exists.
    // A "new" recipe will have no uuid.
    let recipeData = {
        uuid: '',
        title: '',
        description: '',
        servings: 0,
        prepTime: 0,
        cookTime: 0,
        ingredients: [],
        directions: [],
    };

    if (recipeID === 'New Recipe') {
        // Need to insert a record into the database.
        recipeData.uuid = createRandomID();

        await fetch(`http://localhost:3001/recipes`, {
            method: 'POST',
            body: JSON.stringify(recipeData),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        })
            .then((response) => response.json())
            .then((data) => console.log('POST response:', data));

        createRecipeModal(recipeData);
    } else {
        await fetch(`http://localhost:3001/recipes/${recipeID}`)
            .then((response) => response.json())
            .then((data) => createRecipeModal(data));
    }
}

// Build the recipe details modal.
async function createRecipeModal(recipeData) {
    // Build the recipe header.
    let header = `
        <div class="recipe-details-img">
            <img src=".${
                recipeData.images
                    ? recipeData.images.small
                    : '/img/blanktable.png'
            }" alt="" />
        </div>
        <div class="recipe-header">
            <h2 class="recipe-title">${recipeData.title}</h2>
            <cite class="recipe-description">${recipeData.description}</cite>
            <i id="recipe-header-edit" class="edit-header-icon fas fa-pencil-alt"></i>
        </div>
    `;

    // Build list of directions.
    let directions = '';

    if (recipeData.directions.length > 0) {
        recipeData.directions.forEach((d) => {
            directions += `<li class='item recipe-direction-item'>`;
            directions += `<span class='direction-optional'>${
                d.optional ? '(OPTIONAL):' : ''
            }</span> `;
            directions += `<span class='direction-instructions'>${d.instructions}</span>`;
            directions += `<i id="recipe-direction-${d.uuid}" class="edit-icon edit-direction-icon fas fa-pencil-alt"></i>`;
            directions += `</li>`;
        });
    }

    // Build each content page.
    let html = `
                <div>
                    ${header}
                </div>
                <div class="tab recipe-content">
                    <button
                        id="tab-ingredients"
                        class="btn tablinks"
                        onclick="openTab(event,'Ingredients')"
                    >
                        Ingredients
                    </button>
                    <button
                        id="tab-directions"
                        class="btn tablinks"
                        onclick="openTab(event,'Directions')"
                    >
                        Directions
                    </button>
                    <div id="Ingredients" class="recipe-ingredients tabcontent">
                        <h3>Ingredients:
                            <i id='add-ingredient-icon' class='add-icon fas fa-plus'></i>
                        </h3>
                        <ul>
                        </ul>
                    </div>
                    <div id="Directions" class="recipe-directions tabcontent">
                        <h3>Directions:
                            <i id='add-direction-icon' class='add-icon fas fa-plus'></i>
                        </h3>
                        <ul>
                        ${directions}
                        </ul>
                    </div>
                </div>
                `;

    recipeDetailsContent.innerHTML = html;
    recipeDetailsContent.parentElement.classList.add('showRecipe');

    // Build list of ingredients.
    // Has to be async because each one needs to fetch its own specials.
    let ingredients = '';
    let specials = '';
    let specialFetches = [];

    recipeData.ingredients.forEach((i) => {
        // Check for specials.
        specialFetches.push(
            fetch(`http://localhost:3001/specials?ingredientId=${i.uuid}`)
                .then((response) => response.json())
                .then((specialData) => {
                    specials = '';

                    specialData.forEach(async (s) => {
                        specials += `<li class='item recipe-special-item' data-id="${s.uuid}">`;
                        specials += `<span class='special-type'>${
                            s.type.charAt(0).toUpperCase() + s.type.slice(1)
                        }</span>: `;
                        specials += `<span class='special-title'>${s.title}</span>! `;
                        specials += `<span class='special-text'>${s.text}</span>`;
                        specials += `<i id="recipe-special-${s.uuid}" class="edit-icon edit-special-icon fas fa-pencil-alt"></i>`;
                        specials += `</li>`;
                    });

                    ingredients += `<li class='item recipe-ingredient-item' data-id="${i.uuid}">`;
                    ingredients += `<span class='ingredient-amount'>${i.amount} </span>`;
                    ingredients += `<span class='ingredient-measurement'>${i.measurement} </span>`;
                    ingredients += `<span class='ingredient-name'>${i.name}</span>`;
                    ingredients += `<i id="recipe-ingredient-${i.uuid}" class="edit-icon edit-ingredient-icon fas fa-pencil-alt"></i>`;
                    ingredients += `</li>`;

                    if (specials) {
                        ingredients += '<ul>' + specials + '</ul>';
                    }
                })
                .catch((err) => {
                    console.log(err);
                })
        );
    });

    // Once all of the specials have been fetched, add the ingredients to the list.
    Promise.all(specialFetches).then(() => {
        // Add the ingredients and any specials to the modal.
        $('.recipe-ingredients ul').append(ingredients);
    });

    // Open the Ingredients tab by default.
    document.getElementById('tab-ingredients').click();

    $('.recipe-details').attr('data-id', recipeData.uuid);

    // Add some JQuery onclick events to each of the various icons.
    $('#add-ingredient-icon').on('click', addIngredient);
    $('#add-direction-icon').on('click', addDirection);
    $('.edit-header-icon').on('click', editRecipeHeader);
    $('.edit-ingredient-icon').on('click', editRecipeIngredient);
    $('.edit-special-icon').on('click', editIngredientSpecial);
    $('.edit-direction-icon').on('click', editRecipeDirection);
}

// Toggle the two tabs in the recipe modal: Ingredients and Directions
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

// JQuery to add new stuff to recipes.
async function addIngredient() {
    // Add an ingredient ID (random), amount, measurement, and name field (all empty).
    // Fetch the existing list of ingredients.
    // Add the new one to the existing list.
    // Patch request.
    let recipeID = $('.recipe-details').attr('data-id');

    await fetch(`http://localhost:3001/recipes/${recipeID}`)
        .then((response) => response.json())
        .then((data) => {
            if (data) {
                let newIngredients = {
                    ingredients: [
                        ...data.ingredients,
                        {
                            uuid: createRandomID(),
                            amount: '',
                            measurement: '',
                            name: '',
                        },
                    ],
                };

                fetch(`http://localhost:3001/recipes/${recipeID}`, {
                    method: 'PATCH',
                    body: JSON.stringify(newIngredients),
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8',
                    },
                })
                    .then((response) => response.json())
                    .then((response) => {
                        console.log(
                            'recipe ingredient add response:',
                            response
                        );
                        createRecipeModal(response);
                        document.getElementById('tab-ingredients').click();
                    })
                    .catch((err) => console.log('Patch error:', err));
            }
        });
}

async function addDirection() {
    // Add an optional and a instructions field (both empty).
    // Fetch the existing list of directions.
    // Add the new one to the existing list.
    // Patch request.
    let recipeID = $('.recipe-details').attr('data-id');

    await fetch(`http://localhost:3001/recipes/${recipeID}`)
        .then((response) => response.json())
        .then((data) => {
            if (data) {
                let newDirections = {
                    directions: [
                        ...data.directions,
                        { instructions: '', optional: false },
                    ],
                };

                fetch(`http://localhost:3001/recipes/${recipeID}`, {
                    method: 'PATCH',
                    body: JSON.stringify(newDirections),
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8',
                    },
                })
                    .then((response) => response.json())
                    .then((response) => {
                        console.log('recipe direction add response:', response);
                        createRecipeModal(response);
                        document.getElementById('tab-directions').click();
                    })
                    .catch((err) => console.log('Patch error:', err));
            }
        });
}

// JQuery to toggle saving/editing fields.
function editRecipeHeader() {
    let recipeID = $('.recipe-details').attr('data-id');

    if ($(this).hasClass('fa-save')) {
        $(this).addClass('fa-pencil-alt').removeClass('fa-save');
        $('.recipe-title').attr('contenteditable', 'false').css({
            border: 'none',
        });
        $('.recipe-description').attr('contenteditable', 'false').css({
            border: 'none',
        });

        // Update the current recipe data.
        let recipeData = {
            title: $('.recipe-title').text(),
            description: $('.recipe-description').text(),
        };

        fetch(`http://localhost:3001/recipes/${recipeID}`, {
            method: 'PATCH',
            body: JSON.stringify(recipeData),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        })
            .then((response) => response.json())
            .then((response) =>
                console.log('recipe header edit response:', response)
            )
            .catch((err) => console.log('Patch error:', err));
    } else {
        $(this).addClass('fa-save').removeClass('fa-pencil-alt');
        $('.recipe-title').attr('contenteditable', 'true').css({
            border: '1px solid',
        });
        $('.recipe-description').attr('contenteditable', 'true').css({
            border: '1px solid',
        });
    }
}

async function editRecipeIngredient() {
    let recipeID = $('.recipe-details').attr('data-id');
    let ingredientID = $(this).parent().attr('data-id');

    if ($(this).hasClass('fa-save')) {
        $(this).addClass('fa-pencil-alt').removeClass('fa-save');
        $(this)
            .parent()
            .find('.ingredient-amount')
            .attr('contenteditable', 'false')
            .css({
                border: 'none',
                'min-width': '0',
                display: 'inline',
            });
        $(this)
            .parent()
            .find('.ingredient-measurement')
            .attr('contenteditable', 'false')
            .css({
                border: 'none',
                'min-width': '0',
                display: 'inline',
            });
        $(this)
            .parent()
            .find('.ingredient-name')
            .attr('contenteditable', 'false')
            .css({
                border: 'none',
                'min-width': '0',
                display: 'inline',
            });

        // Update the current recipe data.
        // Start by fetching the previous array of ingredients.
        // Then, replace each value in the existing ingredient object with new values.
        await fetch(`http://localhost:3001/recipes/${recipeID}`)
            .then((response) => response.json())
            .then((data) => {
                if (data) {
                    let index = data.ingredients.findIndex((i) => {
                        return i.uuid === ingredientID;
                    });

                    data.ingredients[index].amount = $(this)
                        .parent()
                        .find('.ingredient-amount')
                        .text();
                    data.ingredients[index].measurement = $(this)
                        .parent()
                        .find('.ingredient-measurement')
                        .text();
                    data.ingredients[index].name = $(this)
                        .parent()
                        .find('.ingredient-name')
                        .text();

                    fetch(`http://localhost:3001/recipes/${recipeID}`, {
                        method: 'PATCH',
                        body: JSON.stringify(data),
                        headers: {
                            'Content-type': 'application/json; charset=UTF-8',
                        },
                    })
                        .then((response) => response.json())
                        .then((response) => {
                            console.log(
                                'recipe ingredient edit response:',
                                response
                            );

                            // Add spaces in between the fields.
                            $(this)
                                .parent()
                                .find('.ingredient-amount')
                                .append(' ');
                            $(this)
                                .parent()
                                .find('.ingredient-measurement')
                                .append(' ');
                        })
                        .catch((err) => console.log('Patch error:', err));
                }
            });
    } else {
        $(this).addClass('fa-save').removeClass('fa-pencil-alt');
        $(this)
            .parent()
            .find('.ingredient-amount')
            .attr('contenteditable', 'true')
            .css({
                border: '1px solid',
                'min-width': '20px',
                display: 'inline-block',
            });
        $(this)
            .parent()
            .find('.ingredient-measurement')
            .attr('contenteditable', 'true')
            .css({
                border: '1px solid',
                'min-width': '20px',
                display: 'inline-block',
            });
        $(this)
            .parent()
            .find('.ingredient-name')
            .attr('contenteditable', 'true')
            .css({
                border: '1px solid',
                'min-width': '20px',
                display: 'inline-block',
            });
    }
}

function editIngredientSpecial() {
    let specialID = $(this).parent().attr('data-id');

    if ($(this).hasClass('fa-save')) {
        $(this).addClass('fa-pencil-alt').removeClass('fa-save');
        $(this)
            .parent()
            .find('.special-type')
            .attr('contenteditable', 'false')
            .css({
                border: 'none',
                'min-width': '0',
                display: 'inline',
            });
        $(this)
            .parent()
            .find('.special-title')
            .attr('contenteditable', 'false')
            .css({
                border: 'none',
                'min-width': '0',
                display: 'inline',
            });
        $(this)
            .parent()
            .find('.special-text')
            .attr('contenteditable', 'false')
            .css({
                border: 'none',
                'min-width': '0',
                display: 'inline',
            });

        // Update the current specials data.
        let specialData = {
            type: $(this).parent().find('.special-type').text(),
            title: $(this).parent().find('.special-title').text(),
            text: $(this).parent().find('.special-text').text(),
        };

        fetch(`http://localhost:3001/specials/${specialID}`, {
            method: 'PATCH',
            body: JSON.stringify(specialData),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then((response) => response.json())
            .then((response) => {
                console.log('special edit response:', response);

                // Add spaces in between the fields.
                $(this).parent().find('.special-type').append(' ');
                $(this).parent().find('.special-title').append(' ');
            })
            .catch((err) => console.log('Patch error:', err));
    } else {
        $(this).addClass('fa-save').removeClass('fa-pencil-alt');
        $(this)
            .parent()
            .find('.special-type')
            .attr('contenteditable', 'true')
            .css({
                border: '1px solid',
                'min-width': '20px',
                display: 'inline-block',
            });
        $(this)
            .parent()
            .find('.special-title')
            .attr('contenteditable', 'true')
            .css({
                border: '1px solid',
                'min-width': '20px',
                display: 'inline-block',
            });
        $(this)
            .parent()
            .find('.special-text')
            .attr('contenteditable', 'true')
            .css({
                border: '1px solid',
                'min-width': '20px',
                display: 'inline-block',
            });
    }
}

async function editRecipeDirection() {
    let recipeID = $('.recipe-details').attr('data-id');
    let directionID = $(this).parent().attr('data-id');

    if ($(this).hasClass('fa-save')) {
        $(this).addClass('fa-pencil-alt').removeClass('fa-save');
        $(this)
            .parent()
            .find('.direction-optional')
            .attr('contenteditable', 'false')
            .css({
                border: 'none',
                'min-width': '0',
                display: 'inline',
            });
        $(this)
            .parent()
            .find('.direction-instructions')
            .attr('contenteditable', 'false')
            .css({
                border: 'none',
                'min-width': '0',
                display: 'inline',
            });

        // Update the current recipe data.
        // Start by fetching the previous array of directions.
        // Then, replace each value in the existing direction object with new values.
        await fetch(`http://localhost:3001/recipes/${recipeID}`)
            .then((response) => response.json())
            .then((data) => {
                if (data) {
                    let index = data.directions.findIndex((d) => {
                        return d.uuid === directionID;
                    });

                    data.directions[index].optional =
                        $(this).parent().find('.direction-optional').text() ===
                        '(OPTIONAL)';
                    data.directions[index].instructions = $(this)
                        .parent()
                        .find('.direction-instructions')
                        .text();

                    fetch(`http://localhost:3001/recipes/${recipeID}`, {
                        method: 'PATCH',
                        body: JSON.stringify(data),
                        headers: {
                            'Content-type': 'application/json; charset=UTF-8',
                        },
                    })
                        .then((response) => response.json())
                        .then((response) => {
                            console.log(
                                'recipe direction edit response:',
                                response
                            );

                            // Add spaces in between the fields.
                            $(this)
                                .parent()
                                .find('.diection-optional')
                                .prepend('(')
                                .append('): ');
                        })
                        .catch((err) => console.log('Patch error:', err));
                }
            });
    } else {
        $(this).addClass('fa-save').removeClass('fa-pencil-alt');
        $(this)
            .parent()
            .find('.direction-optional')
            .attr('contenteditable', 'true')
            .css({
                border: '1px solid',
                'min-width': '20px',
                display: 'inline-block',
            });
        $(this)
            .parent()
            .find('.direction-instructions')
            .attr('contenteditable', 'true')
            .css({
                border: '1px solid',
                'min-width': '20px',
                display: 'inline-block',
            });
    }
}
