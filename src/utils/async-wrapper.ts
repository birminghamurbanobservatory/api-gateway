export const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};


// This middleware saves us from having to write try catch statements in our routes. 

// Allowing us to replace:

// app.post('/networks', async (req, res, next) => {
//   if (!req.body.id) {
//     return next(new Error('id required'));
//   }
//   try {
//     const result = await someController.someAction(req.body);
//     return res.json(result);
//   } catch (err) {
//     return next(err);
//   }
// });

// With:

// app.post('/networks', asyncWrapper(async (req, res, next) => {
//   if (!req.body.id) {
//     throw new Error('id required');
//   }
//   const result = await someController.someAction(req.body);
//   return res.json(result);
// }));
