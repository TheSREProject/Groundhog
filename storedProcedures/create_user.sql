CREATE OR REPLACE FUNCTION create_user(
    v_name VARCHAR,
    v_email VARCHAR,
    v_cognito_user_id VARCHAR,
    v_caller_role_name VARCHAR
)
RETURNS TABLE (user_id INTEGER, name VARCHAR, email VARCHAR, cognito_user_id VARCHAR) AS $$
DECLARE
    usr_id INTEGER;
BEGIN
    -- Check if the caller role has the required permission (Lambda role)
    IF v_caller_role_name = 'Lambda' THEN
        -- Check if the role Lambda has the permission to create a user
        IF NOT check_user_permission(NULL, 'create_user', v_caller_role_name) THEN
            RAISE EXCEPTION 'Permission denied: Missing create_user permission for role %', v_caller_role_name;
        END IF;
    ELSE
        -- For non-Lambda roles, we check the permission for the cognito_user_id
        IF NOT check_user_permission(v_cognito_user_id, 'create_user') THEN
            RAISE EXCEPTION 'Permission denied: Missing create_user permission for user %', v_cognito_user_id;
        END IF;
    END IF;

    -- Check if the user already exists in the users table
    SELECT u.user_id INTO usr_id
    FROM users u
    WHERE u.cognito_user_id = v_cognito_user_id;

    -- If the user already exists, return the existing user details
    IF usr_id IS NOT NULL THEN
        RAISE NOTICE 'User already exists: %', v_cognito_user_id;
        RETURN QUERY 
        SELECT u.user_id, u.name, u.email, u.cognito_user_id
        FROM users u
        WHERE u.cognito_user_id = v_cognito_user_id;
    ELSE
        -- Insert the new user into the users table
        INSERT INTO users (name, email, cognito_user_id)
        VALUES (v_name, v_email, v_cognito_user_id)
        RETURNING users.user_id, users.name, users.email, users.cognito_user_id
        INTO STRICT usr_id, v_name, v_email, v_cognito_user_id;

        -- Return the inserted user details
        RETURN QUERY 
        SELECT u.user_id, u.name, u.email, u.cognito_user_id
        FROM users u
        WHERE u.user_id = usr_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
