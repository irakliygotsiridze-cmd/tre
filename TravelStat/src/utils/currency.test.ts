import { fmtMoney, averagePerDay } from './currency';

test('fmtMoney formats USD', () => expect(fmtMoney(1400, 'USD')).toBe('$1,400'));
test('fmtMoney unknown code falls back to code prefix', () => expect(fmtMoney(50, 'AAA')).toBe('AAA 50'));
test('averagePerDay correct', () => expect(averagePerDay(1400, 10)).toBe(140));
test('averagePerDay handles zero days', () => expect(averagePerDay(1400, 0)).toBe(0));
