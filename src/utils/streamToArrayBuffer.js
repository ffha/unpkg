import { concatenate } from './concatenate';

export async function streamToArrayBuffer(stream) {
    const reader = stream.getReader();
    let values = [];
    await reader.read().then(function processText({ done, value }) {
        if (done) {
            return values;
        }
        values.push(value);
        return reader.read().then(processText);
    });
    return concatenate(Uint8Array, ...values).buffer;
}
