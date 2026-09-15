import type { RequestHandler } from 'express';
import { workspaceAccess } from '../types/workspace.js';
import { workspacesService } from '../services/workspaces.service.js';

export const workspacesController = {
  current: (async (req, res) => res.json(await workspacesService.current(workspaceAccess(req)))) as RequestHandler,
  members: (async (req, res) => res.json(await workspacesService.members(workspaceAccess(req)))) as RequestHandler,
  addMember: (async (req, res) => res.status(201).json(await workspacesService.addMember(req.body, workspaceAccess(req)))) as RequestHandler,
  updateMember: (async (req, res) => res.json(await workspacesService.updateMember(String(req.params.memberId), req.body, workspaceAccess(req)))) as RequestHandler,
  removeMember: (async (req, res) => { await workspacesService.removeMember(String(req.params.memberId), workspaceAccess(req)); res.status(204).send(); }) as RequestHandler,
};
