var tnt = require ("../index.js");
var assert = require("chai").assert;

describe ('TnT tree', function () {
    it ("Imports correctly", function () {
	assert.isDefined(tnt.tree);
	assert.isFunction(tnt.tree);
    });

    it ("Has nodes", function () {
	assert.isDefined(tnt.tree.node);
	assert.isFunction(tnt.tree.node);
    });

    it ("Has labels", function () {
	assert.isDefined(tnt.tree.label);
	assert.isFunction(tnt.tree.label);
    });

    it ("Has diagonal", function () {
	assert.isDefined(tnt.tree.diagonal);
	assert.isFunction(tnt.tree.diagonal);
    });

    it ("Has layout", function () {
	assert.isDefined(tnt.tree.layout);
	assert.isFunction(tnt.tree.layout);
    });

    it ("Has parse_newick", function () {
	assert.isDefined(tnt.tree.parse_newick);
	assert.isFunction(tnt.tree.parse_newick);
    });

    it ("Has parse_nhx", function () {
	assert.isDefined(tnt.tree.parse_nhx);
	assert.isFunction(tnt.tree.parse_nhx);
    });

    console.log(tnt.utils);

    it ("Has tnt utils", function () {
	assert.isDefined(tnt.utils);

	//script_path
	assert.isDefined(tnt.utils.script_path);
	assert.isFunction(tnt.utils.script_path);

	//defer_cancel
	assert.isDefined(tnt.utils.defer_cancel);
	assert.isFunction(tnt.utils.defer_cancel);

	// reduce
	assert.isDefined(tnt.utils.reduce);
    });

});
