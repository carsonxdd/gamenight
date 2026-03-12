"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "@/app/admin/access-actions";

interface PendingUser {
  id: string;
  name: string;
  avatar: string | null;
  discordId: string;
  createdAt: string;
}

export default function ApprovalQueuePanel() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    const result = await getPendingUsers();
    if ("users" in result) {
      setUsers(result.users as unknown as PendingUser[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleApprove = async (id: string) => {
    await approveUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleReject = async (id: string) => {
    await rejectUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (loading) {
    return <p className="text-sm text-foreground/40">Loading...</p>;
  }

  return (
    <motion.div {...fadeIn} className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Approval Queue</h3>
        <p className="text-xs text-foreground/40">
          {users.length === 0
            ? "No pending approvals"
            : `${users.length} user${users.length !== 1 ? "s" : ""} waiting for approval`}
        </p>
      </div>

      {users.map((user) => (
        <Card key={user.id} className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-lighter text-xs text-foreground/40">
                ?
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-foreground/30">
                Signed up {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(user.id)}
              className="rounded-lg bg-neon/10 px-3 py-1 text-xs font-medium text-neon transition hover:bg-neon/20"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(user.id)}
              className="rounded-lg bg-danger/10 px-3 py-1 text-xs font-medium text-danger transition hover:bg-danger/20"
            >
              Reject
            </button>
          </div>
        </Card>
      ))}
    </motion.div>
  );
}
