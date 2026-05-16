function notFound(req, res, next) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

function errorHandler(err, req, res, _next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const payload = { error: err.message || 'Server error' };
  if (err.name === 'ValidationError' && err.errors) {
    payload.details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
  }
  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
