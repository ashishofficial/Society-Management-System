// Strips MongoDB operator injection vectors from incoming request data.
//
// Express parses query strings with `qs`, so `?month[$ne]=` arrives as an object `{ $ne: '' }`.
// Dropped into a Mongoose filter, that becomes operator injection ($ne/$gt/$regex/$where).
// This middleware recursively removes any key starting with `$` or containing `.` from
// req.body, req.query and req.params — neutralizing the whole class without a dependency.

function scrub(value) {
  if (Array.isArray(value)) {
    value.forEach(scrub);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        scrub(value[key]);
      }
    }
  }
  return value;
}

export function sanitizeMongo(req, _res, next) {
  if (req.body) scrub(req.body);
  if (req.query) scrub(req.query);
  if (req.params) scrub(req.params);
  next();
}
