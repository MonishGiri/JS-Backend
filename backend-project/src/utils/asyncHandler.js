// Higher-order function to handle async errors in Express middleware
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err)); // Passes errors to Express error-handling middleware
    };
};

export { asyncHandler };

// Alternative approach using try-catch:
// const asyncHandlerAlternative = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message, // Sends error message as a response
//         });
//     }
// };
