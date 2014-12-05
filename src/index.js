var tree = require ("./tree.js");
tree.label = require("./label.js");
tree.diagonal = require("./diagonal.js");
tree.layout = require("./layout.js");
tree.node = require("../../tnt.node/index.js");
tree.parse_newick = require("../../tnt.newick/index.js").parse_newick;
tree.parse_nhx = require("../../tnt.newick/index.js").parse_nhx;

module.exports = exports = tree;

// module.exports.tree = require("./tree.js");
// module.exports.tree.label = require("./label.js");
// module.exports.tree.diagonal = require("./diagonal.js");
// module.exports.tree.layout = require("./layout.js");
// module.exports.tree.node = require("../../tnt.node/index.js");
// module.exports.tree.parse_newick = require("../../tnt.newick/index.js").parse_newick;
// module.exports.tree.parse_nhx = require("../../tnt.newick/index.js").parse_nhx;
