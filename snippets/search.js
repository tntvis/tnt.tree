var span = d3.select(yourDiv)
    .append("span")
    .text("Search in tree: ");

span
    .append("input")
    .attr("type", "text")
    .on("input", function () {
        search(this.value);
    });



<!-- search -->
function color (node, val) {
    var name = node.node_name();
    if (name.toLowerCase().indexOf(val.toLowerCase()) > -1) {
        return "red";
    }
    return "black";
}

function search(val) {
    var root = tree_vis.root();

    tree_vis.node_display()
        .fill(function (node) {
            if (val) {
                return color(node, val);
            }
            return "black";
        });

    tree_vis.label()
        .color(function (node) {
            if (val) {
                return color(node, val);
            }
            return "black";
        })

    tree_vis.update_nodes();
}

    var newick = "(((C.elegans,Fly),(((((((((Tasmanian Devil,Wallaby,Opossum),((Armadillo,Sloth),(Rock hyrax,Tenrec,Elephant),(((Rabbit,Pika),(((Rat,Mouse),Kangaroo rat,Squirrel),Guinea Pig)),((Mouse lemur,Bushbaby),((((((Chimp,Human,Gorilla),Orangutan),Gibbon),Macaque),Marmoset),Tarsier)),Tree Shrew),((Microbat,Flying fox),(Hedgehog,Shrew),((Panda,Dog,Domestic ferret),Cat),((Cow,Sheep),Pig,Alpaca,Dolphin),Horse))),Platypus),((((Collared flycatcher,Zebra finch),(Chicken,Turkey),Duck),Chinese softshell turtle),Anole lizard)),Xenopus),Coelacanth),(((Zebrafish,Cave fish),((((Medaka,Platyfish),Stickleback),(Fugu,Tetraodon),Tilapia),Cod)),Spotted gar)),Lamprey),(C.savignyi,C.intestinalis))),S.cerevisiae);";

var tree_vis = tnt.tree()
    .data(tnt.tree.parse_newick(newick));

tree_vis.layout()
    .width(500)
    .scale(false);

tree_vis.node_display()
    .fill("black");

tree_vis.label()
    .color("black");

tree_vis(yourDiv);
