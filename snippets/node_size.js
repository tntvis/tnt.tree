
var newick = "(((((((Mus musculus:0.0845,Rattus norvegicus:0.0916):0.2567,Oryctolagus cuniculus:0.2157):0.0153,(((((Pan troglodytes:0.0067,Homo sapiens:0.0067):0.0022,Gorilla gorilla:0.0088):0.0097,Pongo abelii:0.0183):0.0143,Macaca mulatta:0.0375):0.0220,Callithrix jacchus:0.0661):0.0891):0.0206,(((Felis catus:0.0986,Canis familiaris:0.1025):0.0498,Equus caballus:0.1094):0.0107,((Ovis aries:0.0618,Bos taurus:0.0618):0.0869,Sus scrofa:0.1073):0.0403):0.0329):0.2584,Monodelphis domestica:0.3408):0.0717,Ornithorhynchus anatinus:0.4566):0.1095,(((Gallus gallus:0.0414,Meleagris gallopavo:0.0414):0.1242,Taeniopygia guttata:0.1715):0.3044,Anolis carolinensis:0.4989):0.1700)";

var scale = d3.scale.linear()
    .domain(extent(species_data, "Protein-coding genes"))
    .range([2, 10]);

var color_scale = d3.scale.linear()
    .domain(extent(species_data, "Protein-coding genes"))
    .range(["#ece7f2", "#2b8cbe"]);

var node_size = function (node) {
    if (node.node_name()) {
        return scale(species_data[node.node_name()]['Protein-coding genes']);
    }
    return 2;
};

var node_color = function (node) {
     if (node.is_leaf()) {
         return color_scale(species_data[node.node_name()]['Protein-coding genes']);
     }
     return "white";
 };

var tree = tnt.tree()
    .data(tnt.tree.parse_newick(newick))
    .node_display(tnt.tree.node_display.circle()
        .size(node_size)
        .fill(node_color)
    )
    .layout(tnt.tree.layout.vertical()
        .width(700)
        .scale(true)
    )
    .label(tnt.tree.label.text()
        .fontsize(12)
        .text(function (node) {
            return node.node_name();
        })
    );

tree(yourDiv);

function extent (data, attr) {
    var min;
    var max;
    for (var sp in species_data) {
        if (species_data.hasOwnProperty(sp)) {
            if ((species_data[sp] !== undefined) && (species_data[sp][attr] !== undefined)) {
                var val = species_data[sp][attr];
                if ((min === undefined) || (val < min)) min = val;
                if ((max === undefined) || (val > max)) max = val;
            }
        }
    }
    return [min, max];
}
