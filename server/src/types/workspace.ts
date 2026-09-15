import type { Request } from 'express';

export type WorkspaceAccess = {
  userId: string;
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'MEMBER' | 'CLIENT';
};

export const workspaceAccess = (req: Request): WorkspaceAccess => ({
  userId: req.authUser!.id,
  workspaceId: req.authWorkspaceId!,
  role: req.authWorkspaceRole!,
});
