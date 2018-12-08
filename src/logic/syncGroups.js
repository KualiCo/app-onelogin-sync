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
    let res
    try {
      res = await kualiRequest.get(
        `/api/v1/groups?fields(${kualiOneLoginFieldId})=${role.id}`
      )
    } catch (err) {
      log.error({ err, event: 'ERROR', attempted: 'GET_ROLE', roleId: role.id })
    }

    if (res.data && res.data[0]) {
      const kualiGroup = res.data[0]

      const updateGroup = {
        name: role.name
      }

      try {
        await kualiRequest.put(`/api/v1/groups/${kualiGroup.id}`, updateGroup)
        log.debug({ event: 'GROUP_UPDATE', updateGroup })
      } catch (err) {
        log.error({
          err,
          event: 'ERROR',
          attempted: 'GROUP_UPDATE',
          updateGroup,
          groupId: kualiGroup.id
        })
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
        log.info({ event: 'GROUP_CREATE', newGroup })
      } catch (err) {
        log.error({ err, event: 'ERROR', attempted: 'GROUP_CREATE', newGroup })
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
      log.info(
        { event: 'GROUP_DELETE', kualiGroup },
        `Deleting ${kualiGroup.name}`
      )
      try {
        await kualiRequest.delete(`/api/v1/groups/${kualiGroup.id}`)
      } catch (err) {
        log.error({
          err,
          event: 'ERROR',
          attempted: 'GROUP_DELETE',
          kualiGroup
        })
      }
    }
  })
}

module.exports = syncGroups
