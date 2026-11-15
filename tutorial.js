const steps = [
  { title: 'Start with your store.', description: 'Open ShelfWise and use Search stores to find a location. Select its map pin to see the store’s details, then choose Open store map.', note: 'You can explore store maps as a guest. No installation is required.', image: 'store-selection.jpg', alt: 'ShelfWise city map with a selected store and an Open store map button.', caption: 'Live web app · Store selection. Store data and availability may change.' },
  { title: 'Get your bearings.', description: 'The store map shows labeled departments and an entrance marker. Drag to move around, use the plus and minus controls to zoom, or fit the floor back into view.', note: 'If a store has multiple floors, use the floor selector. The map also shows when the layout was last updated.', image: 'store-map.jpg', alt: 'The ShelfWise store layout with department labels, entrance marker, floor selector, and zoom controls.', caption: 'Live web app · Store layout with labeled departments.' },
  { title: 'Look up an item.', description: 'Use Search products, groups, or regions at the top of the map. A search such as “milk” shows matching products. Select the result you want, or choose Products to browse.', note: 'Check the product name and store carefully. Search results can include several similar items.', image: 'product-search.jpg', alt: 'ShelfWise search results for milk, showing product names, departments, and prices.', caption: 'Live web app · Product search results for “milk”.' },
  { title: 'See where it belongs.', description: 'Selecting a search result places its location on the store map. Look for the highlighted department and product marker, then select the marker to explore the item’s information.', note: 'The example locates milk in Dairy. Product information and the contents of a store map may change.', image: 'product-location.jpg', alt: 'A milk search result located in the Dairy department on the ShelfWise map.', caption: 'Live web app · A selected product located in the Dairy department.' },
  { title: 'Keep your list with you.', description: 'Choose Guest Account to sign in or create an account. Then open List from the sidebar to use your shopping list. ShelfWise keeps lists separate for each store map.', note: 'Guest browsing does not require an account. Sign-in is needed for a saved shopping list.', image: 'store-map.jpg', alt: 'ShelfWise’s map interface with the List navigation item and Guest Account control.', caption: 'Live web app · Use List and the account control to continue with a saved shopping list.' },
];
let currentStep = 0;
const tabs = [...document.querySelectorAll('[data-step]')];
const previous = document.querySelector('#previous-step');
const next = document.querySelector('#next-step');

function selectStep(index, focus = false) {
  currentStep = Math.max(0, Math.min(steps.length - 1, index));
  const step = steps[currentStep];
  document.querySelector('#step-title').textContent = step.title;
  document.querySelector('#step-description').textContent = step.description;
  document.querySelector('#step-note').textContent = step.note;
  document.querySelector('#step-count').textContent = `${String(currentStep + 1).padStart(2, '0')} / 05`;
  const screenshot = document.querySelector('#guide-screenshot');
  screenshot.src = `assets/${step.image}`;
  screenshot.alt = step.alt;
  document.querySelector('#guide-caption').textContent = step.caption;
  document.querySelector('#walkthrough').setAttribute('aria-labelledby', `step-tab-${currentStep}`);
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === currentStep));
    tab.tabIndex = i === currentStep ? 0 : -1;
  });
  previous.disabled = currentStep === 0;
  next.textContent = currentStep === steps.length - 1 ? 'Start again ↺' : 'Next step →';
  if (focus) tabs[currentStep].focus({ preventScroll: true });
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectStep(i));
  tab.addEventListener('keydown', (event) => {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (direction || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      selectStep(event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : (currentStep + direction + steps.length) % steps.length, true);
    }
  });
});
previous.addEventListener('click', () => selectStep(currentStep - 1));
next.addEventListener('click', () => selectStep(currentStep === steps.length - 1 ? 0 : currentStep + 1));
