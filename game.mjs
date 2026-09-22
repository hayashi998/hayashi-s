export const FISH = [
  { name: '美人鱼', icon: '🧜‍♀️', multiplier: 100, color: '#d190f8' },
  { name: '大章鱼', icon: '🐙', multiplier: 50, color: '#f8879c' },
  { name: '大螃蟹', icon: '🦀', multiplier: 25, color: '#ffac6d' },
  { name: '小海龟', icon: '🐢', multiplier: 11, color: '#8cd999' },
  { name: '小青虾', icon: '🦐', multiplier: 7, color: '#afadff' },
  { name: '小丑鱼', icon: '🐠', multiplier: 4, color: '#ffd474' },
  { name: '水母', icon: '🪼', multiplier: 2, color: '#8fdde9' },
];
// Relative weights: all seven outcomes initially have probability 1/7.
export const WEIGHTS = [1, 1, 1, 1, 1, 1, 1];
export class Game {
  constructor(now = Date.now(), random = Math.random) {
    this.balance = 10000; this.bets = Array(7).fill(0);
    this.phase = 'betting'; this.deadline = now + 20000;
    this.round = 1; this.history = []; this.last = null; this.random = random;
  }
  advance(now) {
    if (now < this.deadline) return;
    if (this.phase === 'betting') {
      let target = this.random() * WEIGHTS.reduce((a, b) => a + b, 0);
      this.winner = WEIGHTS.length - 1;
      for (let i = 0; i < WEIGHTS.length; i++) {
        target -= WEIGHTS[i]; if (target < 0) { this.winner = i; break; }
      }
      this.phase = 'drawing'; this.deadline += 5000;
    }
    if (now >= this.deadline && this.phase === 'drawing') {
      const total = this.bets.reduce((a, b) => a + b, 0);
      const payout = this.bets[this.winner] * FISH[this.winner].multiplier;
      this.balance += payout;
      this.last = { winner: this.winner, total, payout, net: payout - total };
      this.history.unshift(this.winner); this.history = this.history.slice(0, 12);
      this.phase = 'result'; this.deadline += 2000;
    }
    if (now >= this.deadline && this.phase === 'result') {
      this.phase = 'betting'; this.deadline = now + 20000;
      this.bets.fill(0); this.round++;
    }
  }
  check(now) {
    this.advance(now);
    if (this.phase !== 'betting') throw new Error('已封盘，请等待下一局');
  }
  bet(index, amount, now = Date.now()) {
    this.check(now);
    if (!Number.isInteger(index) || index < 0 || index >= 7 || ![100, 1000, 10000].includes(amount)) throw new Error('无效的投入');
    if (this.balance < amount) throw new Error('珍珠不足，去补充一点吧');
    this.balance -= amount; this.bets[index] += amount;
  }
  withdraw(index, now = Date.now()) {
    this.check(now);
    if (!Number.isInteger(index) || index < 0 || index >= 7) throw new Error('无效的鱼种');
    this.balance += this.bets[index]; this.bets[index] = 0;
  }
}
