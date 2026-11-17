const calendar = document.querySelector('#calendar');
const welcome = document.querySelector('#welcome');
const enterButton = document.querySelector('#enter-button');
const dialog = document.querySelector('#recipe-dialog');
const recipeContent = document.querySelector('#recipe-content');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let recipes = [];

function makeSnow() {
  if (reducedMotion || typeof gsap === 'undefined') return;
  const snow = document.querySelector('#snow');
  for (let i = 0; i < 45; i++) {
    const flake = document.createElement('span');
    flake.className = 'flake';
    flake.textContent = i % 3 === 0 ? '✳' : '❄';
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.fontSize = `${8 + Math.random() * 15}px`;
    snow.append(flake);
    gsap.fromTo(flake, { y: -30, opacity: 0 }, {
      y: window.innerHeight + 60, x: Math.random() * 90 - 45,
      opacity: .8, duration: 7 + Math.random() * 9,
      delay: Math.random() * -15, repeat: -1, ease: 'none'
    });
  }
}

async function loadRecipes() {
  const status = document.querySelector('#loading-status');

  try {
    const response = await fetch('./recipes.json');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Expected an array of recipes');
    }

    recipes = data.sort((a, b) => a.day - b.day);

    calendar.replaceChildren();

    recipes.forEach(recipe => {
      const tile = document.createElement('div');
      tile.className = 'calendar-tile';

      const inside = document.createElement('div');
      inside.className = 'door-inside';

      if (recipe.image) {
        const image = document.createElement('img');
        image.src = recipe.image;
        image.alt = recipe.name;
        image.className = 'door-image';
        inside.append(image);
      }

      const recipeName = document.createElement('span');
      recipeName.className = 'door-recipe-name';
      recipeName.textContent = recipe.name;

      inside.append(recipeName);

      inside.setAttribute('role', 'button');
      inside.setAttribute('tabindex', '-1');
      inside.setAttribute(
        'aria-label',
        `View recipe for ${recipe.name}`
      );

      inside.addEventListener('click', () => {
        if (tile.classList.contains('opened')) {
          openRecipe(recipe, button);
        }
      });

      inside.addEventListener('keydown', event => {
        if (
            tile.classList.contains('opened') &&
            (event.key === 'Enter' || event.key === ' ')
        ) {
            event.preventDefault();
            openRecipe(recipe, button);
        }
      });

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'door';
      button.textContent = recipe.day;

      button.setAttribute(
        'aria-label',
        `Day ${recipe.day}: open ${recipe.name}`
      );

      button.addEventListener('click', () => {
        revealRecipe(recipe, button, tile);
      });

      tile.append(inside, button);
      calendar.append(tile);
    });

    status.hidden = true;
    enterButton.disabled = false;

  } catch (error) {
    status.textContent =
      'Could not load recipes. Check recipes.json.';

    console.error(error);
  }
}

function revealRecipe(recipe, button, tile) {
  if (tile.classList.contains('opened')) {
    openRecipe(recipe, button);
    return;
  }

  tile.classList.add('opened');
  button.tabIndex = -1;
  insideFocus(tile);

  function insideFocus(tile) {
    const preview = tile.querySelector('.door-inside');
    preview.tabIndex = 0;
  }

  button.setAttribute(
    'aria-label',
    `Day ${recipe.day}: view ${recipe.name}`
  );

  if (reducedMotion || typeof gsap === 'undefined') {
    openRecipe(recipe, button);
    return;
  }

  gsap.to(button, {
    rotationY: -110,
    duration: 0.62,
    ease: 'power2.inOut',
    transformOrigin: 'left center',

    onComplete: () => {
      gsap.delayedCall(0.35, () => {
        openRecipe(recipe, button);
      });
    }
  });
}

function appendList(parent, title, items, ordered = false) {
  const heading = document.createElement('h3');
  heading.textContent = title;
  const list = document.createElement(ordered ? 'ol' : 'ul');
  list.className = 'recipe-list';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    list.append(li);
  });
  parent.append(heading, list);
}

function openRecipe(recipe, button) {
  recipeContent.replaceChildren();

  if (recipe.image) {
    const image = document.createElement('img');

    image.src = recipe.image;
    image.alt = recipe.name;
    image.className = 'recipe-modal-image';

    recipeContent.append(image);
  }

  const meta = document.createElement('p');
  meta.className = 'recipe-meta';
  meta.textContent = `Day ${recipe.day} · ${recipe.category} · ${recipe.prepTime} · ${recipe.difficulty}`;
  const title = document.createElement('h2');
  title.id = 'recipe-title';
  title.className = 'recipe-heading';
  title.textContent = `${recipe.name}`;
  const description = document.createElement('p');
  description.textContent = recipe.description;
  recipeContent.append(meta, title, description);
  appendList(recipeContent, 'Ingredients', recipe.ingredients);
  appendList(recipeContent, 'Instructions', recipe.instructions, true);
  button.classList.add('opened');
  dialog.showModal();
}

function enterCalendar() {
  enterButton.disabled = true;

  if (reducedMotion || typeof gsap === 'undefined') {
    welcome.remove();
    document.querySelector('#calendar-page').focus();
    return;
  }

  gsap.timeline({
    onComplete: () => {
      welcome.remove();
      document.querySelector('#calendar-page').focus();
    }
  })
  .to('.welcome-content', {
    opacity: 0,
    y: -20,
    duration: 0.18
  })
  .to('.panel-left', {
    xPercent: -110,
    rotation: -3,
    duration: 0.62,
    ease: 'power2.inOut'
  }, '-=0.05')
  .to('.panel-right', {
    xPercent: 110,
    rotation: 3,
    duration: 0.62,
    ease: 'power2.inOut'
  }, '<')
  .from('.calendar-tile', {
    opacity: 0,
    y: 18,
    scale: 0.95,
    stagger: 0.012,
    duration: 0.3,
    ease: 'power2.out'
  }, '-=0.4');
}

enterButton.disabled = true;
enterButton.addEventListener('click', enterCalendar);
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
makeSnow();
loadRecipes();
if (!reducedMotion && typeof gsap !== 'undefined') {
  gsap.from('.welcome-content > *', {opacity:0, y:25, duration:.8, stagger:.13, ease:'power2.out'});
}