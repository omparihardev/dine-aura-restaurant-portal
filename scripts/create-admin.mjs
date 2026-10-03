#!/usr/bin/env node

/**
 * DineAura - Local Development Admin Account Creator
 * 
 * Securely creates a dedicated administrator account in Supabase Auth & public.profiles
 * without altering existing user accounts, without exposing service role keys to frontend,
 * and without weakening Row Level Security.
 * 
 * Usage:
 *   node scripts/create-admin.mjs
 *   node scripts/create-admin.mjs --email admin@dineaura.in --password StrongPassword123! --name "Admin User"
 *   npm run create-admin
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { createClient } from "@supabase/supabase-js";

// Helper to ask questions in terminal
function askQuestion(query, hidden = false) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        if (!hidden) {
            rl.question(query, (ans) => {
                rl.close();
                resolve(ans.trim());
            });
        } else {
            // Masked input for passwords / keys
            const stdin = process.stdin;
            process.stdout.write(query);
            let input = "";

            const onData = (char) => {
                char = char + "";
                switch (char) {
                    case "\n":
                    case "\r":
                    case "\u0004":
                        stdin.removeListener("data", onData);
                        process.stdout.write("\n");
                        rl.close();
                        resolve(input.trim());
                        break;
                    case "\u0003":
                        // Ctrl+C
                        process.exit(1);
                        break;
                    case "\b":
                    case "\x7f":
                        if (input.length > 0) {
                            input = input.slice(0, -1);
                            process.stdout.write("\b \b");
                        }
                        break;
                    default:
                        input += char;
                        process.stdout.write("*");
                        break;
                }
            };

            stdin.on("data", onData);
        }
    });
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--help" || args[i] === "-h") {
            parsed.help = true;
        } else if (args[i] === "--email" && args[i + 1]) {
            parsed.email = args[++i];
        } else if (args[i] === "--password" && args[i + 1]) {
            parsed.password = args[++i];
        } else if (args[i] === "--name" && args[i + 1]) {
            parsed.name = args[++i];
        } else if (args[i] === "--key" && args[i + 1]) {
            parsed.serviceRoleKey = args[++i];
        }
    }
    return parsed;
}

// Load .env.local safely
function loadEnv() {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const env = {};
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        content.split("\n").forEach((line) => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                let value = match[2] || "";
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                env[match[1]] = value.trim();
            }
        });
    }
    return env;
}

async function main() {
    console.log("\n=======================================================");
    console.log(" 🛡️  DineAura - Create Dedicated Admin Account");
    console.log("=======================================================\n");

    const cliArgs = parseArgs();

    if (cliArgs.help) {
        console.log("Usage:");
        console.log("  npm run create-admin");
        console.log("  node scripts/create-admin.mjs [options]\n");
        console.log("Options:");
        console.log("  --email <email>        New admin email address (must be different from normal user)");
        console.log("  --password <password>  Admin password (min 6 characters)");
        console.log("  --name <name>          Admin full name (default: 'DineAura Admin')");
        console.log("  --key <service_key>    Supabase Service Role Key (or set in .env.local)");
        console.log("  --help, -h             Show this help message\n");
        console.log("Notes:");
        console.log("  - Your existing normal user account is strictly preserved.");
        console.log("  - Service role keys are kept local and never bundled into frontend code.");
        process.exit(0);
    }

    const env = loadEnv();

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL was not found in .env.local.");
        process.exit(1);
    }

    // Determine Supabase Service Role Key
    let serviceRoleKey =
        cliArgs.serviceRoleKey ||
        env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        console.log("The Supabase Service Role Key is required to securely create an admin user");
        console.log("and bypass default signup limits in local development.");
        console.log("You can find it in your Supabase Dashboard: Project Settings -> API -> service_role.\n");

        serviceRoleKey = await askQuestion("Enter SUPABASE_SERVICE_ROLE_KEY: ");
        if (!serviceRoleKey) {
            console.error("❌ Error: Service role key is required.");
            process.exit(1);
        }

        const saveToEnv = await askQuestion("Save this SUPABASE_SERVICE_ROLE_KEY to .env.local for convenience? (y/N): ");
        if (saveToEnv.toLowerCase() === "y" || saveToEnv.toLowerCase() === "yes") {
            const envPath = path.resolve(process.cwd(), ".env.local");
            fs.appendFileSync(envPath, `\nSUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"\n`);
            console.log("✓ Saved SUPABASE_SERVICE_ROLE_KEY to .env.local (strictly gitignored).");
        }
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    // 1. Inspect existing users to protect the existing normal user
    console.log("\n🔍 Inspecting existing users to ensure existing accounts remain unchanged...");
    const { data: existingProfiles, error: fetchProfilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, role");

    if (fetchProfilesError) {
        console.error("❌ Failed to query existing profiles with service role key:", fetchProfilesError.message);
        console.error("Please verify that your SUPABASE_SERVICE_ROLE_KEY is valid.");
        process.exit(1);
    }

    if (existingProfiles && existingProfiles.length > 0) {
        console.log(`Found ${existingProfiles.length} existing profile(s):`);
        existingProfiles.forEach((p) => {
            console.log(`  - ${p.email || p.id} [role: ${p.role}]`);
        });
    } else {
        console.log("No existing profiles found in public.profiles.");
    }

    // 2. Collect admin credentials
    let email = cliArgs.email;
    if (!email) {
        email = await askQuestion("\nEnter NEW Admin Email address: ");
    }
    email = email.trim().toLowerCase();

    // Guard: Prevent overwriting/promoting an existing normal user account
    const existingUser = existingProfiles?.find((p) => p.email?.toLowerCase() === email);
    if (existingUser && existingUser.role === "user") {
        console.error(`\n❌ SAFETY ABORT: An account with email "${email}" already exists with role "user".`);
        console.error("Requirements explicitly forbid modifying your existing normal user account.");
        console.error("Please provide a separate, dedicated email address for the new admin account.\n");
        process.exit(1);
    }

    let password = cliArgs.password;
    if (!password) {
        password = await askQuestion("Enter Admin Password (min 6 characters): ");
    }

    if (!password || password.length < 6) {
        console.error("❌ Error: Password must be at least 6 characters long.");
        process.exit(1);
    }

    let fullName = cliArgs.name;
    if (!fullName) {
        fullName = await askQuestion("Enter Admin Full Name [DineAura Admin]: ");
        if (!fullName) fullName = "DineAura Admin";
    }

    console.log(`\nCreating admin account for "${email}"...`);

    // 3. Create or find user in Supabase Auth
    let userId = existingUser?.id;

    if (!userId) {
        const { data: createAuthData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email so admin can sign in immediately
            user_metadata: {
                full_name: fullName,
            },
        });

        if (createAuthError) {
            // Check if user already exists in auth.users but not profiles
            if (createAuthError.message.includes("already registered") || createAuthError.message.includes("unique")) {
                console.log("User already exists in Supabase Auth. Fetching user ID...");
                const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                const matchedUser = listData?.users.find((u) => u.email?.toLowerCase() === email);
                if (matchedUser) {
                    userId = matchedUser.id;
                    // Update password if specified
                    await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });
                } else {
                    console.error("❌ Could not resolve user in auth:", createAuthError.message);
                    process.exit(1);
                }
            } else {
                console.error("❌ Failed to create user in Supabase Auth:", createAuthError.message);
                process.exit(1);
            }
        } else {
            userId = createAuthData.user.id;
            console.log(`✓ Created Supabase Auth user (ID: ${userId}) with email_confirm: true.`);
        }
    }

    // 4. Ensure public.profiles entry has role = 'admin'
    console.log("Setting role = 'admin' in public.profiles...");

    // First attempt an upsert
    const { error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert(
            {
                id: userId,
                email: email,
                full_name: fullName,
                role: "admin",
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
        );

    if (upsertError) {
        console.warn("Notice during upsert:", upsertError.message);
        const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", userId);

        if (updateError) {
            console.error("\n❌ Database trigger error during role assignment:", updateError.message);
            console.error("\nPlease execute the SQL helper in `supabase/create_admin.sql` in your Supabase Dashboard SQL Editor.");
            process.exit(1);
        }
    }

    // 5. Verification
    const { data: verifiedProfile, error: verifyError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, role, created_at, updated_at")
        .eq("id", userId)
        .single();

    if (verifyError || verifiedProfile?.role !== "admin") {
        console.error("❌ Verification failed. Profile role is not admin:", verifiedProfile);
        process.exit(1);
    }

    console.log("\n=======================================================");
    console.log(" 🎉 Dedicated Admin Account Created Successfully!");
    console.log("=======================================================");
    console.log(`  Email:       ${verifiedProfile.email}`);
    console.log(`  Full Name:   ${verifiedProfile.full_name}`);
    console.log(`  Role:        ${verifiedProfile.role}`);
    console.log(`  Auth ID:     ${verifiedProfile.id}`);
    console.log(`  Status:      Email Confirmed & Active`);
    console.log("=======================================================");
    console.log("\nHow to test:");
    console.log("1. Open http://localhost:3000/login in your browser.");
    console.log(`2. Sign in with:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: [The password you entered]`);
    console.log("3. Once logged in, your header and sidebar will show:");
    console.log(`   - "🛡️ Manage Directory" in the top header`);
    console.log(`   - "🛡️ Admin Management" in the sidebar`);
    console.log("4. Navigate to http://localhost:3000/admin/restaurants to manage restaurants.\n");
}

main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
