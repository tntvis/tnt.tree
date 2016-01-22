var newick = "(((Crotalus_oreganus_oreganus_cytochrome_b:0.00800,Crotalus_horridus_cytochrome_b:0.05866):0.04732,(Thamnophis_elegans_terrestris_cytochrome_b:0.00366,Thamnophis_atratus_cytochrome_b:0.00172):0.06255):0.00555,(Pituophis_catenifer_vertebralis_cytochrome_b:0.00552,Lampropeltis_getula_cytochrome_b:0.02035):0.05762,((Diadophis_punctatus_cytochrome_b:0.06486,Contia_tenuis_cytochrome_b:0.05342):0.01037,Hypsiglena_torquata_cytochrome_b:0.05346):0.00779);";

var branch_length_label = tnt.tree.label.text()
    .width(function () {
        return -10;
    })
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

var node_name_label = tnt.tree.label.text()
    .height(function () {
        return 40;
    })
    .fontsize(14);

var label = tnt.tree.label.composite()
    .add_label(branch_length_label)
    .add_label(node_name_label);

var tree_vis = tnt.tree()
    .data (tnt.tree.parse_newick(newick))
    .label (label)
    .layout(tnt.tree.layout.vertical()
        .width(950)
        .scale(true)
    );

tree_vis(yourDiv);
