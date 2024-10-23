CREATE OR REPLACE FUNCTION get_users_by_organization(
    v_organization_name VARCHAR,
    v_cognito_user_id VARCHAR
)
RETURNS TABLE (
    user_id INTEGER,
    cognito_user_id VARCHAR,
    email VARCHAR,
    role_id INTEGER,
    role_name VARCHAR
) AS $$
DECLARE
    org_id INTEGER;
BEGIN
    -- Check if the caller has the required permission 'get_users_by_organization'
    IF NOT EXISTS (
        SELECT 1
        FROM roles r
        JOIN user_roles ur ON ur.role_id = r.role_id
        JOIN permissions p ON p.permission_id = ANY (r.permission_id)
        WHERE ur.cognito_user_id = v_cognito_user_id
        AND p.permission_name = 'get_users_by_organization'
    ) THEN
        RAISE EXCEPTION 'Permission denied: Missing get_users_by_organization permission for user %', v_cognito_user_id;
    END IF;

    -- Retrieve the organization_id using the organization_name
    SELECT o.organization_id
    INTO org_id
    FROM organizations o
    WHERE o.name = v_organization_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization % not found', v_organization_name;
    END IF;

    -- Return the users associated with the organization_id
    RETURN QUERY
    SELECT u.user_id, u.cognito_user_id, u.email, ur.role_id, r.role_name
    FROM user_roles ur
    JOIN users u ON ur.user_id = u.user_id
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.organization_id = org_id;
END;
$$ LANGUAGE plpgsql;
