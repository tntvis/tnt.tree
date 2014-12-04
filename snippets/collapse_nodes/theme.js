var theme = function() {
    "use strict";

    var tree_theme = function(tree_vis, div) {

        var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"
        var data = tnt.tree.tree.parse_newick(newick);

        tree_vis
            .data(data)
            .duration(500)
            .layout(tnt.tree.tree.layout.vertical()
		    .width(600)
		    .scale(false));
            
        tree_vis.on_click (function(node){
            // sT
            node.toggle()
            tree_vis.update();
        });

        tree_vis
            .label()
            .height(function(){return 50});
        // The visualization is started at this point
        tree_vis(div);
    };

    return tree_theme;
};