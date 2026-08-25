import '@servicenow/sdk/global'

import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
  $id: Now.ID['idv-status-onload-incident'],

  name: 'IDV - Load Verification Status - Incident',

  table: 'incident',

  type: 'onLoad',

  active: true,

  uiType: 'all',

  appliesExtended: false,

  isolateScript: false,

  script: Now.include(
    '../../client/idv-status-onload.client.js',
  ),
})

ClientScript({
  $id: Now.ID['idv-status-onload-hr-case'],

  name: 'IDV - Load Verification Status - HR Case',

  table: 'sn_hr_core_case',

  type: 'onLoad',

  active: true,

  uiType: 'all',

  appliesExtended: false,

  isolateScript: false,

  script: Now.include(
    '../../client/idv-status-onload.client.js',
  ),
})