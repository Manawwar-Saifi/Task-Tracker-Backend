/**
 * Async handler to catch errors in async controllers
 * Avoids try/catch blocks everywhere
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
