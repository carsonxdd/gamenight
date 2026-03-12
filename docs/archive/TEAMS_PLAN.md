# Teams Feature — Implementation Plan

## Phase 1: Schema & Data Layer ✅
- [x] Add Team, TeamMember, TeamInvite models to schema.prisma
- [x] Add persistentTeamId to TournamentTeam
- [x] Add reverse relations on User
- [x] Run migration (db push)

## Phase 2: Server Actions & Utilities ✅
- [x] Create src/lib/team-constants.ts
- [x] Create src/app/teams/actions.ts (all CRUD + invite actions)

## Phase 3: Teams Page & List ✅
- [x] Create src/app/teams/page.tsx (server component)
- [x] Create src/components/teams/TeamsPage.tsx (client wrapper with tabs)
- [x] Create src/components/teams/TeamCard.tsx
- [x] Create src/components/teams/CreateTeamModal.tsx
- [x] Add /teams to middleware matcher
- [x] Add Teams to Navbar (desktop + mobile)

## Phase 4: Team Detail Page ✅
- [x] Create src/app/teams/[id]/page.tsx (server component)
- [x] Create src/components/teams/TeamDetail.tsx
- [x] Create src/components/teams/InviteMemberModal.tsx
- [x] Create src/components/teams/EditTeamModal.tsx

## Phase 5: Invite System & Badge ✅
- [x] Create src/components/teams/PendingInvites.tsx
- [x] Add invite count badge to Navbar (desktop + mobile, refreshes on nav)
- [x] Add pending invites section to Teams page

## Phase 6: Team Tags Throughout Site ✅
- [x] Create src/lib/team-utils.ts (formatWithTag, getTagsForUser, TeamTagMap)
- [x] Fetch team tags in schedule/page.tsx, pass TeamTagMap through ScheduleView
- [x] Update EventList to show [TAG] next to confirmed attendee names (game-context-aware)
- [x] Update EventDetailModal to show tags on invited/confirmed/maybe lists
- [x] Update AttendanceModal to show tags on attendee names
- [x] Fetch team tags in members/page.tsx, add teamTags to MemberData
- [x] Update MemberCard to show clickable team tag badges (links to /teams/[id])
- [ ] TournamentBracket tags → deferred to Phase 7 (tags will be baked into displayName at join time)

## Phase 7: Tournament Integration ✅
- [x] Modify CreateTournamentModal Step 6 — explain premade teams vs live draft options
- [x] Create src/components/teams/RegisterTeamModal.tsx (browse open tournaments, register)
- [x] Add registerPersistentTeam action (roster snapshot → TournamentTeam + TournamentEntrant)
- [x] Add getOpenTournamentsForGame action
- [x] Bake team tags into displayName at tournament join time (joinTournament, createTournament, addPlayersToTeamTournament)
- [x] Add "Register for Tournament" button to TeamDetail page (captain only)
- [x] Win/loss rollup already done in Phase 4 (team detail page queries via persistentTeamId)

## Phase 8: Middleware & Nav Cleanup ✅
- [x] /teams/:path* in middleware matcher (done in Phase 3)
- [x] Teams in Navbar desktop + mobile (done in Phase 3)
- [x] Invite count badge in Navbar (done above)
