const sharp = require('sharp');

class BitWriter {
    constructor() { this.bits = []; }
    write(value, numBits) {
        for (let i = numBits - 1; i >= 0; i--) {
            this.bits.push((value >> i) & 1);
        }
    }
    toBuffer() {
        const numBytes = Math.ceil(this.bits.length / 8);
        const buffer = Buffer.alloc(numBytes);
        for (let i = 0; i < this.bits.length; i++) {
            if (this.bits[i]) {
                const bytePos = Math.floor(i / 8);
                const bitPos = 7 - (i % 8);
                buffer[bytePos] |= (1 << bitPos);
            }
        }
        return buffer;
    }
}

class BitReader {
    constructor(buffer) {
        this.buffer = buffer;
        this.bitIndex = 0;
    }

    read(numBits) {
        let value = 0;
        for (let i = 0; i < numBits; i++) {
            const bytePos = Math.floor(this.bitIndex / 8);
            const bitPos = 7 - (this.bitIndex % 8);
            const bit = (this.buffer[bytePos] >> bitPos) & 1;
            value = (value << 1) | bit;
            this.bitIndex++;
        }
        return value;
    }
}

function calculatePredictionErrors(pixels, width, height) {
    const E = new Int32Array(width * height);
    const P = (x, y) => pixels[y * width + x];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let prediction = 0;
            const current = P(x, y);

            if (x === 0 && y === 0) {
                prediction = 0;
            } else if (y === 0) {
                prediction = P(x - 1, 0);
            } else if (x === 0) {
                prediction = P(0, y - 1);
            } else {
                const a = P(x - 1, y);
                const b = P(x, y - 1);
                const c = P(x - 1, y - 1);

                const minAB = Math.min(a, b);
                const maxAB = Math.max(a, b);

                if (c >= maxAB) {
                    prediction = minAB;
                } else if (c <= minAB) {
                    prediction = maxAB;
                } else {
                    prediction = a + b - c;
                }
            }

            if (x === 0 && y === 0) {
                E[0] = current;
            }
            else {
                E[y * width + x] = current - prediction;
            }
        }
    }

    return E;
}

function mapErrorsToN(E) {
    const N = new Int32Array(E.length);
    N[0] = E[0];
    for (let i = 1; i < E.length; i++) {
        const err = E[i];
        if (err >= 0) N[i] = 2 * err;
        else N[i] = 2 * Math.abs(err) - 1;
    }
    return N;
}

function calculateCumulativeSum(N) {
    const C = new Int32Array(N.length);
    C[0] = N[0];
    for (let i = 1; i < N.length; i++) C[i] = C[i - 1] + N[i];
    return C;
}

function interpolativeCoding(bitWriter, C, L, H) {
    if (H - L <= 1) return;
    if (C[H] === C[L]) return;

    const m = Math.floor(0.5 * (H + L));
    const range = C[H] - C[L] + 1;
    if (range <= 0) return;

    const g = Math.ceil(Math.log2(range));
    const valueToEncode = C[m] - C[L];
    bitWriter.write(valueToEncode, g);

    if (L < m) interpolativeCoding(bitWriter, C, L, m);
    if (m < H) interpolativeCoding(bitWriter, C, m, H);
}


function interpolativeDecoding(bitReader, C, L, H) {
    if (H - L <= 1) return;

    if (C[H] === C[L]) {
        for (let i = L + 1; i < H; i++) {
            C[i] = C[L];
        }
        return;
    }

    const m = Math.floor(0.5 * (H + L));
    const range = C[H] - C[L] + 1;
    const g = Math.ceil(Math.log2(range));

    const offset = bitReader.read(g);
    C[m] = C[L] + offset;

    if (L < m) interpolativeDecoding(bitReader, C, L, m);
    if (m < H) interpolativeDecoding(bitReader, C, m, H);
}

function unmapErrors(N) {
    const E = new Int32Array(N.length);
    E[0] = N[0];
    for(let i=1; i<N.length; i++) {
        const val = N[i];
        if (val % 2 === 0) E[i] = val / 2;
        else E[i] = -(val + 1) / 2;
    }
    return E;
}

function reconstructPixels(E, width, height) {
    const pixels = new Uint8Array(width * height);
    const P = (x, y) => pixels[y * width + x];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let prediction = 0;

            if (x === 0 && y === 0) {
                prediction = 0;
            } else if (y === 0) {
                prediction = P(x - 1, 0);
            } else if (x === 0) {
                prediction = P(0, y - 1);
            } else {
                const a = P(x - 1, y);
                const b = P(x, y - 1);
                const c = P(x - 1, y - 1);
                const minAB = Math.min(a, b);
                const maxAB = Math.max(a, b);
                if (c >= maxAB) prediction = minAB;
                else if (c <= minAB) prediction = maxAB;
                else prediction = a + b - c;
            }

            if (x === 0 && y === 0) {
                pixels[0] = E[0];
            } else {
                let val = prediction + E[y * width + x];
                if (val < 0) val = 0;
                if (val > 255) val = 255;
                pixels[y * width + x] = val;
            }
        }
    }
    return pixels;
}

function decompressChannel(c0, cLast, dataBuffer, width, height) {
    const reader = new BitReader(dataBuffer);
    const C = new Int32Array(width * height);

    C[0] = c0;
    C[C.length - 1] = cLast;

    interpolativeDecoding(reader, C, 0, C.length - 1);

    const N = new Int32Array(C.length);
    N[0] = C[0];
    for (let i = 1; i < C.length; i++) {
        N[i] = C[i] - C[i - 1];
    }

    const E = unmapErrors(N);

    return reconstructPixels(E, width, height);
}


function compressChannel(pixels, width, height) {
    const E = calculatePredictionErrors(pixels, width, height);
    const N = mapErrorsToN(E);
    const C = calculateCumulativeSum(N);

    const writer = new BitWriter();
    const n = C.length;

    interpolativeCoding(writer, C, 0, n - 1);

    const compressedData = writer.toBuffer();

    return {
        c0: C[0],
        cLast: C[n - 1],
        data: compressedData
    };
}

async function compressImage(buffer) {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    const rawBuffer = await image.raw().toBuffer();
    const channels = 3;

    const channelSize = width * height;
    const rParams = new Uint8Array(channelSize);
    const gParams = new Uint8Array(channelSize);
    const bParams = new Uint8Array(channelSize);

    for (let i = 0; i < channelSize; i++) {
        rParams[i] = rawBuffer[i * channels];
        gParams[i] = rawBuffer[i * channels + 1];
        bParams[i] = rawBuffer[i * channels + 2];
    }

    const rComp = compressChannel(rParams, width, height);
    const gComp = compressChannel(gParams, width, height);
    const bComp = compressChannel(bParams, width, height);

    const header = Buffer.alloc(8);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);

    const writeChannelBlock = (comp) => {
        const meta = Buffer.alloc(12);
        meta.writeInt32BE(comp.c0, 0);
        meta.writeInt32BE(comp.cLast, 4);
        meta.writeUInt32BE(comp.data.length, 8);
        return Buffer.concat([meta, comp.data]);
    };

    return Buffer.concat([
        header,
        writeChannelBlock(rComp),
        writeChannelBlock(gComp),
        writeChannelBlock(bComp)
    ]);
}

async function decompressImage(buffer) {
    if (buffer.length < 8) {
        throw new Error("File too small to be a compressed image");
    }

    const width = buffer.readUInt32BE(0);
    const height = buffer.readUInt32BE(4);

    if (width > 10000 || height > 10000 || width <= 0 || height <= 0) {
        throw new Error(`Invalid dimensions (${width}x${height}): File is likely not compressed with our algorithm.`);
    }

    let offset = 8;
    const channelSize = width * height;

    const MAX_ARRAY_SIZE = 200 * 1024 * 1024;
    if (channelSize > MAX_ARRAY_SIZE) {
        throw new Error("Image too large for memory allocation");
    }

    const readChannel = () => {
        const c0 = buffer.readInt32BE(offset);
        const cLast = buffer.readInt32BE(offset + 4);
        const length = buffer.readUInt32BE(offset + 8);
        offset += 12;

        const data = buffer.slice(offset, offset + length);
        offset += length;

        return decompressChannel(c0, cLast, data, width, height);
    };

    try {
        const rPixels = readChannel();
        const gPixels = readChannel();
        const bPixels = readChannel();

        const rawBuffer = Buffer.alloc(width * height * 3);
        for (let i = 0; i < channelSize; i++) {
            rawBuffer[i * 3] = rPixels[i];
            rawBuffer[i * 3 + 1] = gPixels[i];
            rawBuffer[i * 3 + 2] = bPixels[i];
        }

        return await sharp(rawBuffer, {
            raw: { width: width, height: height, channels: 3 }
        }).png().toBuffer();
    } catch (err) {
        throw new Error("Decompression logic failed: " + err.message);
    }
}

module.exports = { compressImage, decompressImage };