export class UntarStream {
    constructor(arrayBuffer) {
        this._bufferView = new DataView(arrayBuffer || new ArrayBuffer(0));
        this._position = 0;
    }
    readString(charCount) {
        let charSize = 1;
        let byteCount = charCount * charSize;
        let charCodes = [];
        for (let i = 0; i < charCount; ++i) {
            let charCode = this._bufferView.getUint8(this.position() + i * charSize, true);
            if (charCode !== 0) {
                charCodes.push(charCode);
            } else {
                break;
            }
        }
        this.seek(byteCount);
        return new TextDecoder().decode(new Uint8Array(charCodes));
    }
    readBuffer(byteCount) {
        let buf = new ArrayBuffer(byteCount);
        let target = new Uint8Array(buf);
        let src = new Uint8Array(this._bufferView.buffer, this.position(), byteCount);
        target.set(src);
        this.seek(byteCount);
        return buf;
    }
    seek(byteCount) {
        this._position += byteCount;
    }
    peekUint32() {
        return this._bufferView.getUint32(this.position(), true);
    }
    position(newpos) {
        if (newpos != undefined) {
            this._position = newpos;
        } else {
            return this._position;
        }
    }
    size() {
        return this._bufferView.byteLength;
    }
}
