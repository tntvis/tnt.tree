var tnt_theme_tree_node_size = function () {
    "use strict";
    
    var scale = d3.scale.linear()
	.domain(extent(species_data, "Protein-coding genes"))
	.range([2, 10])
    
    var theme = function (tree_vis, div) {
	
	var node_size = function (node) {
	    if (node.node_name()) {
		return scale(species_data[node.node_name()]['Protein-coding genes']);
	    }
	    return 2;
	};

	tree_vis
	    .data(tnt.tree.parse_newick(newick))
	    .node_display(tnt.tree.node_display.circle()
	    		  .size(node_size)
	    		  .fill("white"))
	    .layout(tnt.tree.layout.vertical()
		    .width(700)
		    .scale(true)
		   )
	    .label(tnt.tree.label.text()
	    	   .text(function (node) {
	    	       return node.node_name();
	    	   })
		  );

	tree_vis(div);
    };

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
    
    return theme;
};

var newick = "(((((((Mus musculus:0.0845,Rattus norvegicus:0.0916):0.2567,Oryctolagus cuniculus:0.2157):0.0153,(((((Pan troglodytes:0.0067,Homo sapiens:0.0067):0.0022,Gorilla gorilla:0.0088):0.0097,Pongo abelii:0.0183):0.0143,Macaca mulatta:0.0375):0.0220,Callithrix jacchus:0.0661):0.0891):0.0206,(((Felis catus:0.0986,Canis familiaris:0.1025):0.0498,Equus caballus:0.1094):0.0107,((Ovis aries:0.0618,Bos taurus:0.0618):0.0869,Sus scrofa:0.1073):0.0403):0.0329):0.2584,Monodelphis domestica:0.3408):0.0717,Ornithorhynchus anatinus:0.4566):0.1095,(((Gallus gallus:0.0414,Meleagris gallopavo:0.0414):0.1242,Taeniopygia guttata:0.1715):0.3044,Anolis carolinensis:0.4989):0.1700)";

var species_data = {
    'Homo sapiens' : {
	'Chromosome pairs' : 23,
	'Protein-coding genes' : 20805,
	'Genome length' : 3.1,
	'Ensembl date' : new Date(2001, 07),
	'Cuteness factor' : 6
    },
    'Tetraodon nigroviridis' : {
	'Chromosome pairs' : 21,
	'Protein-coding genes' : 19602,
	'Genome length' : 0.36,
	'Ensembl date' : new Date(2004, 09),
	'Cuteness factor' : 10
    },
    'Monodelphis domestica' : {
	'Chromosome pairs' : 11,
	'Protein-coding genes' : 21327,
	'Genome length' : 3.6,
	'Ensembl date' : new Date(2005, 11),
	'Cuteness factor' : 9
    },
    'Mus musculus' : {
	'Chromosome pairs' : 20,
	'Protein-coding genes' : 23148,
	'Genome length' : 2.7,
	'Ensembl date' : new Date(2002,01),
	'Cuteness factor' : 7
    },
    'Ornithorhynchus anatinus' : {
	'Chromosome pairs' : 26,
	'Protein-coding genes' : 21698,
	'Genome length' : 2.1,
	'Ensembl date' : new Date(2006,12),
	'Cuteness factor' : 9
    },
    'Pan troglodytes' : {
	'Chromosome pairs' : 24,
	'Protein-coding genes' : 18759,
	'Genome length' : 3.3,
	'Ensembl date' : new Date(2004,05),
	'Cuteness factor' : 6
    },
    'Macaca mulatta' : {
	'Chromosome pairs' : 21,
	'Protein-coding genes' : 21905,
	'Genome length' : 3.1,
	'Ensembl date' : new Date(2005,12),
	'Cuteness factor' : 6
    },
    'Ovis aries' : {
	'Chromosome pairs' : 27,
	'Protein-coding genes' : 20921,
	'Genome length' : 2.6,
	'Ensembl date' : new Date(2013,12),
	'Cuteness factor' : 6
    },
    'Sus scrofa' : {
	'Chromosome pairs' : 19,
	'Protein-coding genes' : 21630,
	'Genome length' : 2.8,
	'Ensembl date' : new Date(2009,09),
	'Cuteness factor' : 5
    },
    'Ciona intestinalis' : {
	'Chromosome pairs' : 14,
	'Protein-coding genes' : 16658,
	'Genome length' : 0.1,
	'Ensembl date' : new Date(2005,05),
	'Cuteness factor' : 3
    },
    'Rattus norvegicus' : {
	'Chromosome pairs' : 21,
	'Protein-coding genes' : 22941,
	'Genome length' : 2.9,
	'Ensembl date' : new Date(2002,11),
	'Cuteness factor' : 5
    },
    'Anolis carolinensis' : {
	'Chromosome pairs' : 14,
	'Protein-coding genes' : 18596,
	'Genome length' : 1.8,
	'Ensembl date' : new Date(2009,03),
	'Cuteness factor' : 7
    },
    'Bos taurus' : {
	'Chromosome pairs' : 30,
	'Protein-coding genes' : 19994,
	'Genome length' : 2.7,
	'Ensembl date' : new Date(2005,07),
	'Cuteness factor' : 6
    },
    // 'Danio rerio' : {
    // 	'Chromosome pairs' : 25,
    // 	'Protein-coding genes' : 26247,
    // 	'Genome length' : 1.4,
    // 	'Ensembl date' : new Date(2002,03),
    // 	'Cuteness factor' : 3
    // },
    'Pongo abelii' : {
	'Chromosome pairs' : 24,
	'Protein-coding genes' : 20424,
	'Genome length' : 3.4,
	'Ensenbl date' : new Date(2011,04),
	'Cuteness factor' : 8
    },
    'Callithrix jacchus' : {
	'Chromosome pairs' : 23,
	'Protein-coding genes' : 20993,
	'Genome length' : 2.9,
	'Ensembl date' : new Date(2009,09),
	'Cuteness factor' : 8
    },
    'Equus caballus' : {
	'Chromosome pairs' : 32,
	'Protein-coding genes' : 20449,
	'Genome length' : 2.5,
	'Ensembl date' : new Date(2008,03),
	'Cuteness factor' : 6
    },
    // 'Canorhabditis elegans' : {
    // 	'Chromosome pairs' : 6,
    // 	'Protein-coding genes' : 20532,
    // 	'Genome length' : 0.1,
    // 	'Ensembl date' : new Date(2003,02),
    // 	'Cuteness factor' : 1
    // },
    // 'Saccharomyzes cerevisiae' : {
    // 	'Chromosome pairs' : 16,
    // 	'Protein-coding genes' : 6692,
    // 	'Genome length' : 0.01,
    // 	'Ensembl date' : new Date(2007,12),
    // 	'Cuteness factor' : 6
    // },
    // 'Oryzias latipes' : {
    // 	'Chromosome pairs' : 24,
    // 	'Protein-coding genes' : 19699,
    // 	'Genome length' : 0.87,
    // 	'Ensembl date' : new Date(2006,10),
    // 	'Cuteness factor' : 4
    // },
    'Taeniopygia guttata' : {
	'Chromosome pairs' : 40,
	'Protein-coding genes' : 17488,
	'Genome length' : 1.2,
	'Ensembl date' : new Date(2009,03),
	'Cuteness factor' : 8
    },
    'Gasterosteus aculeatus' : {
	'Chromosome pairs' : 22,
	'Protein-coding genes' : 20787,
	'Genome length' : 0.46,
	'Ensembl date' : new Date(2006,08),
	'Cuteness factor' : 3
    },
    'Gallus gallus' : {
	'Chromosome pairs' : 39,
	'Protein-coding genes' : 15508,
	'Genome length' : 1,
	'Ensembl date' : new Date(2004,06),
	'Cuteness factor' : 4
    },
    'Felis catus' : {
	'Chromosome pairs' : 19,
	'Protein-coding genes' : 19493,
	'Genome length' : 2.5,
	'Ensembl date' : new Date(2007,02),
	'Cuteness factor' : 9
    },
    'Gorilla gorilla' : {
	'Chromosome pairs' : 24,
	'Protein-coding genes' : 20962,
	'Genome length' : 3,
	'Ensembl date' : new Date(2008,12),
	'Cuteness factor' : 4
    },
    'Oryctolagus cuniculus' : {
	'Chromosome pairs' : 22,
	'Protein-coding genes' : 19293,
	'Genome length' : 2.7,
	'Ensembl date' : new Date(2006,08),
	'Cuteness factor' : 10
    },
    'Meleagris gallopavo' : {
	'Chromosome pairs' : 40,
	'Protein-coding genes' : 14125,
	'Genome length' : 1.1,
	'Ensembl date' : new Date(2010,03),
	'Cuteness factor' : 2
    },
    'Canis familiaris' : {
	'Chromosome pairs' : 39,
	'Protein-coding genes' : 19856,
	'Genome length' : 2.4,
	'Ensembl date' : new Date(2004,12),
	'Cuteness factor' : 6
    }
};
