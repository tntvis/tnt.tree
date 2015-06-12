var tnt_theme = function() {
    "use strict";

    var tree_theme = function (tree_vis, div) {
        // In the div, we set up a "select" to transition between two trees keeping node constancy
        var menu_pane = d3.select(div)
            .append("div")
            .append("span")
            .text("Tree:  ");

        var sel = menu_pane
            .append("select")
            .on("change", function(d) {
                var data = trees[this.value];
                tree_vis
                    .data(data)
                    .update()
        });

        sel
            .append("option")
            .attr("value", 0)
            .attr("selected", 1)
            .text("tree 1");
        sel
            .append("option")
            .attr("value", 1)
            .text("tree 2");

        var sel2 = menu_pane
            .append("select")
            .on("change", function (d) {
                tree_vis
                    .id(ids[this.value])
                    .update();
            })
        sel2
            .append("option")
            .attr("value", 0)
            .attr("selected", 1)
            .text("index by id");
        sel2
            .append("option")
            .attr("value", 1)
            .text("index by name");

        // We create the new tree
        var newick1 = "((((first,second)p,(third,fourth)s)d,fifth)e,sixth)g";
        var newick2 = "(((first,second)p,third)d,fourth)d";
        var trees = [
            tnt.tree.parse_newick(newick1),
            tnt.tree.parse_newick(newick2)
        ];
        var ids = [
            function (d) {
                return d._id
            },
            function (d) {
                return d.name || d._id;
            }
        ];

        tree_vis
            //.id ("_id")
            .node_display(tnt.tree.node_display.circle()
                .size(5)
                .stroke('black')
                .fill('grey')
            )
            .label(tnt.tree.label.text()
                //.height(20)
                .fontsize(function (node) {
                    if (node.is_leaf()) {
                        return 15;
                    }
                    return 12;
                })
                //.height(20)
                .fontweight("bold")
            )
            .data(trees[0])
            .layout(tnt.tree.layout.vertical()
                .width(600)
                .scale(false)
            )
            .duration(2000);

        // The visualization is started at this point
        tree_vis(div);
    };

    return tree_theme;
};
