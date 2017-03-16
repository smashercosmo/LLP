const $form = document.querySelector('form');
const $loadButton = document.querySelector('.form__load-button');
const $input = document.querySelector('textarea');
const $content = document.querySelector('.content');
const $pages = document.querySelector('.pages');
const $contentText = document.querySelector('.content__text');
const $fontSizeControls = document.querySelector('.controls__control');
const $characterMeasurer = document.querySelector('.content__character-measurer');
const $contentMeasurer = document.querySelector('.content__measurer');

let value = '';
let pages = [];

/**
 * Calculates the maximum number of characters, that fit within a page
 *
 * @return {Number}
 */
function measureContentInCharacters() {
  const characterHeight = $characterMeasurer.clientHeight;
  const characterWidth = $characterMeasurer.clientWidth;
  const contentHeight = $contentText.clientHeight;
  const contentWidth = $contentText.clientWidth;
  const charactersInLine = Math.ceil(contentWidth / characterWidth);
  const charactersInColumn = Math.ceil(contentHeight / characterHeight);
  return charactersInLine * charactersInColumn;
}

/**
 * Appends text to contentMeasurer
 *
 * @param {String[]} words
 */
function appendTextToContentMeasurer(words) {
  const fragment = document.createDocumentFragment();
  $contentMeasurer.textContent = '';

  words.forEach(word => {
    const text = document.createTextNode(word);
    fragment.appendChild(text);
  });

  $contentMeasurer.appendChild(fragment);
}

/**
 * Removes nodes from contentMeasurer,
 * until its height matches content's height
 */
function reduceContentMeasurer() {
  while($contentMeasurer.clientHeight > $contentText.clientHeight) {
    $contentMeasurer.removeChild(
      $contentMeasurer.childNodes[$contentMeasurer.childNodes.length - 1]
    );
  }
}

/**
 * Gets number of words per page
 *
 * @param {String[]} words
 * @return {Number}
 */
function getAmountOfWordsForThePage(words) {
  appendTextToContentMeasurer(words);
  reduceContentMeasurer();
  const wordsNumber = $contentMeasurer.childNodes.length;
  $contentMeasurer.textContent = '';
  return wordsNumber;
}

/**
 * Splits text by pages
 *
 * @return {Object[]}
 */
function splitTextByPages() {
  const maxCharactersPerPage = measureContentInCharacters();
  const pages = [];
  let leftOver = value;
  let start = 0;

  do {
    // maximum amount of text per page
    const chunk = leftOver.slice(0, maxCharactersPerPage);

    // saving leading spaces
    const leadingSpaces = (chunk.match(/^\s+/) || ['']);

    // text without leading and trailing spaces
    const trimmedChunk = chunk.trim();

    // removing line breaks
    // http://stackoverflow.com/questions/10805125/how-to-remove-all-line-breaks-from-a-string
    const oneLineChunk = trimmedChunk.replace(/\r?\n|\r/g, ' ');

    // removing extra spaces
    const normalizedChunk = oneLineChunk.replace(/\s+/g, ' ');

    // array of words and spaces of original length
    const wordsAndOriginalSpaces = oneLineChunk.split(/(\s+)/);

    // array of words and single spaces
    const wordsAndSpaces = normalizedChunk.split(/(\s)/);

    // number of words per page
    const wordsAmount = getAmountOfWordsForThePage(wordsAndSpaces);

    // original chunk sliced by a number of words per page
    const originalChunkSliced = leadingSpaces
      .concat(wordsAndOriginalSpaces.slice(0, wordsAmount))
      .join('');

    const page = {start, end: start + originalChunkSliced.length};
    pages.push(page);
    start = page.end;
    leftOver = leftOver.slice(originalChunkSliced.length);
  } while (leftOver);

  return pages;
}

/**
 * Renders page buttons
 */
function renderPageButtons() {
  const fragment = document.createDocumentFragment();

  while($pages.children.length) {
    const childToRemove = $pages.children[$pages.children.length - 1];
    $pages.removeChild(childToRemove);
  }

  pages.forEach((page, index) => {
    const button = document.createElement('button');
    const text = document.createTextNode(String(index + 1));
    button.setAttribute('data-page', String(index));
    button.appendChild(text);
    fragment.appendChild(button);
  });

  $pages.appendChild(fragment);
}

/**
 * Renders text content for specific page
 *
 * @param {Number} pageNumber
 */
function appendContent(pageNumber) {
  const page = pages[pageNumber];

  // TODO probably we need to keep text in pages array to avoid double job
  const words = value
    .slice(page.start, page.end)
    .trim()
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/(\s+)/);

  const fragment = document.createDocumentFragment();

  $contentText.textContent = '';

  words.forEach(word => {
    const span = document.createElement('span');
    const text = document.createTextNode(word);
    span.appendChild(text);
    fragment.appendChild(span);
  });

  $contentText.appendChild(fragment);
}

/** ------------------------------------ EVENT HANDLERS ------------------------------------ **/

/**
 * Handler responsible for loading example text
 */
function loadExampleText(event) {
  event.preventDefault();
  $input.value = exampleText;
}

/**
 * Handler responsible for switching pages
 *
 * @param {Object} event
 */
function switchPage(event) {
  const button = event.target;
  const page = button.dataset.page;
  appendContent(page)
}

/**
 * Handler, responsible for changing content's font size
 *
 * @param {Object} event
 */
function changeFontSize(event) {
  const button = event.target;
  const fontSize = button.dataset.size;
  const style = `content--style-font-size-${fontSize}`;

  const classes = Array.prototype.slice.call($content.classList);
  const classesToRemove = classes.filter(
    className => className.match(/content--style-font-size-/)
  );

  $content.classList.remove.apply($content.classList, classesToRemove);
  $content.classList.add(style);

  // TODO user should stay on the same page
  pages = splitTextByPages();
  renderPageButtons();
  appendContent(0);
}

/**
 * Handler, responsible for submitting text
 *
 * @param {Object} event
 */
function submitText(event) {
  event.preventDefault();
  value = $input.value;
  pages = splitTextByPages();
  renderPageButtons();
  appendContent(0);
  $input.value = '';
}

/** ---------------------------------- ADD EVENT LISTENERS ---------------------------------- **/

$form.addEventListener('submit', submitText, false);

$pages.addEventListener('click', switchPage, false);

$loadButton.addEventListener('click', loadExampleText, false);

$fontSizeControls.addEventListener('click', changeFontSize, false);
