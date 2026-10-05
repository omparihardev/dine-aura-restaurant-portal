export interface RestaurantMenuItem {
    id: string;
    restaurant_id: string;
    name: string;
    description?: string | null;
    category: string;
    price: number;
    is_available: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface MenuItemActionResult {
    error?: string;
    success?: boolean;
    message?: string;
    data?: RestaurantMenuItem | null;
}
