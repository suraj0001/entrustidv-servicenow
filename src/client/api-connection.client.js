/* eslint-disable */

// BASE_URLS must match src/server/entrust/entrust-auth-client.ts
var API_VERSION = "v3.6";
var BASE_URLS = {
  us: "https://api.us.onfido.com",
  eu: "https://api.eu.onfido.com",
  ca: "https://api.ca.onfido.com",
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
  var ga = new GlideAjax("x_entru_entrustidv.ApiConnectionAjax");
  ga.addParam("sysparm_name", method);
  for (var key in params) {
    if (params[key] !== undefined) ga.addParam(key, params[key]);
  }
  ga.getXMLAnswer((answer) => {
    var result = null;
    try {
      result = JSON.parse(answer);
    } catch (e) {}
    callback(result);
  });
}

// Returns an error message string or null if the credential fields are valid
function _validateCredentialLength(clientId, clientSecret) {
  if (clientId.length < MIN_LEN || clientId.length > MAX_LEN)
    return "Client ID must be between " + MIN_LEN + " and " + MAX_LEN + " characters.";
  if (clientSecret.length < MIN_LEN || clientSecret.length > MAX_LEN)
    return "Client Secret must be between " + MIN_LEN + " and " + MAX_LEN + " characters.";
  return null;
}

function _idvEnableSave() {
  _el("btn_save").disabled = false;
  var wrap = _el("btn_save_wrap");
  if (wrap) {
    wrap.title = "";
    wrap.style.cursor = "auto";
  }
}

function _idvDisableSave() {
  _el("btn_save").disabled = true;
  var wrap = _el("btn_save_wrap");
  if (wrap) {
    wrap.title = "Run a successful Test Connection to enable Save";
    wrap.style.cursor = "not-allowed";
  }
}

function _idvShowStatus(type, message) {
  var box = _el("status_box");
  box.className = "status" + (type ? " " + type : "");
  box.textContent = message;
  box.style.display = message ? "block" : "none";
}

function _setStoredCredentialPlaceholders() {
  _el("idv_client_id").placeholder = "Stored — enter to update";
  _el("idv_client_secret").placeholder = "Stored — enter to update";
  _el("idv_credentials_hint").style.display = "block";
}

function _clearStoredCredentialPlaceholders() {
  _idvHasStoredCredentials = false;
  _el("idv_client_id").placeholder = "Enter your Entrust Client ID";
  _el("idv_client_secret").placeholder = "Enter your Entrust Client Secret";
  _el("idv_credentials_hint").style.display = "none";
}

// --- Initialisation ---

document.addEventListener("DOMContentLoaded", () => {
  _ajax("getConfig", {}, (config) => {
    if (!config || !config.success) return;
    if (config.region) _el("idv_region").value = config.region;
    if (config.baseUrl) _el("idv_base_url").value = config.baseUrl;
    if (config.tokenUrl) _el("idv_token_url").value = config.tokenUrl;
    if (config.connectionTested) {
      _idvHasStoredCredentials = true;
      _setStoredCredentialPlaceholders();
    }
  });
});

// --- Region change ---

_el("idv_region").addEventListener("change", function () {
  var base = BASE_URLS[this.value] || "";
  _el("idv_base_url").value = base;
  _el("idv_token_url").value = base ? base + "/" + API_VERSION + "/oauth/token" : "";
  if (_idvHasStoredCredentials) _clearStoredCredentialPlaceholders();
  _idvShowStatus("", "");
  _idvDisableSave();
});

// Credential edits invalidate the last successful test
["idv_client_id", "idv_client_secret"].forEach((id) => {
  _el(id).addEventListener("input", _idvDisableSave);
});

// --- Test Connection ---

_el("btn_test").addEventListener("click", () => {
  var region = _el("idv_region").value.trim();
  var clientId = _el("idv_client_id").value.trim();
  var clientSecret = _el("idv_client_secret").value;
  var btn = _el("btn_test");

  if (!region) {
    _idvShowStatus("error", "Please select a region.");
    return;
  }

  if (!clientId || !clientSecret) {
    _idvShowStatus(
      "error",
      _idvHasStoredCredentials
        ? "Enter a new Client ID and Client Secret to re-test, or click Save to keep the existing credentials."
        : "Client ID and Client Secret are required to test the connection.",
    );
    return;
  }

  var lenError = _validateCredentialLength(clientId, clientSecret);
  if (lenError) {
    _idvShowStatus("error", lenError);
    return;
  }

  btn.disabled = true;
  btn.textContent = "Testing…";
  _idvShowStatus("", "Connecting to Entrust IDV…");

  _ajax(
    "testConnection",
    {
      sysparm_region: region,
      sysparm_client_id: clientId,
      sysparm_client_secret: clientSecret,
    },
    (result) => {
      btn.disabled = false;
      btn.textContent = "Test Connection";
      if (result && result.success) {
        _idvShowStatus("success", "✅ " + result.message);
        _idvEnableSave();
      } else {
        _idvShowStatus("error", "❌ " + (result ? result.message : "Unknown error."));
        _idvDisableSave();
      }
    },
  );
});

// --- Save ---

_el("btn_save").addEventListener("click", function () {
  var region = _el("idv_region").value.trim();
  var baseUrl = _el("idv_base_url").value.trim();
  var tokenUrl = _el("idv_token_url").value.trim();
  var clientId = _el("idv_client_id").value.trim();
  var clientSecret = _el("idv_client_secret").value;

  if (!region || !baseUrl || !tokenUrl) {
    _idvShowStatus("error", "Please select a region.");
    return;
  }

  var hasNew = clientId.length > 0 || clientSecret.length > 0;
  if (!_idvHasStoredCredentials && !hasNew) {
    _idvShowStatus("error", "Client ID and Client Secret are required.");
    return;
  }
  if (hasNew) {
    var lenError = _validateCredentialLength(clientId, clientSecret);
    if (lenError) {
      _idvShowStatus("error", lenError);
      return;
    }
  }

  this.disabled = true;
  this.textContent = "Saving…";
  _idvShowStatus("", "Saving configuration…");

  _ajax("getAliasInfo", {}, (info) => {
    if (!info || !info.success) {
      _idvEnableSave();
      this.textContent = "Save";
      _idvShowStatus("error", "❌ " + (info ? info.message : "Unknown error."));
      return;
    }

    if (info.hasConnection) {
      _idvFinishSave(region, baseUrl, tokenUrl, clientId, clientSecret, this);
      return;
    }

    // First-time: create Connection & Credential via platform helper
    var ccGa = new GlideAjax("global.ConnectionAndCredentialHelper");
    ccGa.addParam("sysparm_name", "createConnectionAndCredential");
    ccGa.addParam(
      "sysparm_formData",
      JSON.stringify({
        "connection.name": "Entrust IDV Connection",
        "connection.connection_url": baseUrl,
        "credential.oauth_entity.client_id": clientId,
        "credential.oauth_entity.client_secret": clientSecret,
        "credential.oauth_entity.token_url": tokenUrl,
      }),
    );
    ccGa.addParam("sysparm_aliasSysID", info.aliasSysId);
    ccGa.getXMLAnswer((ccAnswer) => {
      if (ccAnswer && /error|exception/i.test(ccAnswer)) {
        _idvEnableSave();
        this.textContent = "Save";
        _idvShowStatus("error", "❌ Failed to create connection: " + ccAnswer);
        return;
      }
      _idvFinishSave(region, baseUrl, tokenUrl, clientId, clientSecret, this);
    });
  });
});

function _idvFinishSave(region, baseUrl, tokenUrl, clientId, clientSecret, btn) {
  _ajax(
    "saveConfig",
    {
      sysparm_region: region,
      sysparm_base_url: baseUrl,
      sysparm_token_url: tokenUrl,
      sysparm_client_id: clientId || undefined,
      sysparm_client_secret: clientSecret || undefined,
    },
    (result) => {
      btn.textContent = "Save";
      _idvEnableSave();
      if (result && result.success) {
        _idvShowStatus("success", "✅ " + result.message);
      } else {
        _idvShowStatus("error", "❌ " + (result ? result.message : "Unknown error."));
      }
    },
  );
}
