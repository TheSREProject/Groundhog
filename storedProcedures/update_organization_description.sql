CREATE OR REPLACE FUNCTION public.update_organization_description(
    v_organization_name character varying,
    v_new_description character varying,
    v_cognito_user_id character varying
) 
RETURNS void 
LANGUAGE plpgsql
AS $function$
DECLARE
    v_organization_id INTEGER;
BEGIN
    -- Check if the user has permission to update the organization description
    IF NOT check_user_permission(v_cognito_user_id, 'update_organization_description') THEN
        RAISE EXCEPTION 'You do not have permission to update the organization description.';
    END IF;

    -- Get the organization_id from the organization name
    SELECT organization_id INTO v_organization_id
    FROM organizations
    WHERE name = v_organization_name;

    -- If organization not found, raise an exception
    IF v_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization "%" not found', v_organization_name;
    END IF;

    -- Update the organization description
    UPDATE organizations
    SET description = v_new_description
    WHERE organization_id = v_organization_id;

    -- Log the update (optional)
    RAISE NOTICE 'Organization "%" description updated successfully', v_organization_name;

END;
$function$;
