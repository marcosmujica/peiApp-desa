import EventEmitter from "eventemitter3";

export const EVENT_DB_CHANGE = "EVENT_DB_CHANGE";

const emitter = new EventEmitter();

export function emitEvent(eventName, payload) {
	console.log ("payload event")
	console.log (payload)
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
