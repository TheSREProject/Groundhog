const { Client } = require('pg');

exports.handler = async (event) => {
    console.log('Lambda function triggered to fetch users by organization');

    // Handle OPTIONS requests for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        console.log('Handling OPTIONS request for CORS preflight');
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ message: 'CORS preflight successful' }),
        };
    }

    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        // Log the event to see the incoming data
        console.log('Received event:', JSON.stringify(event, null, 2));

        // Extract organization_name and cognito_user_id from the request body or query parameters
        const { organization_name, cognito_user_id } = event.body ? JSON.parse(event.body) : event.queryStringParameters;

        if (!organization_name || !cognito_user_id) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ message: 'Missing organization_name or cognito_user_id in the request' }),
            };
        }

        await client.connect();
        console.log('Connected to the database');

        // Call the stored procedure to get users by organization
        const query = `
            SELECT * FROM get_users_by_organization($1, $2);
        `;
        const result = await client.query(query, [organization_name, cognito_user_id]);

        if (result.rows.length === 0) {
            console.log('No users found for this organization');
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ message: 'No users found for this organization', users: [] }),
            };
        }

        const users = result.rows.map(user => ({
            user_id: user.user_id,
            cognito_user_id: user.cognito_user_id,
            email: user.email,
            role_id: user.role_id,
            role_name: user.role_name,
        }));

        console.log('Retrieved users:', users);

        await client.end();
        console.log('Database connection closed');

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Users retrieved successfully',
                users,
            }),
        };

    } catch (error) {
        console.error('Error fetching users:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Error fetching users', error: error.message }),
        };
    }
};
