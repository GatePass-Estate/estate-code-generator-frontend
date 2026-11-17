import { nextLogPage } from '@/src/features/history/utils/logPagination';

const page = (count: number, total: number) => ({ total, items: Array.from({ length: count }) });

describe('nextLogPage', () => {
  it('asks for the next page while fewer items than total are loaded', () => {
    const pages = [page(20, 45)];
    expect(nextLogPage(pages[0], pages)).toBe(2);
  });

  it('stops once every item is loaded', () => {
    const pages = [page(20, 40), page(20, 40)];
    expect(nextLogPage(pages[1], pages)).toBeUndefined();
  });

  it('stops on an empty page even if total says there are more', () => {
    const pages = [page(20, 60), page(0, 60)];
    expect(nextLogPage(pages[1], pages)).toBeUndefined();
  });
});
