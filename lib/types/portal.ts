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
    initialCity?: string;
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
    latitude?: number | null;
    longitude?: number | null;
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

export type ReservationStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";

export type SeatingPreference =
    | "No Preference"
    | "Indoor"
    | "Outdoor"
    | "Family Area"
    | "Private Dining";

export interface Reservation {
    id: string;
    restaurant_id: string;
    user_id: string;
    customer_name: string;
    customer_phone: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
    seating_preference: string | null;
    special_request: string | null;
    status: ReservationStatus;
    created_at: string;
    updated_at: string;
    // Optional joined restaurant details
    restaurant?: {
        id?: string;
        name: string;
        city?: string;
        state?: string;
        cuisine?: string;
        image_url?: string | null;
        phone?: string | null;
        address?: string | null;
    } | null;
    restaurants?: {
        id?: string;
        name: string;
        city?: string;
        state?: string;
        cuisine?: string;
        image_url?: string | null;
        phone?: string | null;
        address?: string | null;
    } | null;
}

