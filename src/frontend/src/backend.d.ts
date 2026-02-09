import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Kpi {
    id: bigint;
    status: KpiStatus;
    period: KpiPeriod;
    relatedProgramId: bigint;
    name: string;
    team: PersonInCharge;
    realizationValue: bigint;
    targetValue: bigint;
}
export type Time = bigint;
export interface TimeRange {
    end: Time;
    start: Time;
}
export interface TeamMember {
    id: bigint;
    name: string;
    role: string;
    division: string;
}
export interface Program {
    id: bigint;
    status: ProgramStatus;
    endDate: bigint;
    name: string;
    unit: string;
    description: string;
    progress: bigint;
    priority: ProgramPriority;
    personInCharge: PersonInCharge;
    startDate: bigint;
}
export interface PersonInCharge {
    id: bigint;
    name: string;
    role: string;
    division: string;
}
export interface UserProfile {
    name: string;
    role: UserRole;
}
export enum KpiPeriod {
    annual = "annual",
    quarterly = "quarterly",
    monthly = "monthly"
}
export enum KpiStatus {
    achieved = "achieved",
    notAchieved = "notAchieved",
    inProgress = "inProgress"
}
export enum ProgramPriority {
    low = "low",
    high = "high",
    middle = "middle"
}
export enum ProgramStatus {
    completed = "completed",
    ongoing = "ongoing",
    planning = "planning"
}
export enum UserRole {
    admin = "admin",
    viewer = "viewer",
    coordinator = "coordinator"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createKpi(newKpi: Kpi): Promise<bigint>;
    createProgram(newProgram: Program): Promise<bigint>;
    createTeamMember(newMember: TeamMember): Promise<void>;
    deleteKpi(id: bigint): Promise<void>;
    deleteProgram(id: bigint): Promise<void>;
    deleteTeamMember(id: bigint): Promise<void>;
    getAllKPIs(): Promise<Array<Kpi>>;
    getAllPrograms(): Promise<Array<Program>>;
    getAllTeamMembers(): Promise<Array<TeamMember>>;
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getFilteredKpis(status: KpiStatus, period: KpiPeriod): Promise<Array<Kpi>>;
    getFilteredPrograms(status: ProgramStatus): Promise<Array<Program>>;
    getKPIsByIds(ids: Array<bigint>): Promise<Array<Kpi>>;
    getKPIsByName(name: string): Promise<Array<Kpi>>;
    getKPIsByProgramIds(ids: Array<bigint>): Promise<Array<Kpi>>;
    getKPIsByTeam(_team: string): Promise<Array<Kpi>>;
    getKPIsByTeamPIC(teamName: string): Promise<Array<Kpi>>;
    getKpi(id: bigint): Promise<Kpi | null>;
    getPagedKpis(offset: bigint, limit: bigint): Promise<Array<Kpi>>;
    getPagedPrograms(offset: bigint, limit: bigint): Promise<Array<Program>>;
    getProgram(id: bigint): Promise<Program | null>;
    getProgramsActiveInRange(range: TimeRange): Promise<Array<Program>>;
    getProgramsByDivision(division: string): Promise<Array<Program>>;
    getProgramsByDivisionAndPriority(division: string, priority: ProgramPriority): Promise<Array<Program>>;
    getProgramsByIds(ids: Array<bigint>): Promise<Array<Program>>;
    getProgramsByName(name: string): Promise<Array<Program>>;
    getProgramsByStatus(_status: ProgramStatus): Promise<Array<Program>>;
    getProgramsByTeam(team: string): Promise<Array<Program>>;
    getTeamMembersByDivision(division: string): Promise<Array<TeamMember>>;
    getTeamMembersByDivisionFiltered(division: string): Promise<Array<TeamMember>>;
    getUniqueDivisions(): Promise<Array<string>>;
    getUniquePICNames(): Promise<Array<string>>;
    getUniquePriorities(): Promise<Array<ProgramPriority>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateKpi(id: bigint, updatedKpi: Kpi): Promise<void>;
    updateProgram(id: bigint, updatedProgram: Program): Promise<void>;
    updateTeamMember(id: bigint, updatedMember: TeamMember): Promise<void>;
    updateUserProfileRole(user: Principal, newRole: UserRole): Promise<void>;
}
