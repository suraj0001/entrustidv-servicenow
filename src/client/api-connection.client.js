// BASE_URLS must match src/server/entrust/entrust-auth-client.ts
var API_VERSION = 'v3.6';
var BASE_URLS = {
  us: 'https://api.us.onfido.com',
  eu: 'https://api.eu.onfido.com',
  ca: 'https://api.ca.onfido.com',
};

var _idvHasStoredCredentials = false;
var MIN_LEN = 5;
var MAX_LEN = 255;

// --- Helpers ---

function _el(id) {
  return document.getElementById(id);
}

// Wraps GlideAjax call; parses JSON answer and passes result object to callback
function _ajax(method, params, callback) {
  var ga = new GlideAjax('x_entru_entrustidv.ApiConnectionAjax');
  ga.addParam('sysparm_name', method);
  for (var key in params) {
    if (params[key] !== undefined) ga.addParam(key, params[key]);
  }
  ga.getXMLAnswer(function (answer) {
    var result = null;
    try {
      result = JSON.parse(answer);
    } catch (e) {}
    callback(result);
  });
}

function _validateCredentialLength(value, label) {
  if (value.length < MIN_LEN || value.length > MAX_LEN)
    return label + ' must be between ' + MIN_LEN + ' and ' + MAX_LEN + ' characters.';
  return null;
}

function _idvShowFieldError(fieldId, message) {
  var field = _el(fieldId);
  var error = _el(fieldId + '_error');
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', error.id);
  error.textContent = message;
  error.style.display = 'block';
}

function _idvClearFieldError(fieldId) {
  var field = _el(fieldId);
  var error = _el(fieldId + '_error');
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
  error.textContent = '';
  error.style.display = 'none';
}

function _idvClearValidationErrors() {
  ['idv_region', 'idv_client_id', 'idv_client_secret'].forEach(_idvClearFieldError);
}

function _idvValidateCredentialFields(clientId, clientSecret, required, isStoredCredentialRetest) {
  var valid = true;

  if (!clientId) {
    if (required || clientSecret) {
      _idvShowFieldError(
        'idv_client_id',
        isStoredCredentialRetest
          ? 'Enter a new Client ID to re-test, or click Save to keep the existing credentials.'
          : 'Client ID is required.'
      );
      valid = false;
    }
  } else {
    var clientIdError = _validateCredentialLength(clientId, 'Client ID');
    if (clientIdError) {
      _idvShowFieldError('idv_client_id', clientIdError);
      valid = false;
    }
  }

  if (!clientSecret) {
    if (required || clientId) {
      _idvShowFieldError(
        'idv_client_secret',
        isStoredCredentialRetest
          ? 'Enter a new Client Secret to re-test, or click Save to keep the existing credentials.'
          : 'Client Secret is required.'
      );
      valid = false;
    }
  } else {
    var clientSecretError = _validateCredentialLength(clientSecret, 'Client Secret');
    if (clientSecretError) {
      _idvShowFieldError('idv_client_secret', clientSecretError);
      valid = false;
    }
  }

  return valid;
}

function _idvFocusFirstInvalidField() {
  var field = document.querySelector('[aria-invalid="true"]');
  if (field) field.focus();
}

function _idvShowServerValidationError(message) {
  if (/^Client ID\b/.test(message)) {
    _idvShowFieldError('idv_client_id', message);
    return true;
  }
  if (/^Client Secret\b/.test(message)) {
    _idvShowFieldError('idv_client_secret', message);
    return true;
  }
  if (/^Region is required\.|^Unsupported region:/.test(message)) {
    _idvShowFieldError('idv_region', message);
    return true;
  }
  if (message === 'Provide both Client ID and Client Secret, or neither.') {
    _idvValidateCredentialFields(
      _el('idv_client_id').value.trim(),
      _el('idv_client_secret').value,
      true
    );
    return true;
  }
  if (message === 'Region, Client ID and Client Secret are all required.') {
    var region = _el('idv_region').value.trim();
    if (!region) _idvShowFieldError('idv_region', 'Region is required.');
    _idvValidateCredentialFields(
      _el('idv_client_id').value.trim(),
      _el('idv_client_secret').value,
      true
    );
    return true;
  }
  return false;
}

function _idvEnableSave() {
  _el('btn_save').disabled = false;
  var wrap = _el('btn_save_wrap');
  if (wrap) {
    wrap.title = '';
    wrap.style.cursor = 'auto';
  }
}

function _idvDisableSave() {
  _el('btn_save').disabled = true;
  var wrap = _el('btn_save_wrap');
  if (wrap) {
    wrap.title = 'Run a successful Test Connection to enable Save';
    wrap.style.cursor = 'not-allowed';
  }
}

function _idvShowStatus(type, message) {
  var box = _el('status_box');
  box.className = 'status' + (type ? ' ' + type : '');
  box.textContent = message;
  box.style.display = message ? 'block' : 'none';
}

function _setStoredCredentialPlaceholders() {
  _el('idv_client_id').placeholder = 'Configured — enter a new value to replace';
  _el('idv_client_secret').placeholder = 'Configured — enter a new value to replace';
  _el('idv_credentials_hint').style.display = 'block';
}

function _clearStoredCredentialPlaceholders() {
  _idvHasStoredCredentials = false;
  _el('idv_client_id').placeholder = 'Enter your Entrust Client ID';
  _el('idv_client_secret').placeholder = 'Enter your Entrust Client Secret';
  _el('idv_credentials_hint').style.display = 'none';
}

// --- Initialisation ---

document.addEventListener('DOMContentLoaded', function () {
  _ajax('getConfig', {}, function (config) {
    if (!config || !config.success) return;
    if (config.region) _el('idv_region').value = config.region;
    if (config.baseUrl) _el('idv_base_url').value = config.baseUrl;
    if (config.tokenUrl) _el('idv_token_url').value = config.tokenUrl;
    if (config.connectionTested) {
      _idvHasStoredCredentials = true;
      _setStoredCredentialPlaceholders();
    }
  });
});

// --- Region change ---

_el('idv_region').addEventListener('change', function () {
  _idvClearFieldError('idv_region');
  var base = BASE_URLS[this.value] || '';
  _el('idv_base_url').value = base;
  _el('idv_token_url').value = base ? base + '/' + API_VERSION + '/oauth/token' : '';
  if (_idvHasStoredCredentials) _clearStoredCredentialPlaceholders();
  _idvShowStatus('', '');
  _idvDisableSave();
});

// Credential edits invalidate the last successful test
['idv_client_id', 'idv_client_secret'].forEach(function (id) {
  _el(id).addEventListener('input', function () {
    _idvClearFieldError(id);
    _idvShowStatus('', '');
    _idvDisableSave();
  });
});

// --- Test Connection ---

_el('btn_test').addEventListener('click', function () {
  var region = _el('idv_region').value.trim();
  var clientId = _el('idv_client_id').value.trim();
  var clientSecret = _el('idv_client_secret').value;
  var btn = _el('btn_test');
  var valid = true;

  _idvClearValidationErrors();
  _idvShowStatus('', '');

  if (!region) {
    _idvShowFieldError('idv_region', 'Region is required.');
    valid = false;
  }

  if (!_idvValidateCredentialFields(clientId, clientSecret, true, _idvHasStoredCredentials))
    valid = false;

  if (!valid) {
    _idvFocusFirstInvalidField();
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Testing…';
  _idvShowStatus('', 'Connecting to Entrust IDV…');

  _ajax(
    'testConnection',
    {
      sysparm_region: region,
      sysparm_client_id: clientId,
      sysparm_client_secret: clientSecret,
    },
    function (result) {
      btn.disabled = false;
      btn.textContent = 'Test Connection';
      if (result && result.success) {
        _idvShowStatus('success', '✅ ' + result.message);
        _idvEnableSave();
      } else {
        var message = result ? result.message : 'Unknown error.';
        if (!_idvShowServerValidationError(message)) _idvShowStatus('error', '❌ ' + message);
        _idvFocusFirstInvalidField();
        _idvDisableSave();
      }
    }
  );
});

// --- Save ---

_el('btn_save').addEventListener('click', function () {
  var region = _el('idv_region').value.trim();
  var baseUrl = _el('idv_base_url').value.trim();
  var tokenUrl = _el('idv_token_url').value.trim();
  var clientId = _el('idv_client_id').value.trim();
  var clientSecret = _el('idv_client_secret').value;
  var btn = this;
  var valid = true;

  _idvClearValidationErrors();
  _idvShowStatus('', '');

  if (!region || !baseUrl || !tokenUrl) {
    _idvShowFieldError('idv_region', 'Region is required.');
    valid = false;
  }

  var hasNew = clientId.length > 0 || clientSecret.length > 0;
  if (!_idvValidateCredentialFields(clientId, clientSecret, !_idvHasStoredCredentials || hasNew)) {
    valid = false;
  }

  if (!valid) {
    _idvFocusFirstInvalidField();
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving…';
  _idvShowStatus('', 'Saving configuration…');

  _ajax('getAliasInfo', {}, function (info) {
    if (!info || !info.success) {
      _idvEnableSave();
      btn.textContent = 'Save';
      _idvShowStatus('error', '❌ ' + (info ? info.message : 'Unknown error.'));
      return;
    }

    if (info.hasConnection) {
      _idvFinishSave(region, baseUrl, tokenUrl, clientId, clientSecret, btn);
      return;
    }

    // First-time: create Connection & Credential via platform helper
    var ccGa = new GlideAjax('global.ConnectionAndCredentialHelper');
    ccGa.addParam('sysparm_name', 'createConnectionAndCredential');
    ccGa.addParam(
      'sysparm_formData',
      JSON.stringify({
        'connection.name': 'Entrust IDV Connection',
        'connection.connection_url': baseUrl,
        'credential.oauth_entity.client_id': clientId,
        'credential.oauth_entity.client_secret': clientSecret,
        'credential.oauth_entity.token_url': tokenUrl,
      })
    );
    ccGa.addParam('sysparm_aliasSysID', info.aliasSysId);
    ccGa.getXMLAnswer(function (ccAnswer) {
      if (ccAnswer && /error|exception/i.test(ccAnswer)) {
        _idvEnableSave();
        btn.textContent = 'Save';
        _idvShowStatus('error', '❌ Failed to create connection: ' + ccAnswer);
        return;
      }
      _idvFinishSave(region, baseUrl, tokenUrl, clientId, clientSecret, btn);
    });
  });
});

function _idvFinishSave(region, baseUrl, tokenUrl, clientId, clientSecret, btn) {
  _ajax(
    'saveConfig',
    {
      sysparm_region: region,
      sysparm_base_url: baseUrl,
      sysparm_token_url: tokenUrl,
      sysparm_client_id: clientId || undefined,
      sysparm_client_secret: clientSecret || undefined,
    },
    function (result) {
      btn.textContent = 'Save';
      _idvEnableSave();
      if (result && result.success) {
        _idvShowStatus('success', '✅ ' + result.message);
      } else {
        var message = result ? result.message : 'Unknown error.';
        if (!_idvShowServerValidationError(message)) _idvShowStatus('error', '❌ ' + message);
        _idvFocusFirstInvalidField();
      }
    }
  );
}
