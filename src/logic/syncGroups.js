const config = require('config')
const log = require('kuali-logger')(config.get('log'))
const oneLoginRequest = require('../lib/oneLoginRequest')
const kualiRequest = require('../lib/kualiRequest')

const kualiOneLoginCategoryId = config.kuali.oneLoginCategoryId
const kualiOneLoginFieldId = config.kuali.oneLoginFieldId

const syncGroups = async () => {
  const req = await oneLoginRequest
  let roles = []
  let res = await req.get('/api/1/roles')

  roles = roles.concat(res.data.data)

  while (res.data.pagination && res.data.pagination.after_cursor) {
    res = await req.get(
      `/api/1/roles?after_cursor=${res.data.pagination.after_cursor}`
    )
    roles = roles.concat(res.data.data)
  }

  log.info({ event: 'SYNC' }, `Syncing ${roles.length} groups`)

  roles.forEach(async role => {
    const res = await kualiRequest.get(
      `/api/v1/groups?fields(${kualiOneLoginFieldId})=${role.id}`
    )
    if (res.data && res.data[0]) {
      const kualiGroup = res.data[0]

      const updateGroup = {
        name: role.name
      }

      try {
        await kualiRequest.put(`/api/v1/groups/${kualiGroup.id}`, updateGroup)
        log.debug({ event: 'GROUP_UPDATE' }, updateGroup.name)
      } catch (err) {
        log.error({ err, event: 'ERROR' })
      }
    } else {
      const newGroup = {
        name: role.name,
        categoryId: kualiOneLoginCategoryId,
        fields: [
          {
            id: kualiOneLoginFieldId,
            value: role.id
          }
        ]
      }
      try {
        await kualiRequest.post('/api/v1/groups', newGroup)
        log.info({ event: 'GROUP_CREATE' }, newGroup.name)
      } catch (err) {
        log.error({ err, event: 'ERROR' })
      }
    }
  })

  const response = await kualiRequest.get(
    `/api/v1/groups?categoryId=${kualiOneLoginCategoryId}`
  )
  const kualiGroups = response.data
  kualiGroups.forEach(async kualiGroup => {
    let i = kualiGroup.fields.findIndex(f => f.id === kualiOneLoginFieldId)
    const oneLoginId = kualiGroup.fields[i].value
    let index = roles.findIndex(r => r.id.toString() === oneLoginId)
    if (index === -1) {
      log.debug({ event: 'GROUP_DELETE' }, `Deleting ${kualiGroup.name}`)
      try {
        await kualiRequest.delete(`/api/v1/groups/${kualiGroup.id}`)
      } catch (err) {
        log.error({ err, event: 'ERROR' })
      }
    }
  })
}

module.exports = syncGroups
