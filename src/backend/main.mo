import Array "mo:core/Array";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Nat "mo:core/Nat";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type ProgramStatus = { #planning; #ongoing; #completed };
  type KpiStatus = { #notAchieved; #inProgress; #achieved };
  type KpiPeriod = { #monthly; #quarterly; #annual };
  type UserRole = { #admin; #coordinator; #viewer };
  type ProgramPriority = { #high; #middle; #low };
  type AgendaCategory = { #meeting; #training; #workshop; #general };

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
  };

  type ReminderType = {
    #dayBefore;
    #threeHoursBefore;
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

  let programs = Map.empty<Nat, Program>();
  let kpis = Map.empty<Nat, Kpi>();
  let teamAgendaItems = Map.empty<Nat, TeamAgendaItem>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let teamMembers = Map.empty<Nat, TeamMember>();
  let teamMemberAvatars = Map.empty<Nat, Storage.ExternalBlob>();

  var nextProgramId = 1;
  var nextKpiId = 1;
  var nextTeamMemberId = 1;
  var nextAgendaItemId = 1;
  var zainsPrincipalIdInitialized = false;

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
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  // Helper function to check if user can read (Admin, Coordinator, or Viewer)
  // All authenticated users with at least guest role can read
  func canRead(caller : Principal) : Bool {
    if (not isAuthenticated(caller)) {
      return false;
    };
    AccessControl.hasPermission(accessControlState, caller, #guest);
  };

  // Helper function to check if caller's profile matches a team member
  func isCallerTeamMember(caller : Principal, teamMemberId : Nat) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (teamMembers.get(teamMemberId)) {
          case (null) { false };
          case (?member) {
            // Match by name - in production, use a more robust identifier
            Text.equal(profile.name, member.name);
          };
        };
      };
    };
  };

  // Helper function to check if caller can update a specific KPI
  func canUpdateKpi(caller : Principal, kpi : Kpi) : Bool {
    // Admins can always update
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };

    // Check if caller is a coordinator/user
    if (not canWrite(caller)) {
      return false;
    };

    // Check if caller is part of the KPI's team
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        // Match by team name and division
        Text.equal(profile.name, kpi.team.name);
      };
    };
  };

  // Query programs active within a given date range
  type TimeRange = {
    start : Time.Time;
    end : Time.Time;
  };

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

  // Team Agenda Management
  public shared ({ caller }) func createTeamAgendaItem(newItem : TeamAgendaItem) : async Nat {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can create agenda items");
    };

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
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can update agenda items");
    };

    if (not teamAgendaItems.containsKey(id)) {
      Runtime.trap("Agenda item not found");
    };

    validateAgendaItem(updatedItem);
    teamAgendaItems.add(id, { updatedItem with id });
  };

  public shared ({ caller }) func deleteTeamAgendaItem(id : Nat) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can delete agenda items");
    };

    if (not teamAgendaItems.containsKey(id)) {
      Runtime.trap("Agenda item not found");
    };

    teamAgendaItems.remove(id);
  };

  public query ({ caller }) func getTeamAgendaItemsByRange(range : TimeRange) : async [TeamAgendaItem] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view agenda items");
    };

    teamAgendaItems.values().toArray().filter(
      func(item) {
        (item.endTime >= range.start) and (item.startTime <= range.end)
      }
    );
  };

  public query ({ caller }) func getAllTeamAgendaItems() : async [TeamAgendaItem] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view agenda items");
    };
    teamAgendaItems.values().toArray();
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

  // Helper function to validate manager hierarchy
  func validateManagerHierarchy(memberId : Nat, managerId : ?Nat) {
    switch (managerId) {
      case (null) {
        // No manager is valid (root of hierarchy)
      };
      case (?mgrId) {
        // Manager must exist
        if (not teamMembers.containsKey(mgrId)) {
          Runtime.trap("Manager not found");
        };

        // Cannot be own manager
        if (mgrId == memberId) {
          Runtime.trap("A team member cannot be their own manager");
        };

        // Check for circular reference by traversing up the hierarchy
        var currentManagerId = ?mgrId;
        var visited = Set.empty<Nat>();
        visited.add(memberId);

        label hierarchyCheck loop {
          switch (currentManagerId) {
            case (null) {
              break hierarchyCheck;
            };
            case (?currentId) {
              if (visited.contains(currentId)) {
                Runtime.trap("Circular manager reference detected");
              };
              visited.add(currentId);

              switch (teamMembers.get(currentId)) {
                case (null) {
                  break hierarchyCheck;
                };
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

  // Team Member Management
  public shared ({ caller }) func createTeamMember(newMember : TeamMemberCreateRequest) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can create team members");
    };

    newMemberValidators(newMember);

    let teamMemberId = nextTeamMemberId;
    nextTeamMemberId += 1;

    // Validate manager hierarchy before creating
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
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can update team members");
    };

    if (not teamMembers.containsKey(id)) {
      Runtime.trap("Team member not found");
    };

    newMemberValidators(updatedMember);

    // Validate manager hierarchy before updating
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
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can delete team members");
    };

    if (not teamMembers.containsKey(id)) {
      Runtime.trap("Team member not found");
    };

    // Check if any other team members have this member as their manager
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
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view team members");
    };

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
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view team members");
    };

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

  public query ({ caller }) func getTeamMembersByDivisionFiltered(division : Text) : async [TeamMemberWithAvatar] {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view team members");
    };

    let members = teamMembers.values().toArray().filter(
      func(member) { Text.equal(member.division, division) }
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
  public shared ({ caller }) func setTeamMemberAvatar(memberId : Nat, avatar : Storage.ExternalBlob) : async () {
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can set avatars");
    };

    if (not teamMembers.containsKey(memberId)) {
      Runtime.trap("Team member not found");
    };

    teamMemberAvatars.add(memberId, avatar);
  };

  public query ({ caller }) func getTeamMemberAvatar(memberId : Nat) : async ?Storage.ExternalBlob {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to view avatars");
    };

    if (not teamMembers.containsKey(memberId)) {
      Runtime.trap("Team member not found");
    };

    teamMemberAvatars.get(memberId);
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

  // KPI Management (new validator)
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
    if (not canWrite(caller)) {
      Runtime.trap("Unauthorized: Only coordinators and admins can create KPIs");
    };

    if (not programs.containsKey(newKpi.relatedProgramId)) {
      Runtime.trap("Program not found for related KPI");
    };

    validatePersonInCharge(newKpi.team);
    validateKpi(newKpi);

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
    if (not kpis.containsKey(id)) {
      Runtime.trap("KPI not found");
    };

    // Get the existing KPI to check authorization
    switch (kpis.get(id)) {
      case (null) {
        Runtime.trap("KPI not found");
      };
      case (?existingKpi) {
        // Check if caller can update this specific KPI
        if (not canUpdateKpi(caller, existingKpi)) {
          Runtime.trap("Unauthorized: You can only update KPIs assigned to your team");
        };
      };
    };

    if (not programs.containsKey(updatedKpi.relatedProgramId)) {
      Runtime.trap("Program not found for related KPI");
    };

    validatePersonInCharge(updatedKpi.team);
    validateKpi(updatedKpi);

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

    // Special case for Zain
    if (not zainsPrincipalIdInitialized and caller.toText() == "w5p5n-a6tur-yspnr-2t6y2-nvhgw-xpfx3-fgxtb-mos2k-kt7gi-qtk57-rae") {
      // Mark Zain's Principal as initialized immediately
      zainsPrincipalIdInitialized := true;

      // Create Zain's profile with admin role
      let zainProfile = {
        profile with
        role = #admin;
      };
      userProfiles.add(caller, zainProfile);

      // Set AccessControl to admin
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
      return;
    };

    // Check existing profile to determine if this is a role change
    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        // Existing user updating profile
        if (existingProfile.role != profile.role) {
          // Role change attempt - only admins can change roles
          Runtime.trap("Unauthorized: Only admins can change user roles. Use updateUserProfileRole function");
        };
        // Allow profile update if role unchanged
        userProfiles.add(caller, profile);
      };
      case (null) {
        // Allow user to choose coordinator or viewer role
        let accessControlRole = switch (profile.role) {
          case (#admin) { Runtime.trap("Unauthorized: Admin role cannot be self-assigned") };
          case (#coordinator) { #user };
          case (#viewer) { #guest };
        };
        userProfiles.add(caller, profile);
        AccessControl.assignRole(accessControlState, caller, caller, accessControlRole);
      };
    };
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

  // Helper function to calculate KPI progress
  public query ({ caller }) func calculateKpiProgress(kpiId : Nat) : async ?Nat {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to calculate KPI progress");
    };
    switch (kpis.get(kpiId)) {
      case (null) { null };
      case (?kpi) { ?((kpi.realizationValue * 100) / kpi.targetValue) };
    };
  };

  public query ({ caller }) func calculateProgramProgress(programId : Nat) : async ?Nat {
    if (not canRead(caller)) {
      Runtime.trap("Unauthorized: Authentication required to calculate program progress");
    };
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

  // Automatically update program progress when related KPI is updated
  public shared ({ caller }) func updateKpiAndSyncProgram(id : Nat, updatedKpi : Kpi) : async () {
    if (not kpis.containsKey(id)) {
      Runtime.trap("KPI not found");
    };

    // Get the existing KPI to check authorization
    switch (kpis.get(id)) {
      case (null) {
        Runtime.trap("KPI not found");
      };
      case (?existingKpi) {
        // Check if caller can update this specific KPI
        if (not canUpdateKpi(caller, existingKpi)) {
          Runtime.trap("Unauthorized: You can only update KPIs assigned to your team");
        };
      };
    };

    if (not programs.containsKey(updatedKpi.relatedProgramId)) {
      Runtime.trap("Program not found for related KPI");
    };

    validatePersonInCharge(updatedKpi.team);
    validateKpi(updatedKpi);

    kpis.add(id, { updatedKpi with id });

    // Calculate and update program progress
    let programKpis = kpis.values().toArray().filter(
      func(kpi) { kpi.relatedProgramId == updatedKpi.relatedProgramId }
    );

    if (programKpis.size() > 0) {
      var totalProgress = 0;
      for (kpi in programKpis.values()) {
        totalProgress += (kpi.realizationValue * 100) / kpi.targetValue;
      };

      // Update program progress if it exists
      switch (programs.get(updatedKpi.relatedProgramId)) {
        case (null) {};
        case (?program) {
          programs.add(
            updatedKpi.relatedProgramId,
            {
              program with
              progress = if (totalProgress == 0) { 0 } else { totalProgress / programKpis.size() };
            },
          );
        };
      };
    };
  };
};
