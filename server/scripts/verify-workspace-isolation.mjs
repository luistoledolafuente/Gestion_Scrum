import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../dist/generated/prisma/client.js'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const api = 'http://localhost:4000/api'
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const emailA = `workspace-a-${suffix}@example.test`
const emailB = `workspace-b-${suffix}@example.test`

const request = async (path, { cookie, workspaceId, method = 'GET', body } = {}) => {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  return { status: response.status, data: text ? JSON.parse(text) : null, cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

const expect = (condition, message) => { if (!condition) throw new Error(message) }

try {
  const a = await request('/auth/register', { method: 'POST', body: { name: 'Workspace Test A', email: emailA, password: 'test-password-123' } })
  const b = await request('/auth/register', { method: 'POST', body: { name: 'Workspace Test B', email: emailB, password: 'test-password-123' } })
  expect(a.status === 201 && b.status === 201, 'No se pudieron crear las cuentas de prueba')
  const workspaceA = a.data.workspaces[0].id
  const workspaceB = b.data.workspaces[0].id

  const created = await request('/clients', { cookie: a.cookie, workspaceId: workspaceA, method: 'POST', body: { name: 'Cliente aislado', email: `client-${suffix}@example.test` } })
  expect(created.status === 201, 'El propietario no pudo crear un cliente')
  const isolated = await request('/clients', { cookie: b.cookie, workspaceId: workspaceB })
  expect(isolated.status === 200 && isolated.data.length === 0, 'La segunda cuenta pudo ver datos ajenos')
  const forbiddenWorkspace = await request('/clients', { cookie: b.cookie, workspaceId: workspaceA })
  expect(forbiddenWorkspace.status === 403, 'Se aceptó un workspace sin membresía')

  const shared = await request('/workspaces/current/members', { cookie: a.cookie, workspaceId: workspaceA, method: 'POST', body: { email: emailB, role: 'CLIENT' } })
  expect(shared.status === 201, 'No se pudo compartir el workspace')
  const readShared = await request('/clients', { cookie: b.cookie, workspaceId: workspaceA })
  expect(readShared.status === 200 && readShared.data.length === 1, 'El cliente no pudo leer el workspace compartido')
  const forbiddenWrite = await request('/clients', { cookie: b.cookie, workspaceId: workspaceA, method: 'POST', body: { name: 'No permitido', email: `blocked-${suffix}@example.test` } })
  expect(forbiddenWrite.status === 403, 'El rol de cliente pudo modificar datos')

  const promoted = await request(`/workspaces/current/members/${shared.data.id}`, { cookie: a.cookie, workspaceId: workspaceA, method: 'PATCH', body: { role: 'EDITOR' } })
  expect(promoted.status === 200, 'No se pudo cambiar el rol a editor')
  const editorWrite = await request('/clients', { cookie: b.cookie, workspaceId: workspaceA, method: 'POST', body: { name: 'Permitido', email: `allowed-${suffix}@example.test` } })
  expect(editorWrite.status === 201, 'El editor no pudo modificar el workspace')
  console.log('Workspace isolation, sharing and roles: OK')
} finally {
  const users = await prisma.user.findMany({ where: { email: { in: [emailA, emailB] } }, select: { id: true } })
  const userIds = users.map((user) => user.id)
  const owned = await prisma.workspaceMember.findMany({ where: { userId: { in: userIds }, role: 'OWNER' }, select: { workspaceId: true } })
  await prisma.workspace.deleteMany({ where: { id: { in: owned.map((item) => item.workspaceId) } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
}
