import '@servicenow/sdk/global'

import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
  $id: Now.ID['idv-status-ajax'],
  name: 'IdvStatusAjax',
  apiName: 'x_entru_entrustidv.IdvStatusAjax',
  active: true,
  clientCallable: true,
  accessibleFrom: 'package_private',
  description:
    'Returns the current Entrust identity verification status for a supported source record.',
  script: Now.include(
    '../../server/ajax/idv-status-ajax.server.js',
  ),
})