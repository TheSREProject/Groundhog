const axios = require('axios');

exports.handler = async (event) => {
    const token = event.body ? JSON.parse(event.body).token : event.token;

    if (!token) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*", // Allow all origins
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET" // Add allowed methods
            },
            body: JSON.stringify({
                success: false,
                message: 'reCAPTCHA token is missing',
            }),
        };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    try {
        const response = await axios.post(verifyUrl);
        const data = response.data;

        console.log('reCAPTCHA API Response:', data);

        if (!data.success) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                body: JSON.stringify({
                    success: false,
                    message: 'Failed to verify reCAPTCHA',
                }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify({
                success: true,
                message: 'reCAPTCHA verified successfully',
            }),
        };
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify({
                success: false,
                message: 'Internal Server Error',
            }),
        };
    }
};
