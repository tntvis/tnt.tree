// gene tree
var rest = tnt.rest()
    .domain("rest.ensembl.org");

var url = rest.url()
    .endpoint("genetree/id/:id")
    .parameters({
        id: "ENSGT00390000003602"
    });

rest.call(url)
    .then (function (resp) {
        var tree = resp.body.tree;
        var tree_vis = tnt.tree()
            .data(tree)
            .label(tnt.tree.label.text()
                .fontsize(10)
                .height(20)
                .text(function (node) {
                    var data = node.data();
                    if (data.id && data.id.accession) {
                        return data.id.accession;
                    }
                    return "";
                })
        );

        tree_vis.layout().width(700);

        tree_vis(yourDiv);
    });
