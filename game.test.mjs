import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, FISH } from './game.mjs';

test('多鱼加注、单鱼全额撤回和余额限制', () => {
  const g = new Game(0);
  g.bet(0, 100, 1); g.bet(0, 100, 2); g.bet(1, 1000, 3);
  assert.equal(g.balance, 8800);
  g.withdraw(0, 4);
  assert.equal(g.balance, 9000);
  assert.equal(g.bets[1], 1000);
  assert.throws(() => g.bet(1, 10000, 5));
  assert.equal(g.balance, 9000);
});
test('20秒封盘、5秒开奖、2秒展示，含本金且仅结算一次', () => {
  const g = new Game(0, () => 5.5 / 7);
  g.bet(5, 100, 1); g.bet(1, 100, 1);
  assert.throws(() => g.bet(5, 100, 20000));
  assert.throws(() => g.withdraw(5, 20000));
  assert.equal(g.phase, 'drawing');
  g.advance(25000);
  assert.equal(g.phase, 'result');
  assert.equal(g.balance, 10200);
  assert.equal(g.last.payout, 400);
  assert.equal(g.last.net, 200);
  g.advance(26000); assert.equal(g.balance, 10200);
  g.advance(27000); assert.equal(g.phase, 'betting');
  assert.deepEqual(g.bets, Array(7).fill(0));
});
test('七等分随机区间、后台恢复不丢失结算', () => {
  for (let i = 0; i < 7; i++) {
    const g = new Game(0, () => (i + .5) / 7);
    g.bet(i, 100, 1); g.advance(60000);
    assert.equal(g.last.winner, i);
    assert.equal(g.balance, 9900 + FISH[i].multiplier * 100);
    assert.equal(g.phase, 'betting');
  }
});
