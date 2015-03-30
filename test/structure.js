var tree = require ("../index.js");
var assert = require("chai").assert;

describe ('Tree', function () {
    it ("Imports correctly", function () {
	assert.isDefined(tree);
	assert.isFunction(tree);
    });

    // it ("Has nodes", function () {
    // 	assert.isDefined(tree.node);
    // 	assert.isFunction(tree.node);
    // });

    it ("Has node displays", function () {
	assert.isDefined(tree.node_display);
	assert.isFunction(tree.node_display)
    });
    
    it ("Has labels", function () {
	assert.isDefined(tree.label);
	assert.isFunction(tree.label);
    });

    it ("Has diagonal", function () {
	assert.isDefined(tree.diagonal);
	assert.isFunction(tree.diagonal);
    });

    it ("Has layout", function () {
	assert.isDefined(tree.layout);
	assert.isFunction(tree.layout);
    });

    // it ("Has parse_newick", function () {
    // 	assert.isDefined(tree.parse_newick);
    // 	assert.isFunction(tree.parse_newick);
    // });

    // it ("Has parse_nhx", function () {
    // 	assert.isDefined(tree.parse_nhx);
    // 	assert.isFunction(tree.parse_nhx);
    // });

    // it ("Has tnt utils", function () {
    // 	assert.isDefined(tnt.utils);

    // 	//script_path
    // 	assert.isDefined(tnt.utils.script_path);
    // 	assert.isFunction(tnt.utils.script_path);

    // 	//defer_cancel
    // 	assert.isDefined(tnt.utils.defer_cancel);
    // 	assert.isFunction(tnt.utils.defer_cancel);

    // 	// reduce
    // 	assert.isDefined(tnt.utils.reduce);
    // });

    // it ("Has tooltips", function () {
    // 	assert.isDefined(tnt.tooltip);
    // 	assert.isFunction(tnt.tooltip);
    // });
    
});
