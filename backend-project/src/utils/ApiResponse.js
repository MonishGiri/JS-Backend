// Define a class to standardize API responses
class ApiResponse {
    /**
     * Constructor to initialize an API response object
     * @param {number} statusCode - The HTTP status code (e.g., 200, 404, 500)
     * @param {any} data - The response data (can be an object, array, or any value)
     * @param {string} message - A message describing the response (default: "Success")
     */
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode; // Store the HTTP status code
        this.data = data;             // Store the response data
        this.message = message;       // Store the response message (default is "Success")

        // Determine success based on the status code
        // If statusCode is below 400, it's a success; otherwise, it's a failure
        this.success = statusCode < 400;
    }
}

// Export the class so it can be used in other modules
export { ApiResponse };
