/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.CrossOrigin = async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  await next();
}
