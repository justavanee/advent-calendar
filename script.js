const calendar = document.querySelector('#calendar');
const welcome = document.querySelector('#welcome');
const enterButton = document.querySelector('#enter-button');
const dialog = document.querySelector('#recipe-dialog');
const recipeContent = document.querySelector('#recipe-content');

const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

let recipes = [];
const mosaicLayout = [
  [1, 1, 2, 2],
  [1, 3, 3, 4],
  [1, 7, 3, 2],
  [1, 9, 3, 2],
  [1, 11, 3, 2],
  [3, 1, 1, 2],
  [4, 1, 3, 2],
  [4, 3, 2, 4],
  [4, 7, 3, 1],
  [4, 8, 3, 3],
  [4, 11, 3, 2],
  [6, 3, 1, 4],
  [7, 1, 2, 3],
  [7, 4, 2, 1],
  [7, 5, 2, 2],
  [7, 7, 1, 4],
  [7, 11, 2, 2],
  [8, 7, 3, 4],
  [9, 1, 4, 2],
  [9, 3, 4, 2],
  [9, 5, 4, 2],
  [9, 11, 1, 2],
  [10, 11, 3, 2],
  [11, 7, 2, 4]
];

const fixedDayOrder = [
  14, 3, 21, 8, 1, 17,
  6, 23, 11, 5, 19, 2,
  24, 9, 16, 4, 12, 7,
  20, 15, 10, 22, 13, 18
];

function makeSnow() {
  if (reducedMotion || typeof gsap === 'undefined') {
    return;
  }

  const snow = document.querySelector('#snow');

  for (let i = 0; i < 45; i++) {
    const flake = document.createElement('span');

    flake.className = 'flake';
    flake.textContent = i % 3 === 0 ? '✳' : '❄';

    flake.style.left = `${Math.random() * 100}%`;
    flake.style.fontSize = `${8 + Math.random() * 15}px`;

    snow.append(flake);

    gsap.fromTo(
      flake,
      {
        y: -30,
        opacity: 0
      },
      {
        y: window.innerHeight + 60,
        x: Math.random() * 90 - 45,
        opacity: 0.8,
        duration: 7 + Math.random() * 9,
        delay: Math.random() * -15,
        repeat: -1,
        ease: 'none'
      }
    );
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

    if (data.length !== mosaicLayout.length) {
      throw new Error('The calendar requires exactly 24 recipes');
    }

    recipes = [...data].sort((a, b) => a.day - b.day);

    calendar.replaceChildren();

    const orderedRecipes = fixedDayOrder.map(day =>
      recipes.find(recipe => recipe.day === day)
    );

    orderedRecipes.forEach((recipe, index) => {
      const tile = document.createElement('div');
      tile.className = 'calendar-tile';

      const [row, column, rowSpan, columnSpan] =
        mosaicLayout[index];

      tile.style.gridRow = `${row} / span ${rowSpan}`;
      tile.style.gridColumn = `${column} / span ${columnSpan}`;

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

      inside.addEventListener('click', () => {
        if (
          tile.classList.contains('opened') &&
          !tile.classList.contains('opening')
        ) {
          openRecipe(recipe, inside);
        }
      });

      inside.addEventListener('keydown', event => {
        if (
          tile.classList.contains('opened') &&
          !tile.classList.contains('opening') &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          openRecipe(recipe, inside);
        }
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
  if (tile.classList.contains('opening')) {
    return;
  }

  if (tile.classList.contains('opened')) {
    openRecipe(recipe, tile.querySelector('.door-inside'));
    return;
  }

  tile.classList.add('opening');

  const preview = tile.querySelector('.door-inside');

  function finishOpening() {
    tile.classList.remove('opening');
    tile.classList.add('opened');

    button.tabIndex = -1;
    preview.tabIndex = 0;

    openRecipe(recipe, preview);
  }

  if (reducedMotion || typeof gsap === 'undefined') {
    button.style.transform = 'rotateY(-110deg)';
    finishOpening();
    return;
  }

  tile.style.zIndex = '5';

  gsap.to(button, {
    rotationY: -110,
    duration: 0.62,
    ease: 'power2.inOut',
    transformOrigin: 'left center',

    onComplete: () => {
      gsap.delayedCall(0.35, finishOpening);
    }
  });
}

function appendList(parent, title, items, ordered = false) {
  const heading = document.createElement('h3');
  heading.textContent = title;

  const list = document.createElement(
    ordered ? 'ol' : 'ul'
  );

  list.className = 'recipe-list';

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    list.append(li);
  });

  parent.append(heading, list);
}

function openRecipe(recipe, focusTarget) {
  if (dialog.open) {
    return;
  }

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

  meta.textContent =
    `Day ${recipe.day} · ${recipe.category} · ` +
    `${recipe.prepTime} · ${recipe.difficulty}`;

  const title = document.createElement('h2');
  title.id = 'recipe-title';
  title.className = 'recipe-heading';
  title.textContent = recipe.name;

  const description = document.createElement('p');
  description.textContent = recipe.description;

  recipeContent.append(meta, title, description);

  appendList(
    recipeContent,
    'Ingredients',
    recipe.ingredients
  );

  appendList(
    recipeContent,
    'Instructions',
    recipe.instructions,
    true
  );

  dialog.showModal();

  dialog.addEventListener(
    'close',
    () => {
      if (focusTarget && focusTarget.isConnected) {
        focusTarget.focus();
      }
    },
    { once: true }
  );
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

document
  .querySelector('#close-dialog')
  .addEventListener('click', () => {
    dialog.close();
  });

makeSnow();
loadRecipes();

if (!reducedMotion && typeof gsap !== 'undefined') {
  gsap.from('.welcome-content > *', {
    opacity: 0,
    y: 25,
    duration: 0.8,
    stagger: 0.13,
    ease: 'power2.out'
  });
}