import type { User } from "@supabase/supabase-js";

export interface UserProfile {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    role?: "user" | "admin" | string;
    created_at?: string;
    updated_at?: string;
}

export interface PortalShellProps {
    user?: User | null;
    profile?: UserProfile | null;
    children: React.ReactNode;
}

export interface NavigationItem {
    name: string;
    href: string;
    icon: string;
    badge?: string;
    description?: string;
}

export interface Restaurant {
    id: string;
    name: string;
    description: string | null;
    city: string;
    state: string;
    address: string | null;
    cuisine: string | null;
    image_url: string | null;
    phone: string | null;
    rating: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string | null;
    created_at?: string;
}
