export const CARD_COUNT = 4;

export type Round = Readonly<
  | { phase: 'selecting'; winningIndex: number; selectedIndex: null }
  | { phase: 'result'; winningIndex: number; selectedIndex: number }
>;

export function createRound(random: () => number = Math.random): Round {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random value must be in [0, 1).');
  }
  return { phase: 'selecting', winningIndex: Math.floor(value * CARD_COUNT), selectedIndex: null };
}

export function selectCard(round: Round, index: number): Round {
  if (round.phase !== 'selecting') return round;
  if (!Number.isInteger(index) || index < 0 || index >= CARD_COUNT) {
    throw new RangeError('Invalid card index.');
  }
  return { phase: 'result', winningIndex: round.winningIndex, selectedIndex: index };
}

export function isWinner(round: Round): boolean {
  return round.phase === 'result' && round.selectedIndex === round.winningIndex;
}
