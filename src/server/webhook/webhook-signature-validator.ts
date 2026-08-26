import { GlideCertificateEncryption, gs } from '@servicenow/glide'

const HMAC_ALGORITHM = 'HmacSHA256'
const SHA256_HEX_LENGTH = 64

export function validate(
    rawBody: string,
    signature: string,
    webhookSecret: string
): boolean {
    if (!rawBody || !signature || !webhookSecret) {
        return false
    }

    try {
        const receivedSignature = signature.trim().toLowerCase()

        // SHA-256 signature should be exactly 64 hexadecimal characters.
        if (
            receivedSignature.length !== SHA256_HEX_LENGTH ||
            !/^[0-9a-f]+$/.test(receivedSignature)
        ) {
            return false
        }

        /*
         * GlideCertificateEncryption.generateMac() expects
         * the HMAC key to be Base64 encoded.
         */
        const encodedSecret = gs.base64Encode(webhookSecret)

        const mac = new GlideCertificateEncryption()

        /*
         * ServiceNow returns the generated MAC as Base64.
         */
        const expectedSignatureBase64 = mac.generateMac(
            encodedSecret,
            HMAC_ALGORITHM,
            rawBody
        )

        if (!expectedSignatureBase64) {
            return false
        }

        /*
         * Entrust sends X-SHA2-Signature as hexadecimal,
         * therefore convert ServiceNow's Base64 MAC to hex.
         */
        const expectedSignature =
            base64ToHex(expectedSignatureBase64)

        return constantTimeEquals(
            expectedSignature,
            receivedSignature
        )
    } catch (error) {
        gs.error(
            `[WebhookSignatureValidator] Signature validation failed: ${String(error)}`
        )

        return false
    }
}

/**
 * Converts a standard Base64 encoded byte sequence to hexadecimal.
 *
 * We do this manually because CertificateEncryption.generateMac()
 * returns Base64, while Entrust provides its signature as hex.
 */
function base64ToHex(base64: string): string {
    const alphabet =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    const input = base64.replace(/\s/g, '')

    let hex = ''

    for (let i = 0; i < input.length; i += 4) {
        const char1 = input.charAt(i)
        const char2 = input.charAt(i + 1)
        const char3 = input.charAt(i + 2)
        const char4 = input.charAt(i + 3)

        const enc1 = alphabet.indexOf(char1)
        const enc2 = alphabet.indexOf(char2)

        const enc3 =
            char3 === '=' ? 0 : alphabet.indexOf(char3)

        const enc4 =
            char4 === '=' ? 0 : alphabet.indexOf(char4)

        if (
            enc1 < 0 ||
            enc2 < 0 ||
            (char3 !== '=' && enc3 < 0) ||
            (char4 !== '=' && enc4 < 0)
        ) {
            throw new Error('Invalid Base64 MAC')
        }

        const byte1 =
            (enc1 << 2) |
            (enc2 >> 4)

        hex += byteToHex(byte1)

        if (char3 !== '=') {
            const byte2 =
                ((enc2 & 15) << 4) |
                (enc3 >> 2)

            hex += byteToHex(byte2)
        }

        if (char4 !== '=') {
            const byte3 =
                ((enc3 & 3) << 6) |
                enc4

            hex += byteToHex(byte3)
        }
    }

    return hex
}

function byteToHex(value: number): string {
    return (value & 0xff)
        .toString(16)
        .padStart(2, '0')
}

/**
 * Constant-time comparison for two fixed-length SHA-256
 * hexadecimal signatures.
 */
function constantTimeEquals(
    expected: string,
    actual: string
): boolean {
    if (
        expected.length !== SHA256_HEX_LENGTH ||
        actual.length !== SHA256_HEX_LENGTH
    ) {
        return false
    }

    let difference = 0

    for (let i = 0; i < SHA256_HEX_LENGTH; i++) {
        difference |=
            expected.charCodeAt(i) ^
            actual.charCodeAt(i)
    }

    return difference === 0
}