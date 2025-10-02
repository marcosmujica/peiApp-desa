import EventEmitter from "eventemitter3";

export const EVENT_NEW_DOC = "db_newdoc";

const emitter = new EventEmitter();

export function emitEvent(eventName, payload) {
	emitter.emit(eventName, payload);
}

export function onEvent(eventName, callback) {
	emitter.on(eventName, callback);
	return () => emitter.off(eventName, callback);
}

export function offEvent(eventName, callback) {
	emitter.off(eventName, callback);
}

export function onceEvent(eventName, callback) {
	emitter.once(eventName, callback);
}

export function getEmitter() {
	return emitter;
}

export default emitter;
