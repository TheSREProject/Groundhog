BEGIN
    -- Check if the caller has the required permission
    IF NOT EXISTS (
        SELECT 1
        FROM roles r
        JOIN permissions p ON p.permission_id = ANY (r.permission_id)
        WHERE r.role_name = v_caller_role_name
        AND p.permission_name = 'create_user'
    ) THEN
        RAISE EXCEPTION 'Permission denied: Missing create_user permission for role %', v_caller_role_name;
    END IF;

    -- Check if the user already exists
    IF EXISTS (SELECT 1 FROM users WHERE users.cognito_user_id = v_cognito_user_id) THEN
        RAISE NOTICE 'User already exists: %', v_cognito_user_id;
        RETURN QUERY 
        SELECT users.user_id, users.name, users.email, users.cognito_user_id
        FROM users 
        WHERE users.cognito_user_id = v_cognito_user_id;
    ELSE
        -- Insert the new user
        INSERT INTO users (name, email, cognito_user_id)
        VALUES (v_name, v_email, v_cognito_user_id)
        RETURNING users.user_id, users.name, users.email, users.cognito_user_id
        INTO STRICT user_id, name, email, cognito_user_id;

        -- Return the inserted user
        RETURN QUERY 
        SELECT user_id, name, email, cognito_user_id;
    END IF;
END;
