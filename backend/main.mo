import Array "mo:core/Array";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import UserApproval "user-approval/approval";

// Explicit migration for critical state variable

// Run migrations in with-clause before actor instantiation

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  type ProgramStatus = { #planning; #ongoing; #completed };
  type KpiStatus = { #notAchieved; #inProgress; #achieved };
  type KpiPeriod = { #monthly; #quarterly; #annual };
  type UserRole = { #admin; #coordinator; #viewer };
  type ProgramPriority = { #high; #middle; #low };
  type AgendaCategory = { #meeting; #training; #workshop; #general };

  type TimeRange = {
    start : Time.Time;
    end : Time.Time;
  };
  type Program = {
    id : Nat;
    name : Text;
    description : Text;
    unit : Text;
    personInCharge : PersonInCharge;
    startDate : Int;
    endDate : Int;
    status : ProgramStatus;
    progress : Nat;
    priority : ProgramPriority;
  };
  type Kpi = {
    id : Nat;
    name : Text;
    relatedProgramId : Nat;
    team : PersonInCharge;
    targetValue : Nat;
    realizationValue : Nat;
    period : KpiPeriod;
    status : KpiStatus;
    deadline : ?Int;
    startKpiDate : Int;
    endKpiDate : Int;
  };
  type PersonInCharge = {
    id : Nat;
    name : Text;
    division : Text;
    role : Text;
  };
  type TeamMember = {
    id : Nat;
    name : Text;
    division : Text;
    role : Text;
    managerId : ?Nat;
  };
  type TeamMemberWithAvatar = {
    id : Nat;
    name : Text;
    division : Text;
    role : Text;
    avatar : ?Storage.ExternalBlob;
    managerId : ?Nat;
  };
  type TeamMemberCreateRequest = {
    id : Nat;
    name : Text;
    division : Text;
    role : Text;
    managerId : ?Nat;
  };
  type TeamAgendaItem = {
    id : Nat;
    title : Text;
    description : Text;
    startTime : Int;
    endTime : Int;
    category : AgendaCategory;
    attendees : [Text];
  };
  type UserProfile = {
    name : Text;
    role : UserRole;
    accountStatus : UserApproval.ApprovalStatus;
  };

  var nextProgramId = 1;
  var nextKpiId = 1;
  var nextTeamMemberId = 1;
  var nextAgendaItemId = 1;
  var firstAdminInitialized = false;

  let programs = Map.empty<Nat, Program>();
  let kpis = Map.empty<Nat, Kpi>();
  let teamAgendaItems = Map.empty<Nat, TeamAgendaItem>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let teamMembers = Map.empty<Nat, TeamMember>();
  let teamMemberAvatars = Map.empty<Nat, Storage.ExternalBlob>();

  // Program Management
  public shared ({ caller }) func createProgram(newProgram : Program) : async Nat {
    checkAdminOrCoordinator(caller);
    validatePersonInCharge(newProgram.personInCharge);

    let programId = nextProgramId;
    nextProgramId += 1;

    let program : Program = {
      newProgram with
      id = programId;
    };

    programs.add(programId, program);
    programId;
  };

  public shared ({ caller }) func updateProgram(id : Nat, updatedProgram : Program) : async () {
    checkAdminOrCoordinator(caller);

    if (not programs.containsKey(id)) {
      Runtime.trap("Program not found");
    };

    validatePersonInCharge(updatedProgram.personInCharge);
    programs.add(id, { updatedProgram with id });
  };

  public shared ({ caller }) func deleteProgram(id : Nat) : async () {
    checkAdminOrCoordinator(caller);

    if (not programs.containsKey(id)) {
      Runtime.trap("Program not found");
    };

    programs.remove(id);
  };

  public query ({ caller }) func getProgram(_id : Nat) : async ?Program {
    checkViewerAccess(caller);
    null;
  };

  public query ({ caller }) func getAllPrograms() : async [Program] {
    checkViewerAccess(caller);
    programs.values().toArray();
  };

  // KPI Management
  func validateKpi(kpi : Kpi) {
    if (kpi.name.size() == 0) {
      Runtime.trap("KPI name cannot be empty");
    };
    if (kpi.team.name.size() == 0) {
      Runtime.trap("Team name cannot be empty");
    };
    if (kpi.realizationValue > kpi.targetValue) {
      Runtime.trap("Realization value must not be higher than target value");
    };
  };

  public shared ({ caller }) func createKpi(newKpi : Kpi) : async Nat {
    checkAdminOrCoordinator(caller);

    let kpiId = nextKpiId;
    let kpiWithId = { newKpi with id = kpiId };

    validateKpi(kpiWithId);

    if (not programs.containsKey(kpiWithId.relatedProgramId)) {
      Runtime.trap("Program not found for related KPI");
    };

    validatePersonInCharge(kpiWithId.team);
    nextKpiId += 1;

    kpis.add(kpiId, kpiWithId);
    kpiId;
  };

  // Admins can update any KPI; coordinators can only update KPIs assigned to their team.
  public shared ({ caller }) func updateKpi(id : Nat, updatedKpi : Kpi) : async () {
    checkAdminOrCoordinator(caller);

    if (not kpis.containsKey(id)) {
      Runtime.trap("KPI not found");
    };

    // Admins bypass the team restriction; coordinators must own the KPI's team
    checkKpiUpdatePermission(caller, id);

    if (not programs.containsKey(updatedKpi.relatedProgramId)) {
      Runtime.trap("Program not found for related KPI");
    };

    validatePersonInCharge(updatedKpi.team);

    let kpiWithId = { updatedKpi with id };
    validateKpi(kpiWithId);

    kpis.add(id, kpiWithId);
  };

  public shared ({ caller }) func deleteKpi(id : Nat) : async () {
    checkAdminOrCoordinator(caller);

    if (not kpis.containsKey(id)) {
      Runtime.trap("KPI not found");
    };

    kpis.remove(id);
  };

  public query ({ caller }) func getKpi(_id : Nat) : async ?Kpi {
    checkViewerAccess(caller);
    null;
  };

  public query ({ caller }) func getAllKPIs() : async [Kpi] {
    checkViewerAccess(caller);
    kpis.values().toArray();
  };

  // Team Agenda Management
  public shared ({ caller }) func createTeamAgendaItem(newItem : TeamAgendaItem) : async Nat {
    checkAdminOrCoordinator(caller);
    validateAgendaItem(newItem);

    let agendaItemId = nextAgendaItemId;
    nextAgendaItemId += 1;

    let item : TeamAgendaItem = {
      newItem with
      id = agendaItemId;
    };

    teamAgendaItems.add(agendaItemId, item);
    agendaItemId;
  };

  public shared ({ caller }) func updateTeamAgendaItem(id : Nat, updatedItem : TeamAgendaItem) : async () {
    checkAdminOrCoordinator(caller);

    if (not teamAgendaItems.containsKey(id)) {
      Runtime.trap("Agenda item not found");
    };

    validateAgendaItem(updatedItem);
    teamAgendaItems.add(id, { updatedItem with id });
  };

  public shared ({ caller }) func deleteTeamAgendaItem(id : Nat) : async () {
    checkAdminOrCoordinator(caller);

    if (not teamAgendaItems.containsKey(id)) {
      Runtime.trap("Agenda item not found");
    };

    teamAgendaItems.remove(id);
  };

  public query ({ caller }) func getTeamAgendaItemsByRange(range : TimeRange) : async [TeamAgendaItem] {
    checkViewerAccess(caller);

    teamAgendaItems.values().toArray().filter(
      func(item) {
        (item.endTime >= range.start) and (item.startTime <= range.end)
      }
    );
  };

  public query ({ caller }) func getAllTeamAgendaItems() : async [TeamAgendaItem] {
    checkViewerAccess(caller);
    teamAgendaItems.values().toArray();
  };

  // Team Member Management
  public shared ({ caller }) func createTeamMember(newMember : TeamMemberCreateRequest) : async () {
    checkAdminOrCoordinator(caller);
    newMemberValidators(newMember);

    let teamMemberId = nextTeamMemberId;
    nextTeamMemberId += 1;

    validateManagerHierarchy(teamMemberId, newMember.managerId);

    let member : TeamMember = {
      id = teamMemberId;
      name = newMember.name;
      division = newMember.division;
      role = newMember.role;
      managerId = newMember.managerId;
    };
    teamMembers.add(teamMemberId, member);
  };

  public shared ({ caller }) func updateTeamMember(id : Nat, updatedMember : TeamMemberCreateRequest) : async () {
    checkAdminOrCoordinator(caller);

    if (not teamMembers.containsKey(id)) {
      Runtime.trap("Team member not found");
    };

    newMemberValidators(updatedMember);
    validateManagerHierarchy(id, updatedMember.managerId);

    let member : TeamMember = {
      id = id;
      name = updatedMember.name;
      division = updatedMember.division;
      role = updatedMember.role;
      managerId = updatedMember.managerId;
    };
    teamMembers.add(id, member);
  };

  public shared ({ caller }) func deleteTeamMember(id : Nat) : async () {
    checkAdminOrCoordinator(caller);

    if (not teamMembers.containsKey(id)) {
      Runtime.trap("Team member not found");
    };

    let hasSubordinates = teamMembers.values().toArray().filter(
      func(member) {
        switch (member.managerId) {
          case (?mgrId) { mgrId == id };
          case (null) { false };
        };
      }
    ).size() > 0;

    if (hasSubordinates) {
      Runtime.trap("Cannot delete team member who is a manager of other members");
    };

    teamMembers.remove(id);
    teamMemberAvatars.remove(id);
  };

  public query ({ caller }) func getAllTeamMembers() : async [TeamMemberWithAvatar] {
    checkViewerAccess(caller);

    let members = teamMembers.values().toArray();
    let memberWithAvatars = members.map(
      func(m) {
        {
          m with
          avatar = teamMemberAvatars.get(m.id);
        };
      }
    );
    memberWithAvatars;
  };

  public query ({ caller }) func getTeamMembersByDivision(division : Text) : async [TeamMemberWithAvatar] {
    checkViewerAccess(caller);

    let members = teamMembers.values().toArray().filter(
      func(i) { Text.equal(i.division, division) }
    );
    members.map(
      func(m) {
        {
          m with
          avatar = teamMemberAvatars.get(m.id);
        };
      }
    );
  };

  // Avatar Management
  // For IC content size reasons we only store references to external blobs rather than the actual blobs
  public shared ({ caller }) func setTeamMemberAvatar(memberId : Nat, avatar : Storage.ExternalBlob) : async () {
    checkAdminOrCoordinator(caller);

    if (not teamMembers.containsKey(memberId)) {
      Runtime.trap("Team member not found");
    };

    teamMemberAvatars.add(memberId, avatar);
  };

  public query ({ caller }) func getTeamMemberAvatar(memberId : Nat) : async ?Storage.ExternalBlob {
    checkViewerAccess(caller);

    if (not teamMembers.containsKey(memberId)) {
      Runtime.trap("Team member not found");
    };

    teamMemberAvatars.get(memberId);
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    checkAuthenticated(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    checkAuthenticated(caller);
    checkAdminOrSelf(caller, user);
    userProfiles.get(user);
  };

  // Only admins can change a user's role
  public shared ({ caller }) func updateUserProfileRole(user : Principal, newRole : UserRole) : async () {
    checkAdmin(caller);

    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile = {
          profile with
          role = newRole;
        };
        userProfiles.add(user, updatedProfile);

        let accessControlRole : AccessControl.UserRole = switch (newRole) {
          case (#admin) { #admin };
          case (#coordinator) { #user };
          case (#viewer) { #guest };
        };
        AccessControl.assignRole(accessControlState, caller, user, accessControlRole);
      };
    };
  };

  // Only admins can view all user profiles
  public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
    checkAdmin(caller);
    userProfiles.entries().toArray();
  };

  // Only admins can approve users
  public shared ({ caller }) func approveUser(userPrincipal : Principal) : async () {
    checkAdmin(caller);
    updateUserStatusInternal(userPrincipal, #approved);
    switch (userProfiles.get(userPrincipal)) {
      case (null) {};
      case (?profile) {
        let accessControlRole : AccessControl.UserRole = switch (profile.role) {
          case (#admin) { #admin };
          case (#coordinator) { #user };
          case (#viewer) { #guest };
        };
        AccessControl.assignRole(accessControlState, caller, userPrincipal, accessControlRole);
      };
    };
  };

  // Only admins can reject users
  public shared ({ caller }) func rejectUser(userPrincipal : Principal) : async () {
    checkAdmin(caller);
    updateUserStatusInternal(userPrincipal, #rejected);
  };

  public query ({ caller }) func calculateKpiProgress(kpiId : Nat) : async ?Nat {
    checkViewerAccess(caller);
    switch (kpis.get(kpiId)) {
      case (null) { null };
      case (?kpi) { ?((kpi.realizationValue * 100) / kpi.targetValue) };
    };
  };

  public query ({ caller }) func calculateProgramProgress(programId : Nat) : async ?Nat {
    checkViewerAccess(caller);
    switch (programs.get(programId)) {
      case (null) { null };
      case (?_program) {
        let programKpis = kpis.values().toArray().filter(func(kpi) { kpi.relatedProgramId == programId });

        if (programKpis.size() == 0) { return ?0 };

        var totalProgress = 0;
        for (kpi in programKpis.values()) {
          totalProgress += (kpi.realizationValue * 100) / kpi.targetValue;
        };

        ?(totalProgress / programKpis.size());
      };
    };
  };

  func validateAgendaItem(item : TeamAgendaItem) {
    if (item.title.size() < 2) {
      Runtime.trap("Title is required and must be at least 2 characters");
    };
    if (item.description.size() < 5) {
      Runtime.trap("Description is required and must be at least 5 characters");
    };
    if (item.endTime <= item.startTime) {
      Runtime.trap("End time must be after start time");
    };
  };

  func validatePersonInCharge(person : PersonInCharge) {
    if (person.name.size() < 2) {
      Runtime.trap("PIC name is required and must be at least 2 characters");
    };
    if (person.division.size() < 2) {
      Runtime.trap("PIC division is required and must be at least a few characters");
    };
    if (person.role.size() < 2) {
      Runtime.trap("PIC role is required and must be at least a few characters");
    };
  };

  func newMemberValidators(newMember : TeamMemberCreateRequest) {
    if (newMember.name.size() < 2) {
      Runtime.trap("Name is required and must be at least 2 characters");
    };
    if (newMember.division.size() < 2) {
      Runtime.trap("Division is required and must be at least a few characters");
    };
    if (newMember.role.size() < 2) {
      Runtime.trap("Role is required and must be at least a few characters");
    };
  };

  func validateManagerHierarchy(memberId : Nat, managerId : ?Nat) {
    switch (managerId) {
      case (null) {};
      case (?mgrId) {
        if (not teamMembers.containsKey(mgrId)) {
          Runtime.trap("Manager not found");
        };
        if (mgrId == memberId) {
          Runtime.trap("A team member cannot be their own manager");
        };
        var currentManagerId = ?mgrId;
        var visited = Set.empty<Nat>();
        visited.add(memberId);

        label hierarchyCheck loop {
          switch (currentManagerId) {
            case (null) { break hierarchyCheck };
            case (?currentId) {
              if (visited.contains(currentId)) {
                Runtime.trap("Circular manager reference detected");
              };
              visited.add(currentId);

              switch (teamMembers.get(currentId)) {
                case (null) { break hierarchyCheck };
                case (?manager) {
                  currentManagerId := manager.managerId;
                };
              };
            };
          };
        };
      };
    };
  };

  func checkAdminOrCoordinator(caller : Principal) {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can perform this action");
    };
  };

  func checkViewerAccess(caller : Principal) {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #guest)) {
      Runtime.trap("Unauthorized: Insufficient permissions");
    };
  };

  func checkAdmin(caller : Principal) {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Administrator permission needed");
    };
  };

  func checkAuthenticated(caller : Principal) {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };
  };

  func isAuthenticated(caller : Principal) : Bool {
    not caller.isAnonymous();
  };

  func checkAdminOrSelf(caller : Principal, user : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller) and caller != user) {
      Runtime.trap("Unauthorized: Can only view your own profile unless you are an admin");
    };
  };

  // Admins can update any KPI; coordinators can only update KPIs assigned to their team.
  func checkKpiUpdatePermission(caller : Principal, paramKpiId : Nat) {
    // Admins bypass the team restriction entirely
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return;
    };
    switch (kpis.get(paramKpiId)) {
      case (null) { Runtime.trap("KPI not found") };
      case (?existingKpi) {
        if (not canUpdateKpi(caller, existingKpi)) {
          Runtime.trap("Unauthorized: You can only update KPIs assigned to your team");
        };
      };
    };
  };

  func isCallerTeamMember(caller : Principal, teamMemberId : Nat) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (teamMembers.get(teamMemberId)) {
          case (null) { false };
          case (?member) {
            Text.equal(profile.name, member.name);
          };
        };
      };
    };
  };

  func canUpdateKpi(caller : Principal, kpi : Kpi) : Bool {
    // Admins can update any KPI
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    // Coordinators can only update KPIs assigned to their team
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return false;
    };
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        Text.equal(profile.name, kpi.team.name);
      };
    };
  };

  func updateUserStatusInternal(userPrincipal : Principal, newStatus : UserApproval.ApprovalStatus) {
    switch (userProfiles.get(userPrincipal)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile = {
          profile with
          accountStatus = newStatus;
        };
        userProfiles.add(userPrincipal, updatedProfile);
      };
    };
  };

  // Approval system functions

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    checkAuthenticated(caller);
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // Save Caller User Profile (Revised for Auto-Role Assignment)
  // New users are automatically assigned the 'Viewer' role.
  // If no users exist yet, the first registrant is automatically assigned the 'Admin' role.
  // The role parameter is intentionally absent: roles can only be changed by admins via updateUserProfileRole.
  public shared ({ caller }) func saveCallerUserProfile(name : Text) : async () {
    checkAuthenticated(caller);

    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        // Existing users can only update their name; role changes are admin-only via updateUserProfileRole
        if (existingProfile.name != name) {
          let updatedProfile = {
            existingProfile with
            name
          };
          userProfiles.add(caller, updatedProfile);
        };
      };
      case (null) {
        // New user registration: assign Viewer role by default, or Admin if first user
        let userRole : UserRole = if (not firstAdminInitialized) {
          #admin;
        } else {
          #viewer;
        };

        let accountStatus : UserApproval.ApprovalStatus = switch (userRole) {
          case (#admin) { #approved };
          case (#coordinator) { #pending };
          case (#viewer) { #approved };
        };

        let newProfile = {
          name;
          role = userRole;
          accountStatus;
        };
        userProfiles.add(caller, newProfile);

        let accessControlRole : AccessControl.UserRole = switch (userRole) {
          case (#admin) { #admin };
          case (#coordinator) { #user };
          case (#viewer) { #guest };
        };
        AccessControl.assignRole(accessControlState, caller, caller, accessControlRole);

        if (userRole == #admin) {
          firstAdminInitialized := true;
        };
      };
    };
  };
};

