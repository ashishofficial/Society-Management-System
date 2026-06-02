export function attachSocietyContext(req, _res, next) {
  const headerSociety = req.headers['x-society-id'];
  const societyId = typeof headerSociety === 'string' && headerSociety.trim() ? headerSociety.trim() : 'default';
  req.societyId = societyId;
  next();
}
