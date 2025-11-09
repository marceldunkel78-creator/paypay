export interface HouseholdTask {
    id: number;
    name: string;
    description?: string;
    hours?: number | null;
    weight_factor: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateHouseholdTaskRequest {
    name: string;
    description?: string;
    hours?: number | null;
    weight_factor?: number;
    is_active?: boolean;
}

export interface UpdateHouseholdTaskRequest {
    name?: string;
    description?: string;
    hours?: number | null;
    weight_factor?: number;
    is_active?: boolean;
}