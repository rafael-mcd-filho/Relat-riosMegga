import type { Attendance, Channel, Status, Team, User } from '../types'

export const apiConfig = {
  enabled: false,
  baseUrl: '',
  endpoints: {
    channels: '/channels',
    users: '/users',
    teams: '/teams',
    attendances: '/attendances',
  },
}

export const channels: Channel[] = [
  {
    id: '444f8422-fd06-4663-9a04-f66a922fc1ea',
    name: '(83) 98680-8280',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98680-8280',
  },
  {
    id: 'ce4173a6-56c7-4d58-bdb5-313da019b1f7',
    name: '(83) 98105-3016',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98105-3016',
  },
  {
    id: 'af067a0b-d286-4224-a18c-8ab843fe0e9a',
    name: '(83) 98680-8172',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98680-8172',
  },
  {
    id: '0cfd5727-3b65-4278-ba4c-7adee4463306',
    name: 'Instagram',
    accent: '#FF8A50',
    type: 'INSTAGRAM',
    number: null,
  },
  {
    id: '929fbd4f-12bc-487e-8f6f-79cd9ab363cc',
    name: '(83) 98680-8569',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98680-8569',
  },
  {
    id: 'dfc2c16e-58b0-4b36-893d-216713b6ec7c',
    name: '(83) 99185-8341',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 99185-8341',
  },
  {
    id: 'c511890b-ea52-471f-b1a1-c7b571a75ce7',
    name: '(83) 98162-4622',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98162-4622',
  },
  {
    id: '2100fc12-d9eb-41b2-b0f2-95fd5780c4a5',
    name: '(83) 98680-8676',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98680-8676',
  },
  {
    id: '0c3fb127-400d-497f-aaaf-3534a673d92e',
    name: '(83) 99642-5970',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 99642-5970',
  },
  {
    id: '49b28fb0-6919-419a-91c7-b02a88e1c1a2',
    name: '(83) 98850-2940',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98850-2940',
  },
  {
    id: '94d122a3-011d-4411-860e-d79ac054d6f2',
    name: '(83) 98680-8613',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98680-8613',
  },
  {
    id: '6534ce4c-b631-45ed-8c6b-efc113a62fc4',
    name: '(83) 98162-4317',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98162-4317',
  },
  {
    id: '45f285e9-38c7-4015-b44f-b7391618e291',
    name: '(83) 98105-3180',
    accent: '#25D366',
    type: 'Nao Oficial',
    number: '(83) 98105-3180',
  },
  {
    id: 'b996ea6f-4fe8-4288-a4bc-58d58dc72a15',
    name: '(83) 99841-5194',
    accent: '#1d9bf0',
    type: 'WABA',
    number: '(83) 99841-5194',
  },
]

export const teams: Team[] = [
  { id: '182b8d4a-152d-4fea-b8a4-b46ccae1e26f', name: 'LIVIA MATOS', accent: '#2563eb' },
  { id: 'b5eade7f-5ee1-4a92-8a3d-569ff29aa9df', name: 'TAMARA', accent: '#0f766e' },
  { id: '40465a9a-fef8-47e3-afa6-501d390d8945', name: 'THAIS', accent: '#7c3aed' },
  { id: '57aa3e85-bbf4-4e6b-a1a6-809d11aecac6', name: 'SAMILLE', accent: '#ea580c' },
  { id: '35f289ce-d6d2-44ff-94f9-4e6b13d4bc37', name: 'Geral', accent: '#475569' },
  { id: 'af6aad44-0a94-4075-b262-7b30decfaecf', name: 'RAYNARA', accent: '#be123c' },
  { id: '892a06d0-ff8d-488b-af34-0be75a56f516', name: 'Insta - Cabedelo', accent: '#db2777' },
  { id: 'b4f557f0-ceec-48ea-9801-d6dedf5b2c10', name: 'MATHEUS', accent: '#0284c7' },
  { id: '86f99744-bb18-47ca-a81a-6cb7339ec839', name: 'WhatsApp - Cabedelo', accent: '#16a34a' },
  { id: 'a846c676-98e5-4068-be3d-dc9e052e34f9', name: 'JOCIARA', accent: '#9333ea' },
  { id: '243b8816-528d-4702-bb9a-4923c421b691', name: 'ALINE', accent: '#0891b2' },
  { id: '83338d4b-c873-4f5c-81ce-8550f89d1dd9', name: 'RAFAELLA', accent: '#c2410c' },
  { id: 'e4e2e74e-a716-40b2-98f5-cca0098240d0', name: 'CASSIA', accent: '#7c2d12' },
  { id: '4da0f018-d114-4e7a-b52e-1aeb552402cd', name: 'FERNANDA', accent: '#1d4ed8' },
]

export const users: User[] = [
  { id: '06ad2c3f-fa7c-484a-b336-a381255a8bca', name: 'Maria Eduarda', teamId: '35f289ce-d6d2-44ff-94f9-4e6b13d4bc37' },
  { id: '09b6f5e0-0990-46c6-8ace-ba6831f8df91', name: 'Jociara', teamId: 'a846c676-98e5-4068-be3d-dc9e052e34f9' },
  { id: '0f0afbfd-cbd7-4113-90ff-7f38a9649435', name: 'Raynara', teamId: 'af6aad44-0a94-4075-b262-7b30decfaecf' },
  { id: '0f9e2105-ce2e-449b-978a-9b73d598fae8', name: 'Matheus', teamId: 'b4f557f0-ceec-48ea-9801-d6dedf5b2c10' },
  { id: '1d496fcc-96ba-4657-b02f-6138c381d206', name: 'Mayara', teamId: '35f289ce-d6d2-44ff-94f9-4e6b13d4bc37' },
  { id: '2b23922d-634d-4727-82f4-e96febc8c846', name: 'Bruno', teamId: '35f289ce-d6d2-44ff-94f9-4e6b13d4bc37' },
  { id: '45368651-418d-4075-a44f-7c5b1d2e7e8b', name: 'Cassia', teamId: 'e4e2e74e-a716-40b2-98f5-cca0098240d0' },
  { id: '6b5f7b66-b630-4876-9a35-1b4c726b70b3', name: 'Rafaella', teamId: '83338d4b-c873-4f5c-81ce-8550f89d1dd9' },
  { id: '9abb2dfd-576d-4763-9eca-1d78156297d1', name: 'Thais', teamId: '40465a9a-fef8-47e3-afa6-501d390d8945' },
  { id: 'a75d29ff-c8dc-4568-b50e-0c6a03070ab1', name: 'Aline', teamId: '243b8816-528d-4702-bb9a-4923c421b691' },
  { id: 'b9af1aa8-8218-40bc-8a6f-6297d7972a7f', name: 'Livia', teamId: '182b8d4a-152d-4fea-b8a4-b46ccae1e26f' },
  { id: 'c4c65969-d429-43c5-9309-ce0a65ab139a', name: 'Fernanda', teamId: '4da0f018-d114-4e7a-b52e-1aeb552402cd' },
  { id: 'de05ca6b-9cfc-47bc-a0ef-cf3157858cdd', name: 'Samille', teamId: '57aa3e85-bbf4-4e6b-a1a6-809d11aecac6' },
  { id: 'e5f07256-c9d7-4a3e-82cf-90c2fe71c6b2', name: 'Tamara', teamId: 'b5eade7f-5ee1-4a92-8a3d-569ff29aa9df' },
  { id: 'eabf9d01-261f-49bd-be34-d3f5c9bff557', name: 'Kaline', teamId: '35f289ce-d6d2-44ff-94f9-4e6b13d4bc37' },
]

const subjects = [
  'Atualizacao cadastral',
  'Status do pedido',
  'Segunda via de boleto',
  'Suporte tecnico',
  'Ajuste de contrato',
  'Solicitacao de estorno',
  'Divergencia financeira',
  'Troca de titularidade',
  'Entrega fora do prazo',
  'Bloqueio de acesso',
]

function getSlaTarget(channelId: Channel['id']) {
  const channel = channels.find((item) => item.id === channelId)

  switch (channel?.type) {
    case 'Nao Oficial':
      return 40
    case 'INSTAGRAM':
      return 55
    case 'WABA':
      return 35
    default:
      return 60
  }
}

function buildStatus(seed: number): Status {
  if (seed % 11 === 0) {
    return 'Pendente'
  }

  if (seed % 7 === 0) {
    return 'Em andamento'
  }

  return 'Resolvido'
}

export function generateMockAttendances(daysBack = 60): Attendance[] {
  const items: Attendance[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let sequence = 1

  for (let offset = daysBack - 1; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)

    let dailyVolume = 7 + ((offset * 3) % 7)

    if (day.getDay() === 1) {
      dailyVolume += 4
    }

    if (day.getDay() === 0) {
      dailyVolume = Math.max(3, dailyVolume - 3)
    }

    if (day.getDay() === 6) {
      dailyVolume = Math.max(4, dailyVolume - 2)
    }

    for (let slot = 0; slot < dailyVolume; slot += 1) {
      const user = users[(offset + slot * 2) % users.length]
      const channel = channels[(offset * 2 + slot) % channels.length]
      const status = buildStatus(offset + slot)
      const resolutionMinutes =
        status === 'Resolvido' ? 14 + ((offset * 19 + slot * 23) % 360) : null
      const createdAt = new Date(day)
      const hour = 8 + ((slot + offset) % 10)
      const minutes = (slot * 11 + offset * 7) % 60
      createdAt.setHours(hour, minutes, 0, 0)

      const resolvedAt =
        resolutionMinutes === null
          ? null
          : new Date(createdAt.getTime() + resolutionMinutes * 60_000).toISOString()

      items.push({
        id: `attendance-${sequence}`,
        protocol: `ATD-${String(sequence).padStart(5, '0')}`,
        subject: subjects[(offset + slot) % subjects.length],
        createdAt: createdAt.toISOString(),
        resolvedAt,
        channelId: channel.id,
        userId: user.id,
        teamId: user.teamId,
        status,
        resolutionMinutes,
        slaTargetMinutes: getSlaTarget(channel.id),
        slaMet:
          resolutionMinutes !== null &&
          resolutionMinutes <= getSlaTarget(channel.id),
        satisfaction: resolutionMinutes === null ? null : 3 + ((offset + slot) % 3),
      })

      sequence += 1
    }
  }

  return items.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}
