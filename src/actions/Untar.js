import { UntarStream } from "./UntarStream";
function dirname(path) {
    if (!path.length) {
        return '.';
    }
    const hasRoot = path[0] === '/';
    let end;
    for (let i = path.length - 1; i >= 1; --i) {
        if (path[i] === '/') {
            end = i;
            break;
        }
    }

    if (!end) { return hasRoot ? '/' : '.'; }
    if (hasRoot && end === 1) { return '//'; }
    return path.slice(0, end);
}
const subfolder = /(\/.*?)\/.*/;
export class Untar {
    constructor(arrayBuffer) {
        this._stream = new UntarStream(arrayBuffer);
    }
    getFolder(folder = '/') {
        const files = [];
        const folders = new Set();
        const stream = this._stream;
        let match;
        const isNotRootFolder = folder !== '/';
        while (this.hasNext()) {
            const file = {};
            let headerBeginPos = stream.position();
            let dataBeginPos = headerBeginPos + 512;
            file.path = stream.readString(100).substring("package".length);
            file.mode = stream.readString(8);
            file.uid = stream.readString(8);
            file.gid = stream.readString(8);
            file.size = parseInt(stream.readString(12), 8);
            file.mtime = parseInt(stream.readString(12), 8);
            file.checksum = parseInt(stream.readString(8));
            file.type = stream.readString(1);
            file.linkname = stream.readString(100);
            file.ustarFormat = stream.readString(6);
            switch (file.type) {
                case "0":
                case "":
                    file.buffer = stream.readBuffer(file.size);
                    break;
                default:
                    file.buffer = new ArrayBuffer(0);
                    break;
            }
            let dataEndPos = dataBeginPos + file.size;
            if (file.size % 512 !== 0) {
                dataEndPos += 512 - file.size % 512;
            }
            if (dirname(file.path).startsWith(folder)) {
                if (isNotRootFolder) {
                    let index = file.path.indexOf(folder)
                    index = index ? index + folder.length : folder.length;
                    let path = file.path.substring(index)
                    match = path.match(subfolder)
                } else {
                    match = file.path.match(subfolder)
                }
                if (match) {
                    const folder = match[1];
                    if (!folders.has(folder)) {
                        folders.add(folder);
                        file.path = folder;
                        file.mode = stream.readString(8);
                        file.uid = "";
                        file.gid = "";
                        file.size = 0;
                        file.mtime = 0;
                        file.checksum = 0;
                        file.type = "5";
                        file.linkname = "";
                        files.push(file);
                    }
                } else {
                    files.push(file);
                }
            }
            stream.position(dataEndPos);
        }
        return files;
    }
    getFiles() {
        const files = [];
        const stream = this._stream;
        while (this.hasNext()) {
            const file = {};
            let headerBeginPos = stream.position();
            let dataBeginPos = headerBeginPos + 512;
            file.path = stream.readString(100).substring("package".length);
            file.mode = stream.readString(8);
            file.uid = stream.readString(8);
            file.gid = stream.readString(8);
            file.size = parseInt(stream.readString(12), 8);
            file.mtime = parseInt(stream.readString(12), 8);
            file.checksum = parseInt(stream.readString(8));
            file.type = stream.readString(1);
            file.linkname = stream.readString(100);
            file.ustarFormat = stream.readString(6);
            stream.position(dataBeginPos);
            switch (file.type) {
                case "0":
                case "":
                    file.buffer = stream.readBuffer(file.size);
                    break;
                default:
                    file.buffer = new ArrayBuffer(0);
                    break;
            }
            files.push(file);
            let dataEndPos = dataBeginPos + file.size;
            if (file.size % 512 !== 0) {
                dataEndPos += 512 - file.size % 512;
            }
            stream.position(dataEndPos);
        }
        return files;
    }
    getFile(name) {
        const stream = this._stream;
        stream.position(0);
        while (this.hasNext()) {
            const file = {};
            let headerBeginPos = stream.position();
            let dataBeginPos = headerBeginPos + 512;
            file.path = stream.readString(100).substring("package".length);
            file.mode = stream.readString(8);
            file.uid = stream.readString(8);
            file.gid = stream.readString(8);
            file.size = parseInt(stream.readString(12), 8);
            file.mtime = parseInt(stream.readString(12), 8);
            file.checksum = parseInt(stream.readString(8));
            file.type = stream.readString(1);
            file.linkname = stream.readString(100);
            file.ustarFormat = stream.readString(6);
            if (file.path !== name) {
                let dataEndPos = dataBeginPos + file.size;
                if (file.size % 512 !== 0) {
                    dataEndPos += 512 - file.size % 512;
                }
                stream.position(dataEndPos);
            } else {
                stream.position(dataBeginPos);
                switch (file.type) {
                    case "0":
                    case "":
                        file.buffer = stream.readBuffer(file.size);
                        break;
                    default:
                        file.buffer = new ArrayBuffer(0);
                        break;
                }
                return file;
            }
        }
        return false;
    }
    hasNext() {
        return this._stream.position() + 4 < this._stream.size() && this._stream.peekUint32() !== 0;
    }
}
