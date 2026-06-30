export const PAGE_SIZE_OPTIONS = [15, 30, 50, 100];

export function getPaginationParams(query = {}) {
  const page = positiveInteger(query.page, 1);
  const requestedPerPage = positiveInteger(query.perPage, 15);
  const perPage = PAGE_SIZE_OPTIONS.includes(requestedPerPage) ? requestedPerPage : 15;

  return {
    limit: perPage,
    offset: (page - 1) * perPage,
    page,
    perPage
  };
}

export function buildPagination({ page, perPage, totalItems, path, query = {} }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(page, totalPages);

  return {
    page: safePage,
    perPage,
    totalItems,
    totalPages,
    options: PAGE_SIZE_OPTIONS,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
    previousUrl: pageUrl(path, query, safePage - 1, perPage),
    nextUrl: pageUrl(path, query, safePage + 1, perPage)
  };
}

export function pageUrl(path, query, page, perPage) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  params.set('page', String(page));
  params.set('perPage', String(perPage));

  return `${path}?${params.toString()}`;
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
