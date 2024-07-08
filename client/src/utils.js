// Helper function to convert ArrayBuffer to hex string
export function bufferToHex(buffer) {
    return '0x' + Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

export function hexToBuffer(hexString) {
    // Remove the '0x' prefix if it exists
    hexString = hexString.startsWith('0x') ? hexString.slice(2) : hexString;

    // Ensure even number of characters
    if (hexString.length % 2 !== 0) {
        throw new Error('Invalid hex string');
    }

    // Convert hex string to buffer
    const numbers = [];
    for (let i = 0; i < hexString.length; i += 2) {
        numbers.push(parseInt(hexString.substr(i, 2), 16));
    }
    return new Uint8Array(numbers);
}