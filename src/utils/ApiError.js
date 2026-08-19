class ApiError extends Error { //Error- Builtin Class
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message)
    this.statusCode = statusCode
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors;

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor) //this.constructor: the trace of the exact location.
    }
  }
}

export {ApiError}