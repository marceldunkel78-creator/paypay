import { HouseholdTask, CreateHouseholdTaskRequest, UpdateHouseholdTaskRequest } from '../models/household-task.model';
export declare class HouseholdTaskService {
    getActiveHouseholdTasks(): Promise<HouseholdTask[]>;
    getAllHouseholdTasks(): Promise<HouseholdTask[]>;
    getHouseholdTaskById(id: number): Promise<HouseholdTask | null>;
    createHouseholdTask(taskData: CreateHouseholdTaskRequest): Promise<HouseholdTask>;
    updateHouseholdTask(id: number, updateData: UpdateHouseholdTaskRequest): Promise<boolean>;
    deleteHouseholdTask(id: number): Promise<boolean>;
    deactivateHouseholdTask(id: number): Promise<boolean>;
    updateWeightFactor(id: number, weightFactor: number): Promise<boolean>;
}
//# sourceMappingURL=household-task.service.d.ts.map