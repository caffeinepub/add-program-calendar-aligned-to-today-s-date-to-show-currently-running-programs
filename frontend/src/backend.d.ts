import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TeamMemberCreateRequest {
    id: bigint;
    name: string;
    role: string;
    division: string;
    managerId?: bigint;
}
export type Time = bigint;
export interface TeamMemberWithAvatar {
    id: bigint;
    name: string;
    role: string;
    division: string;
    managerId?: bigint;
    avatar?: ExternalBlob;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Kpi {
    id: bigint;
    status: KpiStatus;
    period: KpiPeriod;
    startKpiDate: bigint;
    relatedProgramId: bigint;
    name: string;
    team: PersonInCharge;
    deadline?: bigint;
    endKpiDate: bigint;
    realizationValue: bigint;
    targetValue: bigint;
}
export interface TeamAgendaItem {
    id: bigint;
    startTime: bigint;
    title: string;
    endTime: bigint;
    description: string;
    attendees: Array<string>;
    category: AgendaCategory;
}
export interface TimeRange {
    end: Time;
    start: Time;
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
    accountStatus: ApprovalStatus;
    name: string;
    role: UserRole;
}
export enum AgendaCategory {
    workshop = "workshop",
    meeting = "meeting",
    general = "general",
    training = "training"
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
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
    approveUser(userPrincipal: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    calculateKpiProgress(kpiId: bigint): Promise<bigint | null>;
    calculateProgramProgress(programId: bigint): Promise<bigint | null>;
    createKpi(newKpi: Kpi): Promise<bigint>;
    createProgram(newProgram: Program): Promise<bigint>;
    createTeamAgendaItem(newItem: TeamAgendaItem): Promise<bigint>;
    createTeamMember(newMember: TeamMemberCreateRequest): Promise<void>;
    deleteKpi(id: bigint): Promise<void>;
    deleteProgram(id: bigint): Promise<void>;
    deleteTeamAgendaItem(id: bigint): Promise<void>;
    deleteTeamMember(id: bigint): Promise<void>;
    getAllKPIs(): Promise<Array<Kpi>>;
    getAllPrograms(): Promise<Array<Program>>;
    getAllTeamAgendaItems(): Promise<Array<TeamAgendaItem>>;
    getAllTeamMembers(): Promise<Array<TeamMemberWithAvatar>>;
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getKpi(_id: bigint): Promise<Kpi | null>;
    getProgram(_id: bigint): Promise<Program | null>;
    getTeamAgendaItemsByRange(range: TimeRange): Promise<Array<TeamAgendaItem>>;
    getTeamMemberAvatar(memberId: bigint): Promise<ExternalBlob | null>;
    getTeamMembersByDivision(division: string): Promise<Array<TeamMemberWithAvatar>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    rejectUser(userPrincipal: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(name: string): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setTeamMemberAvatar(memberId: bigint, avatar: ExternalBlob): Promise<void>;
    updateKpi(id: bigint, updatedKpi: Kpi): Promise<void>;
    updateProgram(id: bigint, updatedProgram: Program): Promise<void>;
    updateTeamAgendaItem(id: bigint, updatedItem: TeamAgendaItem): Promise<void>;
    updateTeamMember(id: bigint, updatedMember: TeamMemberCreateRequest): Promise<void>;
    updateUserProfileRole(user: Principal, newRole: UserRole): Promise<void>;
}
