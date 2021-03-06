import { error } from "../error.js";
import { execute } from "../executer.js";
import { isWeb } from "../process.js";
import { Scope } from "../scope.js";

class HTMLElementScope extends Scope {
	constructor(parent = null, element) {
		super(parent);

		this.htmlEl = element;
		this.type = "BlockLiteral";
		this.body = [];
		this.scope = this;
		this.destroyed = false;
		this._setup();
	}

	_setup() {
		/** @type {HTMLElement} */
		let el = this.htmlEl;
		let self = this;

		this.localFunctions.set("id", {
			type: "js",
			run() {
				if (self.destroyed)
					error("Tring to access a destroyed element.", "Web");
				return { type: "StringLiteral", value: el.id };
			}
		});

		this.localFunctions.set("setAttr", {
			type: "js",
			run(name, value) {
				if (self.destroyed) error("Tring to edit a destroyed element.", "Web");
				el.setAttribute(name.value, value.value);
			}
		});

		this.localFunctions.set("text", {
			type: "js",
			run(text) {
				if (self.destroyed) error("Tring to edit a destroyed element.", "Web");
				el.innerText = text.value;
			}
		});

		this.localFunctions.set("appendText", {
			type: "js",
			run(text) {
				if (self.destroyed) error("Tring to edit a destroyed element.", "Web");
				el.innerText += text.value;
			}
		});
		this.localFunctions.set("self", {
			type: "js",
			run(text) {
				if (self.destroyed)
					error("Tring to access a destroyed element.", "Web");
				return self;
			}
		});

		this.localFunctions.set("add", {
			type: "js",
			run(element) {
				if (self.destroyed) error("Tring to edit a destroyed element.", "Web");
				el.appendChild(element.htmlEl);
			}
		});

		this.localFunctions.set("on", {
			type: "js",
			run(event, data, yieldFunction) {
				if (self.destroyed)
					error("Tring to access a destroyed element.", "Web");
				el.addEventListener(event.value, () => {
					execute(yieldFunction, data);
				});
			}
		});

		this.localFunctions.set("destroy", {
			type: "js",
			run() {
				el.remove();
				self.destroyed = true;
			}
		});
	}
}

let consoleEl = null;
let bodyEl = new HTMLElementScope(null, document.body);
let trackedElements = [bodyEl];

export function getConsoleEl() {
	return consoleEl;
}

const scope = new Scope();

if (isWeb) {
	scope.localFunctions.set("useElementAsConsole", {
		type: "js",
		run(id) {
			consoleEl = document.getElementById(id.value);
		}
	});

	scope.localFunctions.set("getElement", {
		type: "js",
		run(selector, { scope }) {
			let el = new HTMLElementScope(
				scope,
				document.querySelector(selector.value)
			);
			trackedElements.push(el);
			return el;
		}
	});

	scope.localFunctions.set("createElement", {
		type: "js",
		run(type, { scope }) {
			let htmlEl = document.createElement(type.value);
			let el = new HTMLElementScope(scope, htmlEl);
			trackedElements.push(el);
			return el;
		}
	});

	scope.localFunctions.set("body", {
		type: "js",
		run({ scope }) {
			return { type: "Block", scope: bodyEl, body: [] };
		}
	});

	scope.localFunctions.set("input", {
		type: "js",
		run(text) {
			return { type: "StringLiteral", value: prompt(text.value) };
		}
	});
}

export default scope;
