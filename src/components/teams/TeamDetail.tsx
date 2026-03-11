"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import InviteMemberModal from "./InviteMemberModal";
import EditTeamModal from "./EditTeamModal";
import RegisterTeamModal from "./RegisterTeamModal";
import { leaveTeam, disbandTeam, removeMember, updateMemberRole } from "@/app/teams/actions";

interface MemberInfo {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    gamertag: string | null;
    avatar: string | null;
  };
}

interface TournamentHistoryItem {
  id: string;
  title: string;
  status: string;
  placement: string | null;
}

export interface TeamDetailData {
  id: string;
  name: string;
  tag: string;
  game: string;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  minSize: number;
  maxSize: number;
  captainId: string;
  captain: { id: string; name: string; gamertag: string | null; avatar: string | null };
  members: MemberInfo[];
  tournamentHistory: TournamentHistoryItem[];
  wins: number;
  losses: number;
  createdAt: string;
}

interface Props {
  team: TeamDetailData;
  userId: string;
  isAdmin: boolean;
  allMembers: { id: string; name: string; gamertag: string | null; avatar: string | null }[];
}

const ROLE_ORDER = ["captain", "co_captain", "member", "sub"];
const ROLE_LABELS: Record<string, string> = {
  captain: "Captain",
  co_captain: "Co-Captain",
  member: "Member",
  sub: "Sub",
};
const ROLE_COLORS: Record<string, "neon" | "warning" | "neutral"> = {
  captain: "neon",
  co_captain: "warning",
  member: "neutral",
  sub: "neutral",
};

export default function TeamDetail({ team, userId, isAdmin, allMembers }: Props) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [confirmDisband, setConfirmDisband] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCaptain = team.captainId === userId;
  const isCoCaptain = team.members.some(
    (m) => m.userId === userId && m.role === "co_captain"
  );
  const isMember = team.members.some((m) => m.userId === userId);
  const canManage = isCaptain || isAdmin;
  const canInvite = isCaptain || isCoCaptain || isAdmin;

  const sortedMembers = [...team.members].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  );

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this team?")) return;
    setLoading(true);
    const result = await leaveTeam(team.id);
    setLoading(false);
    if (result.error) alert(result.error);
  };

  const handleDisband = async () => {
    setLoading(true);
    const result = await disbandTeam(team.id);
    setLoading(false);
    if (result.error) {
      alert(result.error);
    } else {
      router.push("/teams");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the team?")) return;
    const result = await removeMember(team.id, memberId);
    if (result.error) alert(result.error);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const result = await updateMemberRole(team.id, memberId, newRole);
    if (result.error) alert(result.error);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-20">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-8"
      >
        {/* Back link */}
        <motion.div variants={staggerItem}>
          <button
            onClick={() => router.push("/teams")}
            className="text-sm text-foreground/40 transition hover:text-foreground/70"
          >
            &larr; Back to Teams
          </button>
        </motion.div>

        {/* Team Header */}
        <motion.div variants={staggerItem}>
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {team.avatarUrl ? (
                  <img
                    src={team.avatarUrl}
                    alt={team.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neon/10 text-lg font-bold text-neon">
                    {team.tag.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
                    {team.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-sm text-neon">[{team.tag}]</span>
                    <Badge>{team.game}</Badge>
                    {!team.isActive && <Badge variant="danger">Disbanded</Badge>}
                  </div>
                </div>
              </div>

              {team.isActive && (
                <div className="flex flex-wrap gap-2 shrink-0">
                  {isCaptain && (
                    <Button size="sm" variant="secondary" onClick={() => setRegisterOpen(true)}>
                      Register for Tournament
                    </Button>
                  )}
                  {canInvite && (
                    <Button size="sm" onClick={() => setInviteOpen(true)}>
                      Invite Member
                    </Button>
                  )}
                  {canManage && (
                    <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
                      Edit
                    </Button>
                  )}
                  {isMember && !isCaptain && (
                    <Button size="sm" variant="ghost" onClick={handleLeave} disabled={loading}>
                      Leave
                    </Button>
                  )}
                </div>
              )}
            </div>

            {team.bio && (
              <p className="mt-4 text-sm text-foreground/60">{team.bio}</p>
            )}

            {/* Stats row */}
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="text-foreground/40">Record: </span>
                <span className="font-semibold text-foreground">
                  {team.wins}W – {team.losses}L
                </span>
              </div>
              <div>
                <span className="text-foreground/40">Roster: </span>
                <span className="font-semibold text-foreground">
                  {team.members.length}/{team.maxSize}
                </span>
              </div>
              <div>
                <span className="text-foreground/40">Created: </span>
                <span className="text-foreground">
                  {new Date(team.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Roster */}
        <motion.div variants={staggerItem}>
          <h2 className="mb-4 text-lg font-bold text-foreground">Roster</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedMembers.map((member) => (
              <Card key={member.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 min-w-0">
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={member.user.gamertag || member.user.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-lighter text-xs font-medium text-foreground/50">
                      {(member.user.gamertag || member.user.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.user.gamertag || member.user.name}
                    </p>
                    <Badge variant={ROLE_COLORS[member.role] || "neutral"}>
                      {ROLE_LABELS[member.role] || member.role}
                    </Badge>
                  </div>
                </div>

                {canManage && member.userId !== team.captainId && (
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                      className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-neon/50 focus:outline-none"
                    >
                      <option value="co_captain">Co-Captain</option>
                      <option value="member">Member</option>
                      <option value="sub">Sub</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-xs text-danger/60 transition hover:text-danger"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Tournament History */}
        {team.tournamentHistory.length > 0 && (
          <motion.div variants={staggerItem}>
            <h2 className="mb-4 text-lg font-bold text-foreground">Tournament History</h2>
            <div className="flex flex-col gap-2">
              {team.tournamentHistory.map((t) => (
                <Card key={t.id} className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium text-foreground">{t.title}</span>
                  <div className="flex items-center gap-2">
                    {t.placement && (
                      <span className="text-xs text-neon">{t.placement}</span>
                    )}
                    <Badge variant={t.status === "completed" ? "neutral" : "warning"}>
                      {t.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Disband */}
        {canManage && team.isActive && (
          <motion.div variants={staggerItem}>
            <Card className="border-danger/20 p-4">
              <h3 className="mb-2 text-sm font-semibold text-danger">Danger Zone</h3>
              {confirmDisband ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-foreground/60">Are you sure? This cannot be undone.</p>
                  <Button size="sm" variant="danger" onClick={handleDisband} disabled={loading}>
                    Confirm Disband
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDisband(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="danger" onClick={() => setConfirmDisband(true)}>
                  Disband Team
                </Button>
              )}
            </Card>
          </motion.div>
        )}
      </motion.div>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        teamId={team.id}
        teamGame={team.game}
        existingMemberIds={team.members.map((m) => m.userId)}
        allMembers={allMembers}
      />

      <EditTeamModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        team={team}
      />

      <RegisterTeamModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        teamId={team.id}
        teamGame={team.game}
        teamName={team.name}
        teamTag={team.tag}
        memberCount={team.members.length}
      />
    </div>
  );
}
