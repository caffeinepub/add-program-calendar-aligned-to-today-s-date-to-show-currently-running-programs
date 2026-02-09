import Array "mo:core/Array";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type ProgramStatus = { #planning; #ongoing; #completed };
  type KpiStatus = { #notAchieved; #inProgress; #achieved };
  type KpiPeriod = { #monthly; #quarterly; #annual };
  type UserRole = { #admin; #coordinator; #viewer };
  type ProgramPriority = { #high; #middle; #low };

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
  };

  type UserProfile = {
    name : Text;
    role : UserRole;
  };

  module Program {
    func getStatusOrder(status : ProgramStatus) : Nat {
      switch (status) {
        case (#planning) { 0 };
        case (#ongoing) { 1 };
        case (#completed) { 2 };
      };
    };

    func getPriorityOrder(priority : ProgramPriority) : Nat {
      switch (priority) {
        case (#high) { 0 };
        case (#middle) { 1 };
        case (#low) { 2 };
      };
    };

    public func compareByPriority(p1 : Program, p2 : Program) : Order.Order {
      let priorityOrder1 = getPriorityOrder(p1.priority);
      let priorityOrder2 = getPriorityOrder(p2.priority);
      switch (Nat.compare(priorityOrder1, priorityOrder2)) {
        case (#equal) { compareByStatus(p1, p2) };
        case (order) { order };
      };
    };

    public func compareByStatus(p1 : Program, p2 : Program) : Order.Order {
      let statusOrder1 = getStatusOrder(p1.status);
      let statusOrder2 = getStatusOrder(p2.status);
      switch (Nat.compare(statusOrder1, statusOrder2)) {
        case (#equal) { compareByStartDate(p1, p2) };
        case (order) { order };
      };
    };

    public func compareByStartDate(p1 : Program, p2 : Program) : Order.Order {
      Int.compare(p1.startDate, p2.startDate);
    };
  };

  module Kpi {
    func getStatusOrder(status : KpiStatus) : Nat {
      switch (status) {
        case (#notAchieved) { 0 };
        case (#inProgress) { 1 };
        case (#achieved) { 2 };
      };
    };

    public func compareByStatus(kpi1 : Kpi, kpi2 : Kpi) : Order.Order {
      let statusOrder1 = getStatusOrder(kpi1.status);
      let statusOrder2 = getStatusOrder(kpi2.status);
      switch (Nat.compare(statusOrder1, statusOrder2)) {
        case (#equal) { Nat.compare(kpi1.targetValue, kpi2.targetValue) };
        case (order) { order };
      };
    };
  };

  module KpiPeriod {
    public func compare(period1 : KpiPeriod, period2 : KpiPeriod) : Order.Order {
      let periodOrder1 = getPeriodOrder(period1);
      let periodOrder2 = getPeriodOrder(period2);
      Nat.compare(periodOrder1, periodOrder2);
    };

    func getPeriodOrder(period : KpiPeriod) : Nat {
      switch (period) {
        case (#monthly) { 0 };
        case (#quarterly) { 1 };
        case (#annual) { 2 };
      };
    };
  };

  module ProgramPriority {
    public func compare(p1 : ProgramPriority, p2 : ProgramPriority) : Order.Order {
      func getOrder(priority : ProgramPriority) : Nat {
        switch (priority) {
          case (#high) { 0 };
          case (#middle) { 1 };
          case (#low) { 2 };
        };
      };
      Nat.compare(getOrder(p1), getOrder(p2));
    };
  };

  type TimeRange = {
    start : Time.Time;
    end : Time.Time;
  };

  let programs = Map.empty<Nat, Program>();
  let kpis = Map.empty<Nat, Kpi>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let teamMembers = Map.empty<Nat, TeamMember>();

  var nextProgramId = 1;
  var nextKpiId = 1;
  var nextTeamMemberId = 1;

  // Helper function to check if user is authenticated (not anonymous)
  func isAuthenticated(caller : Principal) : Bool {
    not caller.isAnonymous();
  };

  // Helper function to check if user can write (Admin or Coordinator)
  // Admin maps to #admin, Coordinator maps to #user in AccessControl
  func canWrite(caller : Principal) : Bool {
    if (not isAuthenticated(caller)) {
      return false;
    };
    AccessControl.isAdmin(accessControlState, caller) or
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  // Helper function to check if user can read (Admin, Coordinator, or Viewer)
  // All authenticated users can read, including viewers (#guest)
  func canRead(caller : Principal) : Bool {
    if (not isAuthenticated(caller)) {
      return false;
    };
    true;
  };

  // Query programs active within a given date range
  public query ({ caller }) func getProgramsActiveInRange(range : TimeRange) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };

    programs.values().toArray().filter(
      func(p) {
        (p.endDate >= range.start) and (p.startDate <= range.end)
      }
    );
  };

  // Team Member Management
  public shared ({ caller }) func createTeamMember(newMember : TeamMember) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can create team members");
    };

    newMemberValidators(newMember);

    let teamMemberId = nextTeamMemberId;
    nextTeamMemberId += 1;

    let member : TeamMember = {
      id = teamMemberId;
      name = newMember.name;
      division = newMember.division;
      role = newMember.role;
    };
    teamMembers.add(teamMemberId, member);
  };

  public shared ({ caller }) func updateTeamMember(id : Nat, updatedMember : TeamMember) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can update team members");
    };

    if (not teamMembers.containsKey(id)) {
      Runtime.trap("Team member not found");
    };

    newMemberValidators(updatedMember);

    let member : TeamMember = {
      id = id;
      name = updatedMember.name;
      division = updatedMember.division;
      role = updatedMember.role;
    };
    teamMembers.add(id, member);
  };

  public shared ({ caller }) func deleteTeamMember(id : Nat) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can delete team members");
    };

    if (not teamMembers.containsKey(id)) {
      Runtime.trap("Team member not found");
    };

    teamMembers.remove(id);
  };

  public query ({ caller }) func getAllTeamMembers() : async [TeamMember] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view team members");
    };
    teamMembers.values().toArray();
  };

  public query ({ caller }) func getTeamMembersByDivision(division : Text) : async [TeamMember] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view team members");
    };
    teamMembers.values().toArray().filter(
      func(i) { Text.equal(i.division, division) }
    );
  };

  // Get Unique Divisions
  public query ({ caller }) func getUniqueDivisions() : async [Text] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view divisions");
    };

    let divisions = teamMembers.values().toArray().map(
      func(member) { member.division }
    );

    let uniqueDivisions = Set.fromArray(divisions);
    uniqueDivisions.toArray();
  };

  public query ({ caller }) func getTeamMembersByDivisionFiltered(division : Text) : async [TeamMember] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view team members");
    };
    teamMembers.values().toArray().filter(
      func(member) { Text.equal(member.division, division) }
    );
  };

  // Program Management
  public shared ({ caller }) func createProgram(newProgram : Program) : async Nat {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can create programs");
    };

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
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can update programs");
    };

    if (not programs.containsKey(id)) {
      Runtime.trap("Program not found");
    };

    validatePersonInCharge(updatedProgram.personInCharge);

    programs.add(id, { updatedProgram with id });
  };

  public shared ({ caller }) func deleteProgram(id : Nat) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can delete programs");
    };

    if (not programs.containsKey(id)) {
      Runtime.trap("Program not found");
    };

    programs.remove(id);
  };

  // KPI Management
  public shared ({ caller }) func createKpi(newKpi : Kpi) : async Nat {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can create KPIs");
    };

    if (not programs.containsKey(newKpi.relatedProgramId)) {
      Runtime.trap("Program not found for related KPI");
    };

    validatePersonInCharge(newKpi.team);

    let kpiId = nextKpiId;
    nextKpiId += 1;

    let kpi : Kpi = {
      newKpi with
      id = kpiId;
    };

    kpis.add(kpiId, kpi);
    kpiId;
  };

  public shared ({ caller }) func updateKpi(id : Nat, updatedKpi : Kpi) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can update KPIs");
    };

    if (not kpis.containsKey(id)) {
      Runtime.trap("KPI not found");
    };

    if (not programs.containsKey(updatedKpi.relatedProgramId)) {
      Runtime.trap("Program not found for related KPI");
    };

    validatePersonInCharge(updatedKpi.team);

    kpis.add(id, { updatedKpi with id });
  };

  public shared ({ caller }) func deleteKpi(id : Nat) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can delete KPIs");
    };

    if (not kpis.containsKey(id)) {
      Runtime.trap("KPI not found");
    };

    kpis.remove(id);
  };

  // Common Validators
  func newMemberValidators(newMember : TeamMember) {
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

  // Filtering and Query Enhancements

  // Filter programs by division and sort by priority
  public query ({ caller }) func getProgramsByDivision(division : Text) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };

    let filtered = programs.values().toArray().filter(
      func(p) { Text.equal(p.unit, division) }
    );
    filtered.sort(Program.compareByPriority);
  };

  // Filter KPIs by team/PIC
  public query ({ caller }) func getKPIsByTeamPIC(teamName : Text) : async [Kpi] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    kpis.values().toArray().filter(
      func(kpi) { Text.equal(kpi.team.name, teamName) }
    );
  };

  // Filter programs by both division and priority
  public query ({ caller }) func getProgramsByDivisionAndPriority(division : Text, priority : ProgramPriority) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    programs.values().toArray().filter(
      func(p) { Text.equal(p.unit, division) and p.priority == priority }
    ).sort(
      func(p1, p2) {
        Int.compare(p1.startDate, p2.startDate);
      }
    );
  };

  // Get unique team/PIC names for dropdown options
  public query ({ caller }) func getUniquePICNames() : async [Text] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view team names");
    };

    let names = kpis.values().toArray().map(
      func(kpi) { kpi.team.name }
    );

    let uniqueNames = Set.fromArray(names);
    uniqueNames.toArray();
  };

  // Get unique priorities for filter dropdown
  public query ({ caller }) func getUniquePriorities() : async [ProgramPriority] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view priorities");
    };

    let priorities = programs.values().toArray().map(
      func(p) { p.priority }
    );

    let uniquePriorities = Set.fromArray<ProgramPriority>(priorities);
    uniquePriorities.toArray();
  };

  public query ({ caller }) func getFilteredPrograms(status : ProgramStatus) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    programs.values().toArray().filter(func(p) { p.status == status }).sort(Program.compareByStatus);
  };

  public query ({ caller }) func getFilteredKpis(status : KpiStatus, period : KpiPeriod) : async [Kpi] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    kpis.values().toArray().filter(func(i) { i.status == status and i.period == period }).sort(Kpi.compareByStatus);
  };

  public query ({ caller }) func getPagedPrograms(offset : Nat, limit : Nat) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    if (limit == 0) {
      Runtime.trap("Limit must be greater than 0");
    };

    let allPrograms = programs.values().toArray();
    let end = if (offset + limit > allPrograms.size()) {
      allPrograms.size();
    } else {
      offset + limit;
    };
    allPrograms.sliceToArray(offset, end).filter(func(p) { p.status == #ongoing }).sort(Program.compareByStartDate);
  };

  public query ({ caller }) func getPagedKpis(offset : Nat, limit : Nat) : async [Kpi] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    if (limit == 0) {
      Runtime.trap("Limit must be greater than 0");
    };

    let allKpis = kpis.values().toArray();
    let end = if (offset + limit > allKpis.size()) {
      allKpis.size();
    } else {
      offset + limit;
    };
    allKpis.sliceToArray(offset, end).sort(Kpi.compareByStatus);
  };

  public query ({ caller }) func getKPIsByTeam(_team : Text) : async [Kpi] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    kpis.values().toArray().filter(func(i) { Text.equal(i.team.name, _team) });
  };

  public query ({ caller }) func getProgramsByStatus(_status : ProgramStatus) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    programs.values().toArray().filter(func(p) { p.status == _status });
  };

  public query ({ caller }) func getProgramsByIds(ids : [Nat]) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    let programArray = programs.values().toArray();
    programArray.filter(
      func(p) {
        var found = false;
        for (id in ids.values()) {
          if (id == p.id) { found := true };
        };
        found;
      }
    );
  };

  public query ({ caller }) func getKPIsByIds(ids : [Nat]) : async [Kpi] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    kpis.values().toArray().filter(
      func(i) {
        var found = false;
        for (id in ids.values()) {
          if (id == i.id) { found := true };
        };
        found;
      }
    );
  };

  public query ({ caller }) func getKPIsByProgramIds(ids : [Nat]) : async [Kpi] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    kpis.values().toArray().filter(
      func(i) {
        var found = false;
        for (id in ids.values()) {
          if (id == i.relatedProgramId) { found := true };
        };
        found;
      }
    );
  };

  public query ({ caller }) func getProgramsByName(name : Text) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    programs.values().toArray().filter(func(p) { p.name.contains(#text(name)) });
  };

  public query ({ caller }) func getKPIsByName(name : Text) : async [Kpi] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    kpis.values().toArray().filter(func(i) { i.name.contains(#text(name)) });
  };

  public query ({ caller }) func getProgramsByTeam(team : Text) : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    programs.values().toArray().filter(func(p) { Text.equal(p.personInCharge.name, team) });
  };

  public query ({ caller }) func getProgram(id : Nat) : async ?Program {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    programs.get(id);
  };

  public query ({ caller }) func getAllPrograms() : async [Program] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view programs");
    };
    programs.values().toArray();
  };

  public query ({ caller }) func getAllKPIs() : async [Kpi] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    kpis.values().toArray();
  };

  public query ({ caller }) func getKpi(id : Nat) : async ?Kpi {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view KPIs");
    };
    kpis.get(id);
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required to access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required to access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless you are an admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required to save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Admin function to update user profile role
  public shared ({ caller }) func updateUserProfileRole(user : Principal, newRole : UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update user roles");
    };

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

        // Update AccessControl role mapping
        let accessControlRole = switch (newRole) {
          case (#admin) { #admin };
          case (#coordinator) { #user };
          case (#viewer) { #guest };
        };
        AccessControl.assignRole(accessControlState, caller, user, accessControlRole);
      };
    };
  };

  // Admin function to list all user profiles
  public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list all user profiles");
    };
    userProfiles.entries().toArray();
  };
};
