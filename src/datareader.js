
export class DataReader {

	constructor(buffer) {
		this.buffer = buffer;
		this.position = 0;
	}

	readByte() {
		const result = this.buffer.readInt8(this.position);
		this.position += 1;
		return result;
	}

	readShort() {
		const result = this.buffer.readInt16BE(this.position);
		this.position += 2;
		return result;
	}

	readInt() {
		const result = this.buffer.readInt32BE(this.position);
		this.position += 4;
		return result;
	}

	readLong() {
		const result = Number(this.buffer.readBigInt64BE(this.position));
		this.position += 8;
		return result;
	}

	readUTF() {
		const length = this.readShort();
		const result = this.buffer.toString("utf8", this.position, this.position + length);
		this.position += length;
		return result;
	}

}
