/**
 * Handle to the force simulation.
 */
let simulation;

/**
 * SVG group for links.
 */
let links;

/**
 * SVG group for nodes.
 */
let nodes;

/**
 * SVG group for bundle edges.
 */
let paths;

/**
 * Loaded data.
 */
let loaded_data;

/**
 * Default strong attraction strength. Between 0 and 1.
 * @type {number}
 */
let attraction_strength = 0.8;

/**
 * Default weak attraction strength for edges. Between 0 and 1.
 * @type {number}
 */
let attraction_strength_weak = 0.1;

/**
 * Default strong repulsion strength between two nodes.
 * @type {number}
 */
let repulsion_strength = -300;

/**
 * Default weak repulsion strength between two nodes.
 * @type {number}
 */
let repulsion_strength_weak = -30;

/**
 * Default size of the circle representing a node.
 * @type {number}
 */
let node_radius = 8;

/**
 * Default link opacity.
 * @type {number}
 */
let link_opacity = 0.4;

/**
 * Contains the node that currently is selected for additional information.
 * @type {null}
 */
let active_clicked = null;

/**
 * True if edges are bundled.
 * @type {boolean}
 */
let paths_loaded = false;

/**
 * Resizes the graph according to the window size.
 */
function resize_graph() {
    let svg_graph = d3.select("#graph");
    let width = window.innerWidth;
    let height = window.innerHeight;

    svg_graph.attr("width", width);
    svg_graph.attr("height", height);
}

/**
 * Reads the settings for the dataset.
 * @param settings for the dataset
 */
function configure_graph(settings) {
    attraction_strength = settings.attraction_strength;
    attraction_strength_weak = settings.attraction_strength_weak;
    repulsion_strength = settings.repulsion_strength;
    repulsion_strength_weak = settings.repulsion_strength_weak;
    link_opacity = settings.link_opacity;
    node_radius = settings.node_radius;
}

/**
 * Deselects nodes therefore removing the text and returning opacity to normal.
 */
function deselect_nodes() {
    $('#deselect_button').removeClass("fadeInDown").addClass("fadeOutUp");
    active_clicked = null;

    d3.selectAll("text")
        .remove();
    nodes.selectAll("rect")
        .remove();

    d3.selectAll("circle")
        .style("opacity", 1.0);


    if (paths_loaded) {
        paths.selectAll("path").style("stroke-opacity", link_opacity * 0.4);
    }
    else
    {
        links.style("opacity", link_opacity);
    }
}

/**
 * Creates the initial FDG and all necessary SVGs and forces.
 * @param data used to create the graph.
 */
function create_graph(data) {

    simulation = d3.forceSimulation();
    let width = window.innerWidth;
    let height = window.innerHeight;

    configure_graph(data.settings);

    let svg_graph = d3.select("#graph");

    svg_graph.attr("width", width);
    svg_graph.attr("height", height);

    let g = svg_graph.append("g")
        .attr("class", "everything");

    //add zoom capabilities
    let zoom_handler = d3.zoom()
        .on("zoom", function () {
            g.attr("transform", d3.event.transform);
        }).wheelDelta(function () {
            return (d3.event.deltaMode !== 1) ? -d3.event.deltaY * 0.0004 : -d3.event.deltaY * 0.02;
        });

    zoom_handler(svg_graph);

    links = g.append("g")
        .attr("class", "links")
        .selectAll("links")
        .data(data.links)
        .enter().append("line")
        .attr("stroke-width", 1)
        .attr("stroke", "#222222")
        .style("opacity", link_opacity);

    paths = g.append("g")
        .attr("class", "paths");

    nodes = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .enter().append("g");

    nodes.append("circle")
        .attr("r", node_radius)
        .attr("fill", function (d) {
            return color(d.group);
        })
        .on("click", function (d) {
            if (active_clicked === d.id) {
                deselect_button.removeClass('fadeInDown').addClass('fadeOutUp');
                active_clicked = null;
                d3.selectAll("text")
                    .remove();
                d3.selectAll("circle")
                    .style("opacity", 1.0);
                links
                    .style("opacity", (paths_loaded) ? 0.0 : link_opacity);
                
                if (paths_loaded) {
                    paths.selectAll("path").style("stroke-opacity", link_opacity * 0.4);
                }
                return;
            }

            brushLinks(d.id);
        });

    simulation
        .force("link", d3.forceLink().id(function (d) {
            return d.id;
        }))
        .force("center", d3.forceCenter(width / 2, height / 2));

    let group_map = new Map();

    for (let i = 0; i < data.nodes.length; i++) {
        if (group_map.get(data.nodes[i].group) === undefined) {
            group_map.set(data.nodes[i].group, 1);
        } else {
            group_map.set(data.nodes[i].group, group_map.get(data.nodes[i].group) + 1);
        }

        for (let j = i + 1; j < data.nodes.length; j++) {
            simulation.force(data.nodes[i].id.concat(data.nodes[j].id), isolate(d3.forceManyBody().strength(-30), data.nodes[i], data.nodes[j]));
        }
    }

    group_map[Symbol.iterator] = function* () {
        yield* [...this.entries()].sort((a, b) => a[1] - b[1]);
    }

    for (let [key, value] of group_map) {
        addGroupLabel(key, value);
    }

    simulation.on("end",
        function () {
            btn_bundle_edges.removeClass("disabled");
        })

    simulation.force("link").strength(attraction_strength_weak).distance(function (d) {
        return d.value;
    });

    simulation
        .nodes(data.nodes)
        .on("tick", animation);

    simulation.force("link")
        .links(data.links);
}

/**
 * Updates the link opacities.
 * @param d id of the selected node
 */
function brushLinks(d) {
    d3.selectAll("text")
        .remove();
    nodes.selectAll("rect")
        .remove();

    d3.selectAll("circle")
        .style("opacity", 1.0);

    links
        .style("opacity", (paths_loaded) ? 0.0 : link_opacity);

    if (paths_loaded) {
        paths.selectAll("path").style("stroke-opacity", link_opacity * 0.4);
    }

    let adj_nodes = [];
    adj_nodes.push(d);

    if (d === null) {
        return;
    }

    deselect_button.removeClass('fadeOutUp').addClass('fadeInDown');
    deselect_button.css("visibility", "visible");

    active_clicked = d;

    if (paths_loaded) {
        paths.selectAll("path").style("stroke-opacity", function () {
            if (d3.select(this).attr("source") === d || d3.select(this).attr("target") === d) {
                adj_nodes.push(d3.select(this).attr("source"));
                adj_nodes.push(d3.select(this).attr("target"));
                return 1.0;
            }
            return link_opacity * 0.4;
        });
    } else {
        links
            .style("opacity", function (l) {
                if (l.target.id === d || l.source.id === d) {
                    adj_nodes.push(l.target.id);
                    adj_nodes.push(l.source.id);
                    return 0.8;
                }
                return (paths_loaded) ? 0.0 : link_opacity * 0.5;
            });
    }

    d3.selectAll("circle")
        .style("opacity", function (n) {
            if (adj_nodes.find(function (element) {
                return element === n.id;
            })) {
                return 1.0;
            }
            return 0.3;
        });

    let connected_nodes = nodes.filter(
        function (t) {
            return adj_nodes.find(function (element) {
                return t.id === element;
            });
        });

    connected_nodes
        .append("rect")
        .style("fill", "#FFFFFF")
        .style("opacity", 0.0)
        .style("rx", 3)
        .style("ry", 3);

    connected_nodes
        .append("text")
        .text(function (n) {
            return n.id;
        })
        .attr("x", 6)
        .attr("y", 3)
        .style("background-color", "#FFFFFF")
        .style("font-size", "8px")
        .style("font-weight", "bold")
        .style("position", "absolute")
        .style("z-index", 2)
        .style("opacity", 0.4)
        .on("mouseover", function () {
            d3.select(this.parentNode).each(function () {
                this.parentNode.appendChild(this);
            });
            d3.select(this).style("opacity", 1.0);



            let bbox = d3.select(this).node().getBBox();
            console.log(d3.select(this).attr("width"));
            console.log(d3.select(this).attr("height"));

            d3.select(this.parentNode).select("rect").style("opacity", 1.0)
                .attr("width", bbox.width + 4)
                .attr("x", d3.select(this).attr("x") - 2)
                .attr("y", -d3.select(this).attr("y") - 2)
                .attr("height", bbox.height + 0.5);
        })
        .on("mouseout", function () {
            d3.select(this).style("opacity", 0.4);
            d3.select(this.parentNode).select("rect").style("opacity", 0.0);
        });
}

/**
 * Computes the edge bundling for the current graph layout.
 */
function bundle_Edges() {
    disablePaths();

    let bundling = d3.ForceEdgeBundling()
        .step_size(0.1)
        .compatibility_threshold(0.4)
        .nodes(simulation.nodes())
        .edges(loaded_data.links);
    let results = bundling();

    let d3line = d3.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        });

    results.forEach(function (sub_points) {
        // for each of the arrays in the results
        // draw a line between the sub-divisions points for that edge
        paths
            .append("path")
            .attr("d", d3line(sub_points))
            .attr("source", sub_points[0].id)
            .attr("target", sub_points[sub_points.length - 1].id)
            .style("stroke-width", 1)
            .style("stroke", "#222222")
            .style("fill", "none")
            .style('stroke-opacity', link_opacity * 0.4); //use opacity as blending
    });

    paths_loaded = true;
    links.style("opacity", 0.0);

    if (active_clicked != null) {
        brushLinks(active_clicked);
    }
}

/**
 * Creates an isolated repulsion force for the nodes A and B.
 * @param force force that is isolated for A and B
 * @param nodeA first node
 * @param nodeB second node
 * @returns {*} the repulsion force
 */
function isolate(force, nodeA, nodeB) {
    let initialize = force.initialize;
    force.initialize = function () {
        initialize.call(force, [nodeA, nodeB]);
    };
    return force;
}

/**
 * Adds a Group label for the given name with the number of elements of this group.
 * @param name of the group
 * @param number of elements in the group
 */
function addGroupLabel(name, number) {
    let btn = $("<button></button>").text(name)
        .addClass("btn")
        .addClass("btn-sm")
        .addClass("disabled")
        .addClass("font-weight-bold")
        .css("color", "#FFFFFF")
        .css("opacity", 1.0)
        .css("background-color", color(name));

    let span = $("<span></span>").text(number)
        .addClass("badge")
        .attr("style", "color: #220 !important")
        .css("background-color", "#FFFFFF")
        .addClass("font-weight-bold")
        .addClass("ml-2")
        .addClass("float-right")
        .css("font-size", "x-small");

    btn.append(span);
    group_div.append(btn);
}

/**
 * Updates the position of nodes and links on each tick.
 */
function animation() {
    updateNodesAndLinks()
}

/**
 * Lets the simulation tick 500 times and then updates nodes and link positions.
 */
function noAnimation() {
    for (let i = 0; i < 500; i++) {
        simulation.tick();
    }
    updateNodesAndLinks();
    simulation.stop();
}

/**
 * Updates the position of nodes and links.
 */
function updateNodesAndLinks() {
    if (paths_loaded) {
        paths_loaded = false;
        d3.selectAll("path").remove();
    }

    links
        .attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });

    nodes
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
}

/**
 * Disables or Enables the animation of the graph optimisation process.
 * @param enable true to show the animation
 * */
function changeAnimate(enable) {
    if (enable) {
        simulation
            .on("tick", animation);
    } else {
        simulation
            .on("tick", noAnimation);
    }
}

/**
 * Updates the size of the nodes in the graph.
 * @param value either 'fixed' or 'dynamic'
 * */
function updateNodeSize(value) {
    // if the node size changes to fixed => take the configured radius for the circles
    if (value === "fixed") {
        nodes.selectAll("circle")
            .attr("r", node_radius)
            .attr("fill", function (d) {
                return color(d.group);
            });
    } else { // otherwise compute it by the number of incident edges
        nodes.selectAll("circle")
            .attr("r", function (d) {
                return Math.sqrt(loaded_data.links.filter(function (l) {
                    return l.source.id === d.id || l.target.id === d.id;
                }).length);
            })
            .attr("fill", function (d) {
                return color(d.group);
            });
    }
}

/**
 * Function that updates which bars
 * are considered for additional attraction.
 * @param value Value of the slider
 * */
function update_attraction(value) {
    disablePaths();
    brushLinks(active_clicked);

    // we update all links
    simulation.force("link").strength(function (link) {
        for (let i = 0; i < bars.length; i++) {
            // if the bar is longer than the slider value it should not be considered
            if (bars[i].death > value) {
                continue;
            }

            // if the link(edge) is that of the bar we give it a strong attraction
            if (link === bars[i].edge) {
                return attraction_strength;
            }
        }

        // otherwise a weak force is applied to this link
        return attraction_strength_weak;
    });

    // simulation needs to be restarted for anything to work
    simulation.alpha(1).alphaDecay(0.01).restart();
}

/**
 * Function that updates the repulsion based on the selected bars.
 * */
function update_repulsion() {
    disablePaths();
    brushLinks(active_clicked);

    // maybe it is necessary to set all forces again. this could definitely
    // be optimised so that two nested for loops are not necessary, but it works for now
    for (let i = 0; i < loaded_data.nodes.length - 1; i++) {
        for (let j = i + 1; j < loaded_data.nodes.length; j++) {
            simulation.force(loaded_data.nodes[i].id.concat(loaded_data.nodes[j].id)).strength(repulsion_strength_weak);
        }
    }

    // go through all possible forces and check if that bar is selected
    // if so add strong repulsion between these two nodes
    for (let i = 0; i < loaded_data.nodes.length - 1; i++) {
        for (let j = i + 1; j < loaded_data.nodes.length; j++) {
            for (let k = 0; k < bars.length; k++) {
                if (!bars[k].selected) {
                    continue;
                }

                if (bars[k].componentA.contains(loaded_data.nodes[i].id) && bars[k].componentB.contains(loaded_data.nodes[j].id)) {
                    simulation.force(loaded_data.nodes[i].id.concat(loaded_data.nodes[j].id)).strength(repulsion_strength);
                }
            }
        }
    }
    simulation.alpha(1).alphaDecay(0.01).restart();
}

/**
 * Removes the bundled edges.
 */
function disablePaths() {
    d3.selectAll("path").remove();
    paths_loaded = false;
    btn_bundle_edges.addClass("disabled");
}