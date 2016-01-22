var newick = "(((((((Mus musculus:0.0845,Rattus norvegicus:0.0916):0.2567,Oryctolagus cuniculus:0.2157):0.0153,(((((Pan troglodytes:0.0067,Homo sapiens:0.0067):0.0022,Gorilla gorilla:0.0088):0.0097,Pongo abelii:0.0183):0.0143,Macaca mulatta:0.0375):0.0220,Callithrix jacchus:0.0661):0.0891):0.0206,(((Felis catus:0.0986,Canis familiaris:0.1025):0.0498,Equus caballus:0.1094):0.0107,((Ovis aries:0.0618,Bos taurus:0.0618):0.0869,Sus scrofa:0.1073):0.0403):0.0329):0.2584,Monodelphis domestica:0.3408):0.0717,Ornithorhynchus anatinus:0.4566):0.1095,(((Gallus gallus:0.0414,Meleagris gallopavo:0.0414):0.1242,Taeniopygia guttata:0.1715):0.3044,Anolis carolinensis:0.4989):0.1700)";


// Selection of sorting criteria
var menu_pane1 = d3.select(yourDiv)
    .append("div")
    .append("span")
    .text("Sort By:  ");

var sel1 = menu_pane1
    .append("select")
    .on("change", function (d) {
        var prop = this.value;
        tree.root().sort(function(node1, node2) {
            var highest1 = get_highest_val(node1, prop);
            var highest2 = get_highest_val(node2, prop);
            return get_highest_val(node1, prop) - get_highest_val(node2, prop);
        });
        tree.update();
    });

sel1
    .append("option")
    .attr("value", "Chromosome pairs")
    .attr("selected", 1)
    .text("Number of chromosome pairs");

sel1
    .append("option")
    .attr("value", "Protein-coding genes")
    .text("Number of protein-coding genes");

sel1
    .append("option")
    .attr("value", "Genome length")
    .text("Genome length");

sel1
    .append("option")
    .attr("value", "Cuteness factor")
    .text("Cuteness factor");

// Selection of coloring criteria
var menu_pane2 = d3.select(yourDiv)
    .append("div")
    .append("span")
    .text("Color by: ");

var sel2 = menu_pane2
    .append("select")
    .on("change", function (d) {
        // Create a new color scale
        var prop = this.value;
        var vals = [];
        for (var sp in species_data) {
            vals.push(species_data[sp][prop]);
        }
        var extent = d3.extent(vals);
        var scale = d3.scale.linear()
            .domain(extent)
            .range(["steelblue", "red"]);

        tree.node_display(tree.node_display()
            .fill(function (node) {
                if (node.is_leaf()) {
                    return scale(species_data[node.node_name()][prop]);
                }
                return "black";
            })
        );

        tree.update_nodes();
    });

sel2
    .append("option")
    .attr("value", "Chromosome pairs")
    .attr("selected", 1)
    .text("Number of chromosome pairs");

sel2
    .append("option")
    .attr("value", "Protein-coding genes")
    .text("Number of protein-coding genes");

sel2
    .append("option")
    .attr("value", "Genome length")
    .text("Genome length");

sel2
    .append("option")
    .attr("value", "Cuteness factor")
    .text("Cuteness factor");



var tree_data = tnt.tree.parse_newick(newick);

var prop = "Chromosome pairs";
var vals = [];

for (var sp in species_data) {
    vals.push(species_data[sp][prop]);
}

var extent = d3.extent(vals);

var scale = d3.scale.linear()
    .domain(extent)
    .range(["steelblue", "red"]);

var tree = tnt.tree();
tree
    .data(tree_data)
    .duration(1000)
    .layout(tnt.tree.layout.vertical()
        .width(600)
        .scale(false)
    )
    .node_display(tree.node_display()
        .size(7)
        .fill (function(node) {
            if (node.is_leaf()) {
                return scale(species_data[node.node_name()][prop]);
            }
            return "black";
        })
    );

// Increase the separation between nodes
tree
    .label()
    .height(function(){
        return 20;
    });

var root = tree.root();
root.sort (function (node1, node2) {
    var highest1 = get_highest_val(node1, 'Chromosome pairs');
    var highest2 = get_highest_val(node2, 'Chromosome pairs');
    return highest1 - highest2;
});

// The visualization is started at this point
tree(yourDiv);

// Helper function to get the lowest value in
// the subnode -- this is used in the sort cbak
function get_highest_val (node, prop) {
    var highest = 0;
    node.apply(function (n) {
        if (species_data[n.node_name()] === undefined) {
            return;
        }
        var val = parseFloat(species_data[n.node_name()][prop]);
        if (val > highest) {
            highest = val;
        }
    });
    return highest;
}
