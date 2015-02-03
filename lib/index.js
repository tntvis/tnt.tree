if (typeof tnt === "undefined") {
    module.exports = tnt = {}
}
require("d3");
var eventsystem = require("biojs-events");
eventsystem.mixin(tnt);
tnt.utils = require("tnt.utils");
tnt.tooltip = require("tnt.tooltip");
tnt.tree = require("./treeWrapper.js");
