let simulation;

let links;
let nodes;

let attraction_strength = 0.8;
let attraction_strength_weak = 0.1;

let repulsion_strength = -300;
let repulsion_strength_weak = -30;

let link_opacity = 0.4;

let active_clicked = null;

function resize_graph()
{
    let svg_graph = d3.select("#graph");
    let width = window.innerWidth;
    let height = window.innerHeight;

    svg_graph.attr("width", width);
    svg_graph.attr("height", height);
}

function configure_graph(settings) {
    attraction_strength = settings.attraction_strength;
    attraction_strength_weak = settings.attraction_strength_weak;
    repulsion_strength = settings.repulsion_strength;
    repulsion_strength_weak = settings.repulsion_strength_weak;
    link_opacity = settings.link_opacity;
}

function create_graph(data) {

    simulation = d3.forceSimulation();
    let width = window.innerWidth;
    let height = window.innerHeight;

    let svg_graph = d3.select("#graph");

    svg_graph.attr("width", width);
    svg_graph.attr("height", height);

    let g = svg_graph.append("g")
        .attr("class", "everything");

    //add zoom capabilities
    let zoom_handler = d3.zoom()
        .on("zoom", function() {g.attr("transform", d3.event.transform);}).wheelDelta(function() {return (d3.event.deltaMode !== 1) ? -d3.event.deltaY * 0.0004 : -d3.event.deltaY * 0.02;});

    zoom_handler(svg_graph);

    links = g.append("g")
        .attr("class", "links")
        .selectAll("links")
        .data(data.links)
        .enter().append("line")
        .attr("stroke-width", 1)
        .attr("stroke", "#222222")
        .style("opacity", link_opacity);

    nodes = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .enter().append("g");

    nodes.append("circle")
        .attr("r", 5)
        .attr("fill", function (d) {
            return color(d.group);
        })
        .on("click", function(d) {

            if(active_clicked === d.id)
            {
                d3.selectAll("text")
                    .remove();
                d3.selectAll("circle")
                    .style("opacity", 1.0);

                d3.selectAll("line")
                    .style("opacity", link_opacity);
                return;
            }
            else
            {
                d3.selectAll("text")
                    .remove();
                d3.selectAll("circle")
                    .style("opacity", 1.0);

                d3.selectAll("line")
                    .style("opacity", link_opacity);
            }

            d3.selectAll("circle")
                .style("opacity", 0.7);

            d3.select(this).select("circle")
                .style("opacity", 1.0);

            let adj_nodes = [];
            adj_nodes.push(d.id);

            active_clicked = d.id;

            links
                .style("opacity", function (l) {
                    if (l.target.id === d.id || l.source.id === d.id) {
                        adj_nodes.push(l.target.id);
                        adj_nodes.push(l.source.id);
                        return 0.5;
                    }
                    return link_opacity * 0.1;
                });

            d3.selectAll("circle")
                .style("opacity", function (n) {
                    if (adj_nodes.find(function (element) {
                        return element === n.id;
                    })) {
                        return 1.0;
                    }
                    return 0.4;
                });

            nodes.filter(
                function(t) {
                    return adj_nodes.find(function (element)
                    {
                        return t.id === element;
                    });
                 })
                .append("text")
                .text(function (d) {
                    return d.id;
                })
                .attr("x", 6)
                .attr("y", 3)
                .style("font-size", "8px")
                .style("font-weight", "bold")
                .style("opacity", function(t) {
                    if(adj_nodes.find(function(element)
                    {
                        return element === t.id;
                    }))
                    {
                        return 1.0;
                    }
                    else
                    {
                        return 0.0;
                    }
                });
        });

    simulation
        .force("link", d3.forceLink().id(function (d) {
            return d.id;
        }))
        .force("center", d3.forceCenter(width / 2, height / 2));

    function isolate(force, nodeA, nodeB) {
        let initialize = force.initialize;
        force.initialize = function() { initialize.call(force, [nodeA, nodeB]); };
        return force;
    }

    for(let i = 0; i < data.nodes.length - 1; i++)
    {
        for(let j = i + 1; j < data.nodes.length; j++)
        {
            simulation.force(data.nodes[i].id.concat(data.nodes[j].id), isolate(d3.forceManyBody().strength(-30), data.nodes[i], data.nodes[j]));
        }
    }

    simulation.force("link").strength(attraction_strength_weak).distance(function(d) {
            return d.value;
        });

    simulation
        .nodes(data.nodes)
        .on("tick", animation);

    simulation.force("link")
        .links(data.links);
}

function animation() {
    links
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    nodes
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
}

function noAnimation() {
    for(let i = 0; i < 500; i++)
    {
        simulation.tick();
    }

    links
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    nodes
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    simulation.stop();
}

