const { Client } = require('pg');

exports.handler = async (event) => {
    console.log('Lambda function invoked');

    // Handle CORS preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
            },
            body: '',
        };
    }

    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    let organization_name, new_description, cognito_user_id;

    try {
        // Parse the body of the POST request
        const body = JSON.parse(event.body);
        organization_name = body.organization_name;
        new_description = body.new_description;
        cognito_user_id = body.cognito_user_id;

        if (!organization_name || !new_description || !cognito_user_id) {
            throw new Error('Missing required parameters');
        }

        await client.connect();

        // Call the stored function using SELECT, not CALL
        const query = `SELECT update_organization_description($1, $2, $3)`;
        const res = await client.query(query, [organization_name, new_description, cognito_user_id]);

        // Return success response
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Organization description updated successfully',
            }),
        };

    } catch (err) {
        console.error('Error updating organization description:', err);

        // Handle specific errors if needed, otherwise return a generic error message
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Error updating organization description',
                error: err.message || err,
            }),
        };
    } finally {
        await client.end();
    }
};
