/**
 * Holds information about a connected component.
 */
class Component {
    /**
     * Id of the bar.
     */
    id;
    /**
     * Nodes contained in this component.
     */
    nodes;

    /**
     * Default constructor, assigns the given id and adds the node to this component.
     * @param node in this component.
     * @param id of this component.
     */
    constructor(node, id) {
        this.id = id;
        this.nodes = [];
        this.nodes.push(node);
    }

    /**
     * Checks if the component contains a node with the given id.
     * @param id of the node.
     * @returns {*} undefined/false if node is not found
     */
    contains(id) {
        return this.nodes.find(function (node) {
            return node.id === id;
        });
    }
}

/**
 * Holds information about a bar.
 */
class Bar {
    /**
     * Time of death.
     */
    death;
    /**
     * Id of the bar.
     */
    id;
    /**
     * Edge associated with this bar.
     */
    edge;

    /**
     * Ratio of the spanning 2 components of the spanning tree separated by the associated edge.
     */
    ratio;

    /**
     * True if the bar is selected and repulsion is added.
     */
    selected;

    /**
     * List of nodes contained on one set created by removing the associated edge from the mst.
     */
    componentA;

    /**
     * Disjoint set with componentA.
     */
    componentB;

    /**
     * Default constructor for a bar, initialises with default values.
     * @param id of the bar.
     */
    constructor(id) {
        this.death = Number.POSITIVE_INFINITY;  // 1/w
        this.id = id;                           // bar ID
        this.edge = null;                       // cause of death
        this.ratio = 0.2;                       // ratio
        this.selected = false;                  // selected
        this.componentA = [];                   // if the bar is selected these two components
        this.componentB = [];                   // will repulse each other
    }
}

/**
 * Bars of the barchart.
 */
let bars;

/**
 * Width of the barchart.
 */
let bar_width;

/**
 * Height of the barchart.
 */
let bar_height;


/**
 * y scale for the barcodes.
 */
let y;

/**
 * x scale for the barcodes.
 */
let x;

/**
 * Default colour for the larger bar.
 * @type {string}
 */
const largeBar = "#E39410";
/**
 * Default colour for the smaller bar.
 * @type {string}
 */
const smallBar = "#167EE6";
/**
 * Default colour for the bar enclosing the small and larger bar.
 * @type {string}
 */
const deselectedBar = "#FFFFFF";

/**
 * Contains the opacity of the selected nodes incident links.
 */
let prev_opacity;

/**
 * Creates the interactive barcode using the data of bars.
 * @param bars with the stored persistent homology data
 */
function create_barcode(bars) {
    y = d3.scaleBand()
        .range([bar_height, 0])
        .padding(0.1);

    x = d3.scaleLinear()
        .range([0, bar_width]);

    let svg = d3.select("#barcode");
    svg.append("g");

    // format the data
    bars.forEach(function (d) {
        d.death = +d.death;
    });
    bars.sort(function (a, b) {
        if (a.death !== b.death) {
            return b.death - a.death;
        } else {
            return b.ratio - a.ratio;
        }
    });

    // Scale the range of the data in the domains
    x.domain([0, d3.max(bars, function (d) {
        return d.death;
    }) + 1])
    y.domain(bars.map(function (d) {
        return d.id;
    }));

    // set the slider accordingly
    document.getElementById("slider").max = d3.max(bars, function (d) {
        return d.death;
    }) + 1;
    document.getElementById("slider").value = 0;
    document.getElementById("slider").step = document.getElementById("slider").max / x(document.getElementById("slider").max);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(bars)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("width", function (d) {
            return x(d.death * d.ratio);
        })
        .attr("y", function (d) {
            return y(d.id);
        })
        .attr("fill", smallBar)
        .attr("height", y.bandwidth())

    // adding the second (stacked) bar
    svg.selectAll(".bar")
        .data(bars)
        .exit().data(bars)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return x(d.death * d.ratio);
        })
        .attr("width", function (d) {
            return x(d.death * (1 - d.ratio));
        })
        .attr("y", function (d) {
            return y(d.id);
        })
        .attr("fill", largeBar)
        .attr("height", y.bandwidth())

    // this bar is just used for the selection and to attach a border
    svg.selectAll(".bar")
        .data(bars)
        .exit().data(bars)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return 0;
        })
        .attr("width", function (d) {
            return x(d.death);
        })
        .attr("y", function (d) {
            return y(d.id);
        })
        .attr("height", y.bandwidth())
        .attr("fill", deselectedBar)
        .attr("opacity", 0.5)
        .on("click", function(d) {
            d.selected = !d.selected;
            if (d.selected) {
                d3.select(this).style("opacity", 0.0);
            } else {
                d3.select(this).style("opacity", 0.5);
            }
            update_repulsion(d);
        })
        .on("mouseover", function (d) {
            let colorA;
            let colorB;

            if (d.componentA.nodes.length < d.componentB.nodes.length) {
                colorA = smallBar;
                colorB = largeBar;
            } else {
                colorB = smallBar;
                colorA = largeBar;
            }

            nodes
                .selectAll("circle")
                .attr("fill", function (n) {
                    if (!d.componentA.contains(n.id)) {
                        return colorB;
                    } else {
                        return colorA;
                    }
                });

            prev_opacity = links.filter(function (n) {
                return d.edge.index === n.index;
            }).style("opacity");

            links
                .filter(function (n) {
                    return d.edge.index === n.index;
                })
                .style("opacity", 1.0)
                .style("stroke-width", 4);
        })
        .on("mouseout", function (d) {
            nodes
                .selectAll("circle")
                .attr("fill", function (g) {
                    return color(g.group);
                });

            links
                .filter(function (n) {
                    return d.edge.index === n.index;
                })
                .style("opacity", prev_opacity)
                .style("stroke-width", 1);
        });

    // adding the line associated with the slider => shows repulsion threshold
    svg
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", bar_height)
        .attr("fill", "#FF0000")
        .attr("stroke", "#4281fc")
        .attr("stroke-width", 2.0)
        .style("opacity", 1.0);
}

/***
 *  Function updates the blue bar following the slider.
 *  @param value of the slider position
 * */
function update_slider(value) {
    d3.select("#barcode").select("line")
        .attr("x1", x(value)) // we map the slider value to the x axis
        .attr("x2", x(value))
}

/**
 * Computes the 0D Barcode and all necessary parameters
 * for the bars.
 * Furthermore computes the Minimum Spanning Tree
 * using disjointed sets (algorithm).
 * @param nodes nodes of the graph
 * @param links edges of the graph
 * @returns *[] of bars
 */
function get_ph_features(nodes, links) {
    let mst = [];  // contains the MST
    let bars = []; // contains bars with their live and death
    let components = []; // contains all "living" components

    // for all nodes
    for (let i = 0; i < nodes.length; i++) {
        bars[i] = new Bar(i); // initialise bar with death of 1
        components[i] = new Component(nodes[i], i);         // initialise component with the node
    }

    // sort the links
    links.sort(function (a, b) {// persistence = 1/w -> increasing = a - b
        return 1 / a.value - 1 / b.value;
    });

    // loop through all edges
    for (let i = 0; i < links.length; i++) {
        // find the component of the source node u that is not in a "dead" component
        let c_u = components.find(function (component) {
            return component.contains(links[i].source);
        });

        // find the component of the target node v
        let c_v = components.find(function (component) {
            return component.contains(links[i].target);
        });

        if (c_v.id !== c_u.id) // if C_u and C_v not in
        {
            bars[c_u.id].death = links[i].value; // update death time (w instead of 1/w see paper)
            bars[c_u.id].edge = links[i];
            for (let j = 0; j < c_u.nodes.length; j++) // merge C_u and C_v into C_v
            {
                c_v.nodes.push(c_u.nodes[j]);
            }
            // remove c_u from the list so we don't think it exists separately
            components = components.filter(function (current_val) {
                return current_val.id !== c_u.id;
            });
            mst.push(links[i]); // add edge to MST
        }
    }
    // remove last component
    bars = bars.filter(function (element) {
        return element.death !== Number.POSITIVE_INFINITY
    });

    // for each bar now the ratio needs to be computed (see paper) i.e. for the edge e(u,v) that caused
    // the death of the bar
    // count nodes on left sie u = n
    // count nodes on right side v = m
    // ratio = n:m or ratio = n / (n + m) => count n then divide by all nodes
    for (let i = 0; i < bars.length; i++) {
        // for all nodes
        for (let i = 0; i < nodes.length; i++) {
            components[i] = new Component(nodes[i], i);  // initialise component with the node
        }

        // remove the edge that caused the death of this bar
        let mst_removed = mst.filter(function (element) {
            return element !== bars[i].edge;
        });

        // loop through the remaining edges
        for (let i = 0; i < mst_removed.length; i++) {
            // find the component of the source node u that is not in a "dead" component
            let c_u = components.find(function (component) {
                return component.contains(mst_removed[i].source);
            });

            // find the component of the target node v
            let c_v = components.find(function (component) {
                return component.contains(mst_removed[i].target);
            });

            if (c_v.id !== c_u.id) // if C_u and C_v not in
            {
                for (let j = 0; j < c_u.nodes.length; j++) // merge C_u and C_v into C_v
                {
                    c_v.nodes.push(c_u.nodes[j]);
                }
                components = components.filter(function (current_val) {
                    return current_val.id !== c_u.id;
                });
            }
        }

        // now we should have 2 components and we can take
        // an arbitrary one
        let n = (components[0].nodes.length >= components[1].nodes.length) ? components[1].nodes.length : components[0].nodes.length;
        // ratio is component size divided by all nodes
        bars[i].ratio = n / nodes.length;
        // we also keep the components in mind
        bars[i].componentA = components[0];
        bars[i].componentB = components[1];
    }

    return bars;
}
