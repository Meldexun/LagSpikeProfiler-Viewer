/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!***********************!*\
  !*** ./datareader.js ***!
  \***********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DataReader: () => (/* binding */ DataReader)
/* harmony export */ });

class DataReader {

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

/******/ })()
;
//# sourceMappingURL=datareader.js.map