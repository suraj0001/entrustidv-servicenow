// @ts-nocheck
var ApiConnectionAjax = Class.create();

// eslint-disable-next-line no-unsupported-node-builtins -- `global` refers to the ServiceNow global scope object here, not Node's global
ApiConnectionAjax.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
  getConfig: function () {
    return _call(this, (svc) => svc.getConfig());
  },

  getAliasInfo: function () {
    return _call(this, (svc) => svc.getAliasInfo());
  },

  saveConfig: function () {
    return _call(this, (svc) =>
      svc.saveConfig({
        region: this.getParameter('sysparm_region'),
        clientId: this.getParameter('sysparm_client_id') || undefined,
        clientSecret: this.getParameter('sysparm_client_secret') || undefined,
      })
    );
  },

  testConnection: function () {
    return _call(this, (svc) =>
      svc.testConnection(
        this.getParameter('sysparm_region'),
        this.getParameter('sysparm_client_id'),
        this.getParameter('sysparm_client_secret')
      )
    );
  },

  type: 'ApiConnectionAjax',
});

function _call(ctx, fn) {
  var svc;
  try {
    svc = require('./src/server/services/api-connection-service.ts');
    return JSON.stringify(fn(svc));
  } catch (err) {
    gs.error('[ApiConnectionAjax] ' + err);
    return JSON.stringify({ success: false, message: 'Server error: ' + err });
  }
}
