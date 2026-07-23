export const response = (success, statuscode, message, data = {}) => {
    return {
        success,
        statuscode,
        message,
        data,
    };
};

export const catchError = (error, customMessage) => {
    if (error && error.code === 11000) {
        const key = Object.keys(error.keyPattern || {}).join(', ');
        error.message = `Duplicate value for ${key}. Please use a different ${key}.`;
    }

    let errorObject = {};
    if (process.env.NODE_ENV === 'development') {
        errorObject = {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
        };
    } else {
        errorObject = {
            message: customMessage || 'An error occurred. Please try again later.',
        };
    }

    return response(false, 500, customMessage || error?.message || 'Internal Server Error', errorObject);
};


export const ganarateOtp = () => {
   const otp = Math.floor(100000 + Math.random() * 900000).toString();
   return otp;
}