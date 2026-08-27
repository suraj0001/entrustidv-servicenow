var EntrustWebhookSignatureValidator = Class.create();

EntrustWebhookSignatureValidator.prototype = {

    initialize: function () {},

    validate: function (rawBody, signature, webhookSecret) {
        if (!rawBody || !signature || !webhookSecret) {
            return false;
        }

        try {
            var receivedSignature =
                String(signature).trim().toLowerCase();

            if (
                receivedSignature.length !== 64 ||
                !/^[0-9a-f]+$/.test(receivedSignature)
            ) {
                return false;
            }

            var encodedSecret =
                gs.base64Encode(webhookSecret);

            var mac =
                new CertificateEncryption();

            var expectedSignatureBase64 =
                mac.generateMac(
                    encodedSecret,
                    'HmacSHA256',
                    rawBody
                );

            if (!expectedSignatureBase64) {
                return false;
            }

            var expectedSignature =
                this._base64ToHex(expectedSignatureBase64);

            return this._constantTimeEquals(
                expectedSignature,
                receivedSignature
            );

        } catch (error) {
            gs.error(
                '[WebhookSignatureValidator] Signature validation failed: ' +
                String(error)
            );

            return false;
        }
    },

    _base64ToHex: function (base64) {
        var alphabet =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        var input =
            String(base64).replace(/\s/g, '');

        var hex = '';

        for (var i = 0; i < input.length; i += 4) {
            var char1 = input.charAt(i);
            var char2 = input.charAt(i + 1);
            var char3 = input.charAt(i + 2);
            var char4 = input.charAt(i + 3);

            var enc1 = alphabet.indexOf(char1);
            var enc2 = alphabet.indexOf(char2);

            var enc3 =
                char3 === '='
                    ? 0
                    : alphabet.indexOf(char3);

            var enc4 =
                char4 === '='
                    ? 0
                    : alphabet.indexOf(char4);

            if (
                enc1 < 0 ||
                enc2 < 0 ||
                (char3 !== '=' && enc3 < 0) ||
                (char4 !== '=' && enc4 < 0)
            ) {
                throw new Error('Invalid Base64 MAC');
            }

            var byte1 =
                (enc1 << 2) |
                (enc2 >> 4);

            hex += this._byteToHex(byte1);

            if (char3 !== '=') {
                var byte2 =
                    ((enc2 & 15) << 4) |
                    (enc3 >> 2);

                hex += this._byteToHex(byte2);
            }

            if (char4 !== '=') {
                var byte3 =
                    ((enc3 & 3) << 6) |
                    enc4;

                hex += this._byteToHex(byte3);
            }
        }

        return hex;
    },

    _byteToHex: function (value) {
        var hex =
            (value & 0xff).toString(16);

        return hex.length === 1
            ? '0' + hex
            : hex;
    },

    _constantTimeEquals: function (expected, actual) {
        if (
            expected.length !== 64 ||
            actual.length !== 64
        ) {
            return false;
        }

        var difference = 0;

        for (var i = 0; i < 64; i++) {
            difference |=
                expected.charCodeAt(i) ^
                actual.charCodeAt(i);
        }

        return difference === 0;
    },

    type: 'EntrustWebhookSignatureValidator'
};