var tnt_theme_tree_labels = function() {
    "use strict";

    var tree_theme = function (tree_vis, div) {

	var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

	var pics_path = "./pics/";

	var scientific_to_common = {
	    "homo_sapiens" : "human",
	    "pan_troglodytes" : "chimpanzee",
	    "callithrix_jacchus" : "marmoset",
	    "mus_musculus" : "mouse",
	    "taeniopygia_guttata" : "zebra finch",
	    "danio_rerio" : "zebrafish"
	};

	var names_to_pics = {
	    "homo_sapiens" : pics_path + "homo_sapiens.png",
	    "pan_troglodytes" : pics_path + "pan_troglodytes.png",
	    "callithrix_jacchus" : pics_path + "callithrix_jacchus.png",
	    "mus_musculus" : pics_path + "mus_musculus.png",
	    "taeniopygia_guttata" : pics_path + "taeniopygia_guttata.png",
	    "danio_rerio" : pics_path + "danio_rerio.png"
	};

	// Different labels

	// The empty label shows no label
	var empty_label = tnt.tree.label.text()
	    .text(function () {
		return "";
	    })

	// The original label shows the name of the node (default)
	var original_label = tnt.tree.label.text()
	    .on("click", function (node) {console.log(node)}); // Default options (ie. unchanged names)

	// The clean label shows the names substituting underscores with spaces
	var clean_label = tnt.tree.label.text() // Same as default but without underscores
	    .text(function (node) {
		return node.data().name.replace(/_/g, ' ');
	    });

	// The prefix label shows the first 7 characters of the labels appending '...' at the end
	var prefix_label = tnt.tree.label.text() // Showing only 7 characters
	    .text(function (node) {
		return node.data().name.substr(0,6) + "...";
	    });

	// The common label shows the common name of the species
	var common_label = tnt.tree.label.text()
	    .text(function (node) {
		return scientific_to_common[node.data().name]
	    })

	var separated_label = tnt.tree.label.text()
	    .text(function (node) {
		return scientific_to_common[node.data().name]
	    })
	    .height(function () {
		return 50;
	    });


	// The image label shows a picture of the species
	var image_label = tnt.tree.label.img()
	    .src(function (node) {
		return names_to_pics[node.data().name];
	    })
	    .width(function () {
		return 50;
	    })
	    .height(function () {
		return 50;
	    });

	// The mixed label shows a picture for the leaves and the name of the internal nodes
	// var mixed_label = function (node) {
	//     if (node.branchset !== undefined) { // internal node
	// 	original_label.call(this, node);
	//     } else { // leaf
	// 	image_label.call(this, node);
	//     }
	// }
	// mixed_label.remove = image_label.remove;

	// var internal_label = tnt.tree.label.text()
	//     .text(function (node) {
	// 	if (node.is_leaf()) {
	// 	    return ""
	// 	}
	// 	return node.name;
	//     })
	//     .width(function (node) {
	// 	console.log("NODE:");
	// 	console.log(node);
	// 	if (node.children === undefined) {
	// 	    return 0;
	// 	}
	// 	return node.name.length * this.fontsize();
	//     });
	// var mixed_label = tnt.tree.label.composite()
	//     .add_label(original_label)
	//     .add_label(image_label);

	// The joined label shows a picture + the common name
	var joined_label = tnt.tree.label.composite()
	    .add_label (tnt.tree.label.img()
			.src (function (node) {
			    return names_to_pics[node.data().name];
			})
			.width(function () {
			    return 50;
			})
			.height(function () {
			    return 50;
			}))
	    .add_label(tnt.tree.label.text()
		       .text(function (node) {
			   return scientific_to_common[node.data().name]
		       }));

	// text - image - text shows the node id, the pic of the species and its name
	// First text (may be variable)
	var text1 = tnt.tree.label.text()
        .fontsize(15)
	    .text (function (node) {
            return node.id();
	    });
	var root = tnt.tree.node(tnt.tree.parse_newick(newick));
	var max_width_text1 = d3.max(root.get_all_leaves(), function (node) {
	    return text1.width()(node);
	});

	var text_img_text = tnt.tree.label.composite()
	    .add_label(text1
		       .width(function () {return max_width_text1}))
	    .add_label (tnt.tree.label.img()
			.src (function (node) {
			    return names_to_pics[node.data().name];
			})
			.width(function () {
			    return 50;
			})
			.height(function () {
			    return 50;
			}))
	    .add_label(tnt.tree.label.text()
            .fontsize(15)
	       .text(function (node) {
			   return scientific_to_common[node.node_name()]
	       }));


	// The menu to change the labels dynamically
	var menu_pane = d3.select(div)
	    .append("div")
	    .append("span")
	    .text("Label display:   ");

	var label_type_menu = menu_pane
	    .append("select")
	    .on("change", function () {
		switch (this.value) {
		case "empty" :
		    tree_vis.label(empty_label);
		    break;
		case "original" :
		    tree_vis.label(original_label);
		    break;
		case "clean" :
		    tree_vis.label(clean_label);
		    break;
		case "prefix" :
		    tree_vis.label(prefix_label);
		    break;
		case "common" :
		    tree_vis.label(common_label);
		    break;
		case "separated" :
		    tree_vis.label(separated_label);
		    break;
		case "image" :
		    tree_vis.label(image_label);
		    break;
		// case "mixed" :
		//     sT.label(mixed_label);
		//     break;
		case "joined" :
		    tree_vis.label(joined_label);
		    break;
		case "three" :
		    tree_vis.label(text_img_text);
		    break;
		}

		tree_vis.update();
	    });

	label_type_menu
	    .append("option")
	    .attr("value", "empty")
	    .text("empty");

	label_type_menu
	    .append("option")
	    .attr("value", "original")
	    .attr("selected", 1)
	    .text("original");

	label_type_menu
	    .append("option")
	    .attr("value", "clean")
	    .text("clean");

	label_type_menu
	    .append("option")
	    .attr("value", "prefix")
	    .text("prefix");

	label_type_menu
	    .append("option")
	    .attr("value", "common")
	    .text("common name");

	label_type_menu
	    .append("option")
	    .attr("value", "separated")
	    .text("Vertical separation");

	label_type_menu
	    .append("option")
	    .attr("value", "image")
	    .text("species image");

	label_type_menu
	    .append("option")
	    .attr("value", "three")
	    .text("text - image - text");

	label_type_menu
	    .append("option")
	    .attr("value", "joined")
	    .text("joined img + text");


	tree_vis
	    .data(tnt.tree.parse_newick(newick))
	    .duration(2000)
	    .layout(tnt.tree.layout.vertical().width(600).scale(false))
	    .label(original_label);

	// The visualization is started at this point
	tree_vis(div);
    };

    return tree_theme;
};
