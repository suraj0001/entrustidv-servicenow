import { GlideCertificateEncryption } from '@servicenow/glide'

export function verifyWebhookSignature(
    rawBody: string,
    signatureHex: string,
    secret: string,
): boolean {
    if (!rawBody || !signatureHex || !secret) {
        return false
    }

    const receivedSignature = signatureHex
        .trim()
        .toLowerCase()

    if (!/^[0-9a-f]{64}$/.test(receivedSignature)) {
        return false
    }

    const encodedSecret = base64Encode(secret)

    const generatedBase64 =
        GlideCertificateEncryption.generateMac(
            encodedSecret,
            'HmacSHA256',
            rawBody,
        )

    const generatedHex =
        base64ToHex(generatedBase64).toLowerCase()

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

    let difference = 0

    for (let i = 0; i < a.length; i++) {
        difference |=
            a.charCodeAt(i) ^
            b.charCodeAt(i)
    }

    return difference === 0
}

function base64Encode(value: string): string {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    const bytes = utf8Bytes(value)

    let result = ''

    for (let i = 0; i < bytes.length; i += 3) {
        const byte1 = bytes[i]
        const byte2 =
            i + 1 < bytes.length
                ? bytes[i + 1]
                : 0

        const byte3 =
            i + 2 < bytes.length
                ? bytes[i + 2]
                : 0

        result += chars.charAt(byte1 >> 2)

        result += chars.charAt(
            ((byte1 & 3) << 4) |
                (byte2 >> 4),
        )

        if (i + 1 < bytes.length) {
            result += chars.charAt(
                ((byte2 & 15) << 2) |
                    (byte3 >> 6),
            )
        } else {
            result += '='
        }

        if (i + 2 < bytes.length) {
            result += chars.charAt(
                byte3 & 63,
            )
        } else {
            result += '='
        }
    }

    return result
}

function utf8Bytes(value: string): number[] {
    const bytes: number[] = []

    for (let i = 0; i < value.length; i++) {
        let code = value.charCodeAt(i)

        if (code < 0x80) {
            bytes.push(code)
            continue
        }

        if (code < 0x800) {
            bytes.push(
                0xc0 | (code >> 6),
                0x80 | (code & 0x3f),
            )

            continue
        }

        if (
            code >= 0xd800 &&
            code <= 0xdbff &&
            i + 1 < value.length
        ) {
            const low =
                value.charCodeAt(i + 1)

            if (
                low >= 0xdc00 &&
                low <= 0xdfff
            ) {
                i++

                code =
                    0x10000 +
                    ((code - 0xd800) << 10) +
                    (low - 0xdc00)

                bytes.push(
                    0xf0 | (code >> 18),
                    0x80 |
                        ((code >> 12) & 0x3f),
                    0x80 |
                        ((code >> 6) & 0x3f),
                    0x80 |
                        (code & 0x3f),
                )

                continue
            }
        }

        bytes.push(
            0xe0 | (code >> 12),
            0x80 | ((code >> 6) & 0x3f),
            0x80 | (code & 0x3f),
        )
    }

    return bytes
}

function base64ToHex(
    base64: string,
): string {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    let result = ''

    for (let i = 0; i < base64.length; i += 4) {
        const c1 =
            chars.indexOf(base64.charAt(i))

        const c2 =
            chars.indexOf(base64.charAt(i + 1))

        const char3 =
            base64.charAt(i + 2)

        const char4 =
            base64.charAt(i + 3)

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

function byteToHex(
    value: number,
): string {
    const hex =
        (value & 255).toString(16)

    return hex.length === 1
        ? '0' + hex
        : hex
}