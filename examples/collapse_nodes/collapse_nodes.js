var tnt_theme_tree_collapse_nodes = function() {
    "use strict";

    var tree_theme = function(tree_vis, div) {

        var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,(mus_musculus:95, rat:100)rodents:55)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

        var data = tnt.tree.parse_newick(newick);

        // Show different node shapes for collapsed/non-collapsed nodes
        var node_size = 14;
        var node_fill="lightgrey";
        var node_stroke="black";
        var expanded_node = tnt.tree.node_display.circle()
            .size(node_size)
            .fill(node_fill)
            .stroke(node_stroke);
        var collapsed_node = tnt.tree.node_display.triangle()
            .size(node_size)
            .fill(node_fill)
            .stroke(node_stroke)

        var node_display = tnt.tree.node_display()
            .size(24)
            .display (function (node) {
                if (node.is_collapsed()) {
                    collapsed_node.display().call(this, node);
                } else {
                    expanded_node.display().call(this, node);
                }
        });

        tree_vis
            .node_display(node_display)
            .data(data)
            .duration(500)
            .layout(tnt.tree.layout.vertical()
            .width(600)
            .scale(false));

        tree_vis.on ("click", function(node){
            node.toggle()
            tree_vis.update();
        });

        // The visualization is started at this point
        tree_vis(div);

    };

    return tree_theme;
};
