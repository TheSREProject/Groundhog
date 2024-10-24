CREATE OR REPLACE FUNCTION create_organization(
    v_organization_name VARCHAR,
    v_description VARCHAR,
    v_cognito_user_id VARCHAR,
    v_name VARCHAR,
    v_email VARCHAR,
    v_caller_role_name VARCHAR
)
RETURNS TABLE (organization_name VARCHAR, user_email VARCHAR, role_name VARCHAR) AS $$
DECLARE
    org_id INTEGER;
    usr_id INTEGER;
BEGIN
    -- Check if the caller has the required permission
    IF NOT check_user_permission(v_cognito_user_id, 'create_organization', v_caller_role_name) THEN
        RAISE EXCEPTION 'Permission denied: Missing create_organization permission for user % or role %', v_cognito_user_id, v_caller_role_name;
    END IF;

    -- Check if the organization already exists
    SELECT o.organization_id INTO org_id
    FROM organizations o
    WHERE o.name = v_organization_name;

    IF org_id IS NULL THEN
        -- If the organization doesn't exist, insert it
        INSERT INTO organizations (name, description)
        VALUES (v_organization_name, v_description)
        RETURNING organizations.organization_id INTO org_id;
    ELSE
        RAISE NOTICE 'Organization already exists: %', v_organization_name;
    END IF;

    -- Check if the user already exists in the users table
    SELECT u.user_id INTO usr_id
    FROM users u
    WHERE u.cognito_user_id = v_cognito_user_id;

    IF usr_id IS NULL THEN
        -- Insert the new user into the users table
        INSERT INTO users (name, email, cognito_user_id)
        VALUES (v_name, v_email, v_cognito_user_id)
        RETURNING users.user_id INTO usr_id;
    ELSE
        RAISE NOTICE 'User already exists: %', v_cognito_user_id;
    END IF;

    -- Check if the user already has a role in this organization
    IF NOT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = usr_id AND ur.organization_id = org_id
    ) THEN
        -- Assign the "Organization Owner" role to the user in user_roles table
        INSERT INTO user_roles (user_id, organization_id, role_id, cognito_user_id)
        VALUES (
            usr_id, 
            org_id, 
            (SELECT r.role_id FROM roles r WHERE r.role_name = 'Organization_Owner'), 
            v_cognito_user_id
        );
    ELSE
        RAISE NOTICE 'User already has a role in the organization';
    END IF;

    -- Return the organization name, user email, and role name
    RETURN QUERY
    SELECT o.name, u.email, 'Organization_Owner'::VARCHAR
    FROM organizations o
    JOIN users u ON u.cognito_user_id = v_cognito_user_id
    WHERE o.organization_id = org_id;

END;
$$ LANGUAGE plpgsql;
