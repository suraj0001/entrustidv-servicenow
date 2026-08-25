import {
    CertificateEncryption,
    gs,
} from '@servicenow/glide'

export function verifyWebhookSignature(
    rawBody: string,
    signatureHex: string,
    secret: string,
): boolean {
    if (!rawBody || !signatureHex || !secret) {
        return false
    }

    const receivedSignature = String(signatureHex)
        .trim()
        .toLowerCase()

    if (!/^[0-9a-f]{64}$/.test(receivedSignature)) {
        return false
    }

    const mac = new CertificateEncryption()

    const encodedSecret = gs.base64Encode(secret)

    const generatedBase64 = mac.generateMac(
        encodedSecret,
        'HmacSHA256',
        rawBody,
    )

    const generatedHex = base64ToHex(
        generatedBase64,
    ).toLowerCase()

    return constantTimeEquals(
        generatedHex,
        receivedSignature,
    )
}

function constantTimeEquals(
    a: string,
    b: string,
): boolean {
    if (a.length !== b.length) {
        return false
    }

    let diff = 0

    for (let i = 0; i < a.length; i++) {
        diff |=
            a.charCodeAt(i) ^
            b.charCodeAt(i)
    }

    return diff === 0
}

function base64ToHex(base64: string): string {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    let result = ''

    for (let i = 0; i < base64.length; i += 4) {
        const c1 = chars.indexOf(base64.charAt(i))
        const c2 = chars.indexOf(base64.charAt(i + 1))

        const char3 = base64.charAt(i + 2)
        const char4 = base64.charAt(i + 3)

        const c3 =
            char3 === '='
                ? 0
                : chars.indexOf(char3)

        const c4 =
            char4 === '='
                ? 0
                : chars.indexOf(char4)

        const byte1 =
            (c1 << 2) |
            (c2 >> 4)

        result += byteToHex(byte1)

        if (char3 !== '=') {
            const byte2 =
                ((c2 & 15) << 4) |
                (c3 >> 2)

            result += byteToHex(byte2)
        }

        if (char4 !== '=') {
            const byte3 =
                ((c3 & 3) << 6) |
                c4

            result += byteToHex(byte3)
        }
    }

    return result
}

function byteToHex(value: number): string {
    const hex =
        (value & 255).toString(16)

    return hex.length === 1
        ? '0' + hex
        : hex
}