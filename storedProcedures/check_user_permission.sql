CREATE OR REPLACE FUNCTION check_user_permission(
    v_cognito_user_id VARCHAR,
    v_permission_name VARCHAR,
    v_caller_role_name VARCHAR -- Include role in the check
)
RETURNS BOOLEAN AS $$
DECLARE
    v_permission_id INTEGER;
    v_has_permission BOOLEAN := FALSE;
BEGIN
    -- Bypass permission check if the caller's role is 'Lambda'
    IF v_caller_role_name = 'Lambda' THEN
        RETURN TRUE; -- Automatically allow 'Lambda' role
    END IF;

    -- Step 1: Get the permission ID from the permission name
    SELECT permission_id INTO v_permission_id
    FROM permissions
    WHERE permission_name = v_permission_name;
    
    -- Check if the permission exists
    IF v_permission_id IS NULL THEN
        RAISE EXCEPTION 'Permission "%" not found', v_permission_name;
    END IF;

    -- Step 2: Check if the user has a role with that permission
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.cognito_user_id = v_cognito_user_id
        AND rp.permission_id = v_permission_id
    ) INTO v_has_permission;

    -- Return whether the user has the permission
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;
