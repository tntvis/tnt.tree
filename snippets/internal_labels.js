var newick = "(((Crotalus_oreganus_oreganus_cytochrome_b:0.00800,Crotalus_horridus_cytochrome_b:0.05866):0.04732,(Thamnophis_elegans_terrestris_cytochrome_b:0.00366,Thamnophis_atratus_cytochrome_b:0.00172):0.06255):0.00555,(Pituophis_catenifer_vertebralis_cytochrome_b:0.00552,Lampropeltis_getula_cytochrome_b:0.02035):0.05762,((Diadophis_punctatus_cytochrome_b:0.06486,Contia_tenuis_cytochrome_b:0.05342):0.01037,Hypsiglena_torquata_cytochrome_b:0.05346):0.00779);";

var internal_label = tnt.tree.label.text()
    .text(function (node) {
        return node.data().branch_length;
    })
    .fontweight("bold")
    .fontsize(13)
    .color("red")
    .transform(function (node) {
        return {
            "translate" : [-50, -5],
            "rotate" : -0
        };
    });

var leaf_label = tnt.tree.label.text()
    .fontsize(14);

var node_label = tnt.tree.label()
    .width(leaf_label.width())
    .height(30)
    .display(function (node) {
        if (node.is_leaf()) {
            return leaf_label.display().call(this, node, "vertical");
        } else {
            return internal_label.display().call(this, node, "vertical");
        }
    })
    .transform(function (node) {
        if (node.is_leaf()) {
            return leaf_label.transform().call(this, node, "vertical");
        } else {
            return internal_label.transform().call(this, node, "vertical");
        }
    });

var tree = tnt.tree();
tree
    .data (tnt.tree.parse_newick(newick))
    .label (node_label)
    .layout(tnt.tree.layout.vertical()
        .width(950)
        .scale(true)
    );

tree(yourDiv);
