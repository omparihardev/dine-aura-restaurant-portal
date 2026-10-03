-- ==============================================================================
-- DineAura: Bootstrap Initial Administrator Account
-- Target Account: kishansinghp03@gmail.com
-- ==============================================================================
-- Instructions:
-- Open the Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- and choose ONE of the options below.
-- ==============================================================================

-- ==============================================================================
-- OPTION 1 (RECOMMENDED - Simplest & Fastest Atomic Transaction)
-- ==============================================================================
-- Safely promotes kishansinghp03@gmail.com by temporarily disabling the trigger
-- for only this specific atomic transaction and immediately re-enabling it.
-- RLS remains 100% active throughout. Normal users cannot execute DDL commands.

BEGIN;

-- 1. Temporarily disable role update prevention trigger for this transaction
ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_profile_role_update;

-- 2. Promote the target administrator account
UPDATE public.profiles
SET role = 'admin',
    updated_at = now()
WHERE email = 'kishansinghp03@gmail.com';

-- 3. Immediately re-enable the trigger
ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_profile_role_update;

-- 4. Verify the updated profile
SELECT id, email, full_name, role, updated_at
FROM public.profiles
WHERE email = 'kishansinghp03@gmail.com';

COMMIT;


-- ==============================================================================
-- OPTION 2 (SECURITY DEFINER Procedure Pattern)
-- ==============================================================================
-- A dedicated procedure that strictly permits ONLY kishansinghp03@gmail.com
-- to be bootstrapped. Rejects any other email address or arbitrary role input.

/*
CREATE OR REPLACE PROCEDURE public.bootstrap_initial_admin(target_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Strict safeguard: only promote the designated administrator
    IF target_email <> 'kishansinghp03@gmail.com' THEN
        RAISE EXCEPTION 'Unauthorized: bootstrap procedure is strictly restricted to the designated initial administrator.';
    END IF;

    -- Temporarily disable role lock trigger
    ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_profile_role_update;

    -- Update target profile
    UPDATE public.profiles
    SET role = 'admin',
        updated_at = now()
    WHERE email = target_email;

    -- Re-enable role lock trigger
    ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_profile_role_update;
END;
$$;

-- Revoke public execution to ensure no client access
REVOKE EXECUTE ON PROCEDURE public.bootstrap_initial_admin(text) FROM public, anon, authenticated;

-- Execute the bootstrap procedure
CALL public.bootstrap_initial_admin('kishansinghp03@gmail.com');

-- Verify promotion
SELECT id, email, full_name, role, updated_at
FROM public.profiles
WHERE email = 'kishansinghp03@gmail.com';

-- Clean up the one-time procedure
DROP PROCEDURE public.bootstrap_initial_admin(text);
*/


-- ==============================================================================
-- OPTION 3 (Permanent Trigger Refinement in schema.sql)
-- ==============================================================================
-- Permanently enables direct Supabase SQL Editor execution (where auth.uid() is null)
-- while maintaining 100% protection against normal authenticated users in the web app.

/*
CREATE OR REPLACE FUNCTION public.prevent_profile_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Block role modification when called by a normal authenticated client user:
    IF new.role IS DISTINCT FROM old.role 
       AND auth.uid() IS NOT NULL
       AND NOT public.is_admin()
       AND coalesce(auth.jwt()->>'role', auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Users are not permitted to change their own role.';
    END IF;
    RETURN new;
END;
$$;

-- Then run standard update:
UPDATE public.profiles
SET role = 'admin',
    updated_at = now()
WHERE email = 'kishansinghp03@gmail.com';
*/
