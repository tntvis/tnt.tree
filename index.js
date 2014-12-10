if (typeof tnt === "undefined") {
    module.exports = tnt = {}
}
var eventsystem = require("biojs-events");
eventsystem.mixin(tnt);
tnt.utils = require("tnt.utils");
tnt.tooltip = require("tnt.tooltip");
tnt.tree = require("./src/index.js");

