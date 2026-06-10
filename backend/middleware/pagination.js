// ─── Pagination Helper ───
function getPaginationParams(req, defaultLimit = 20, maxLimit = 100) {
  let offset = Math.max(0, parseInt(req.query.offset) || 0);
  let limit = Math.max(1, Math.min(parseInt(req.query.limit) || defaultLimit, maxLimit));
  
  return { offset, limit };
}

function buildPaginationResponse(data, total, offset, limit) {
  return {
    data,
    pagination: {
      offset,
      limit,
      total,
      hasMore: offset + limit < total,
    },
  };
}

module.exports = { getPaginationParams, buildPaginationResponse };
