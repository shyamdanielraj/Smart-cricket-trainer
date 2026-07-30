export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode && Number.isFinite(err.statusCode) ? err.statusCode : 500;
  const message =
    err.publicMessage ||
    err.message ||
    (typeof err === 'string' ? err : String(err?.cause || err)) ||
    'Server error';
  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}

