import { Buffer } from 'buffer';
import bzip2 from './bzip2';

const {
	_BZ2_bzDecompressInit, _BZ2_bzDecompress, _BZ2_bzDecompressEnd,
	_createStream, _setNextIn, _setAvailIn, _setNextOut, _getNextOut, _setAvailOut, _getAvailOut,
	_malloc, _free, HEAPU8
} = await bzip2();

const OUT_SIZE = 1 << 20;
const BZ_OK = 0;
const BZ_STREAM_END = 4;

export class BzipDataReader {

	constructor(src) {
		this.bz_stream = _createStream();
		_BZ2_bzDecompressInit(this.bz_stream, 0, 0);

		this.inputPointer = _malloc(src.byteLength);
		_setNextIn(this.bz_stream, this.inputPointer);
		_setAvailIn(this.bz_stream, src.byteLength);
		this.outputPointer = _malloc(OUT_SIZE);
		_setNextOut(this.bz_stream, this.outputPointer);
		_setAvailOut(this.bz_stream, OUT_SIZE);

		HEAPU8.set(src, this.inputPointer);
		this.buffer = Buffer.from(HEAPU8.buffer, this.outputPointer, OUT_SIZE);
		this.readPos = 0;
	}

	getWritePos() {
		return _getNextOut(this.bz_stream) - this.outputPointer;
	}

	setWritePos(writePos) {
		_setNextOut(this.bz_stream, this.outputPointer + writePos);
		_setAvailOut(this.bz_stream, OUT_SIZE - writePos);
	}

	availableWrite() {
		return _getAvailOut(this.bz_stream);
	}

	getReadPos() {
		return this.readPos;
	}

	setReadPos(readPos) {
		this.readPos = readPos;
	}

	availableRead() {
		return this.getWritePos() - this.getReadPos();
	}

	ensure(bytes) {
		if (this.availableRead() < bytes) {
			this.buffer.copyWithin(0, this.getReadPos(), this.getWritePos());
			this.setWritePos(this.getWritePos() - this.getReadPos());
			this.setReadPos(0);

			while (this.availableRead() < bytes) {
				const r = _BZ2_bzDecompress(this.bz_stream);
				if (r === BZ_STREAM_END) {
					if (this.availableRead() < bytes) {
						throw new Error("EOF: Can't read " + bytes + " bytes, available: " + this.availableRead());
					}
					break;
				}
				if (r !== BZ_OK) {
					throw new Error("Unexpected bzip decompress result: " + r);
				}
			}
		}
	}

	readByte() {
		this.ensure(1);
		const result = this.buffer.readInt8(this.readPos);
		this.readPos += 1;
		return result;
	}

	readShort() {
		this.ensure(2);
		const result = this.buffer.readInt16BE(this.readPos);
		this.readPos += 2;
		return result;
	}

	readInt() {
		this.ensure(4);
		const result = this.buffer.readInt32BE(this.readPos);
		this.readPos += 4;
		return result;
	}

	readLong() {
		this.ensure(8);
		const result = Number(this.buffer.readBigInt64BE(this.readPos));
		this.readPos += 8;
		return result;
	}

	readUTF() {
		const length = this.readShort();
		this.ensure(length);
		const result = this.buffer.toString("utf8", this.readPos, this.readPos + length);
		this.readPos += length;
		return result;
	}

	readVarInt() {
		let x = 0;
		for (let i = 0; i < 5; i++) {
			const b = this.readByte() & 0xFF;
			x |= (b & ~(1 << 7)) << 7 * i;
			if ((b & (1 << 7)) === 0)
				break;
		}
		return x;
	}

	readVarLong() {
		let x = 0;
		for (let i = 0; i < 10; i++) {
			const b = this.readByte() & 0xFF;
			x |= (b & ~(1 << 7)) << 7 * i;
			if ((b & (1 << 7)) === 0)
				break;
		}
		return x;
	}

	close() {
		_BZ2_bzDecompressEnd(this.bz_stream);
		_free(this.bz_stream);
		_free(this.inputPointer);
		_free(this.outputPointer);
	}

}
