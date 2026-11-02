import { CARD_COUNT, createRound, isWinner, selectCard } from './game.js';

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element: ${selector}`);
  return found;
}

const selecting = element<HTMLElement>('#selecting');
const result = element<HTMLElement>('#result');
const grid = element<HTMLElement>('#cards');
const heading = element<HTMLHeadingElement>('#result-title');
const icon = element<HTMLElement>('#result-icon');
const message = element<HTMLElement>('#result-message');
const retry = element<HTMLButtonElement>('#retry');
let round = createRound();

const cards = Array.from({ length: CARD_COUNT }, (_, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'card';
  button.setAttribute('aria-label', `${index + 1}まいめの カード`);
  const symbol = document.createElement('span');
  symbol.textContent = '★';
  symbol.setAttribute('aria-hidden', 'true');
  button.append(symbol);
  button.addEventListener('click', () => {
    if (round.phase !== 'selecting') return;
    round = selectCard(round, index);
    cards.forEach((card) => { card.disabled = true; });
    const won = isWinner(round);
    heading.textContent = won ? 'あたり！' : 'ざんねん！';
    icon.textContent = won ? '🌟' : '🌱';
    message.textContent = won ? 'やったね！ みつけたね！' : 'つぎは みつかるかな？';
    result.dataset.outcome = won ? 'win' : 'lose';
    selecting.hidden = true;
    result.hidden = false;
    heading.focus();
  });
  grid.append(button);
  return button;
});

retry.addEventListener('click', () => {
  round = createRound();
  cards.forEach((card) => { card.disabled = false; });
  result.hidden = true;
  selecting.hidden = false;
  cards[0]?.focus();
});
