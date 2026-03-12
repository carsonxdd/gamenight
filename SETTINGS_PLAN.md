# Admin Settings Expansion Plan

**Goal:** Make the site fully customizable via admin settings, building toward a white-label/multi-tenant "Game Night as a Service" product.

## Phase 0: Schema + Settings UI Shell ← START HERE
- Add ALL new fields to `SiteSettings` in one Prisma schema update (all with defaults)
- Redesign `SiteSettingsPanel` with left sidebar (desktop) / horizontal tabs (mobile)
- Sections: Branding, Access & Privacy, Events, Polls & Community, Tournaments, Teams, Feature Toggles
- Update `settings-actions.ts` to handle all new fields

### New SiteSettings fields:
```
// Branding
accentColor        String  @default("#39FF14")  // neon green default
communityTagline   String? // hero subtitle
logoUrl            String? // uploaded logo
faviconUrl         String? // uploaded favicon

// Access & Privacy
joinMode           String  @default("open")  // "open", "invite_only", "approval"
requireGamertag    Boolean @default(false)
allowPublicProfiles Boolean @default(true)
showMemberCount    Boolean @default(true)

// Events
allowMemberEvents  Boolean @default(true)
requireRSVP        Boolean @default(false)
maxAttendeesDefault Int    @default(0)  // 0 = unlimited
autoArchiveDays    Int     @default(30)

// Polls
allowMemberPolls   Boolean @default(true)
allowPollComments  Boolean @default(true)

// Tournaments
allowMemberTournaments Boolean @default(false)
maxTournamentSize  Int     @default(32)
enableBuyIns       Boolean @default(true)

// Teams
allowTeamCreation  Boolean @default(true)
maxTeamsPerUser    Int     @default(3)
maxTeamSize        Int     @default(10)

// Feature Toggles
enableTournaments  Boolean @default(true)
enableTeams        Boolean @default(true)
enablePolls        Boolean @default(true)
enableHighlights   Boolean @default(true)
enableStats        Boolean @default(true)
```

## Phase 1: Feature Toggles
- Wire enableTournaments/Teams/Polls/Highlights/Stats into navbar
- Conditionally render nav links
- Redirect to home if feature disabled on direct URL access
- Small, high-impact

## Phase 2: Branding
- Accent color: preset palette (~12 colors), drives `--neon` CSS variable
- communityTagline on hero
- logoUrl + faviconUrl: file upload → `public/uploads/`
- Wire communityName into `<title>`

## Phase 3: Access & Privacy
- joinMode: open (default), invite_only, approval
- New model: `InviteCode` (code, uses, maxUses, expiresAt, createdBy)
- Admin: generate codes, view usage
- Approval queue: `User.approvalStatus`, admin panel to approve/reject
- Wire requireGamertag, allowPublicProfiles, showMemberCount

## Phase 4: Event Controls
- Wire allowMemberEvents permission checks
- requireRSVP, maxAttendeesDefault, autoArchiveDays
- Auto-archive on page load (no cron)

## Phase 5: Polls & Community
- Wire allowMemberPolls, allowPollComments permission checks

## Phase 6: Tournament & Team Controls
- Wire allowMemberTournaments, maxTournamentSize, enableBuyIns
- Wire allowTeamCreation, maxTeamsPerUser, maxTeamSize

---

## Accent Color Presets
| Name       | Hex       |
|------------|-----------|
| Neon Green | #39FF14   |
| Electric Blue | #00D4FF |
| Purple     | #BF5AF2   |
| Hot Pink   | #FF2D55   |
| Orange     | #FF9500   |
| Gold       | #FFD60A   |
| Red        | #FF3B30   |
| Teal       | #30D5C8   |
| Lime       | #A8FF04   |
| Ice Blue   | #64D2FF   |
| Coral      | #FF6B6B   |
| Lavender   | #D4BBFF   |

## Settings UI Layout
- Desktop: Left sidebar (section labels) + right content area (form fields)
- Mobile: Horizontal scrollable tabs at top (matches Members page pattern)
- Each section is a card with grouped fields
- Save button per section (or single save at bottom)
