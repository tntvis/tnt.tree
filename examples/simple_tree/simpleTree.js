var theme = function() {
    "use strict";

    var _ = function (tree_vis, div) {

        tree_vis
            .data(tnt.tree.parse_newick(newick))
            .node_display(tree_vis.node_display()
                .size(4)
                .fill("#888888")
            )
            .label (tnt.tree.label.text()
                .fontsize(12)
                .height(24)
            )
            .layout(tnt.tree.layout.vertical()
                .width(650)
                .scale(false)
            );

    tree_vis(div);
};

return _;
};

// newick tree
var newick = "(((C.elegans,Fly),(((((((((Tasmanian Devil,Wallaby,Opossum),((Armadillo,Sloth),(Rock hyrax,Tenrec,Elephant),(((Rabbit\
,Pika),(((Rat,Mouse),Kangaroo rat,Squirrel),Guinea Pig)),((Mouse lemur,Bushbaby),((((((Chimp,Human,Gorilla),Orangutan),Gibbon),Maca\
que),Marmoset),Tarsier)),Tree Shrew),((Microbat,Flying fox),(Hedgehog,Shrew),((Panda,Dog,Domestic ferret),Cat),((Cow,Sheep),Pig,Alp\
aca,Dolphin),Horse))),Platypus),((((Collared flycatcher,Zebra finch),(Chicken,Turkey),Duck),Chinese softshell turtle),Anole lizard)\
),Xenopus),Coelacanth),(((Zebrafish,Cave fish),((((Medaka,Platyfish),Stickleback),(Fugu,Tetraodon),Tilapia),Cod)),Spotted gar)),Lam\
prey),(C.savignyi,C.intestinalis))),S.cerevisiae);"
