/** Next page number while the pages loaded so far are fewer than the response ``total``. */
export function nextLogPage(
  lastPage: { total: number; items: unknown[] },
  allPages: { items: unknown[] }[]
): number | undefined {
  const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
  if (lastPage.items.length === 0 || loaded >= lastPage.total) return undefined;
  return allPages.length + 1;
}
