import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CARD_COUNT, createRound, selectCard, isWinner } from '../src/game.ts';

test('all four positions can win, with exactly one winning selection per round', () => {
  for (let position = 0; position < CARD_COUNT; position++) {
    const round = createRound(() => (position + 0.5) / CARD_COUNT);
    assert.equal(round.phase, 'selecting');
    assert.equal(round.selectedIndex, null);
    assert.equal(isWinner(round), false);
    const results = Array.from({ length: CARD_COUNT }, (_, i) => isWinner(selectCard(round, i)));
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(results[position], true);
  }
});

test('selection is final, including repeated taps on another card', () => {
  const round = createRound(() => 0);
  const result = selectCard(round, 1);
  assert.equal(result.phase, 'result');
  assert.equal(isWinner(result), false);
  assert.equal(selectCard(result, 0), result);
  assert.equal(round.phase, 'selecting');
});

test('replay draws again and permits the previous winning position', () => {
  const values = [0, 0.99, 0.99];
  let calls = 0;
  const random = () => values[calls++];
  const rounds = Array.from({ length: 3 }, () => createRound(random));
  assert.deepEqual(rounds.map(r => r.winningIndex), [0, 3, 3]);
  assert.equal(calls, 3);
  assert.notEqual(rounds[1], rounds[2]);
});

test('random boundaries are valid and invalid inputs are rejected', () => {
  assert.equal(createRound(() => 0).winningIndex, 0);
  assert.equal(createRound(() => 1 - Number.EPSILON).winningIndex, 3);
  for (const value of [-1, 1, NaN, Infinity]) {
    assert.throws(() => createRound(() => value), RangeError);
  }
  for (const index of [-1, 4, 0.5, NaN]) {
    assert.throws(() => selectCard(createRound(), index), RangeError);
  }
});
