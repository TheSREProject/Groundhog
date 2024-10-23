CREATE OR REPLACE FUNCTION get_user_organizations(v_cognito_user_id VARCHAR)
RETURNS TABLE (
    organization_name TEXT,
    description TEXT,
    role_name TEXT,
    role_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.name AS organization_name,
        o.description,
        r.role_name,
        ur.role_id
    FROM user_roles ur
    JOIN organizations o ON ur.organization_id = o.organization_id
    LEFT JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.cognito_user_id = v_cognito_user_id;
END;
$$ LANGUAGE plpgsql;
