const apiResponse = (success, message, data = null, statusCode = 200) => {
  const response = {
    success,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

module.exports = apiResponse;
