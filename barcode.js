class Component {
    constructor(node, id)
    {
        this.id = id;
        this.nodes = [];
        this.nodes.push(node);
    }

    contains(id)
    {
        return this.nodes.find(function(node)
        {
            return node.id === id;
        });
    }
}

class Bar {
    constructor(id)
    {
        this.death = Number.POSITIVE_INFINITY;  // 1/w
        this.id = id;                           // bar ID
        this.edge = null;                       // cause of death
        this.ratio = 0.2;                       // ratio
        this.selected = false;                  // selected
        this.componentA = [];                   // if the bar is selected these two components
        this.componentB = [];                   // will repulse each other
    }
}

// set the dimensions and margins of the graph
const margin = {top: 20, right: 20, bottom: 30, left: 40},
    bar_width = 260 - margin.left - margin.right,
    bar_height = 900 - margin.top - margin.bottom;

// set the ranges for the barcode
const y = d3.scaleBand()
    .range([bar_height, 0])
    .padding(0.1);

const x = d3.scaleLinear()
    .range([0, bar_width]);

function create_barcode(bars)
{
    let svg = d3.select("#barcode");
    svg.append("g").attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    bars.forEach(function(d) {
        d.death = +d.death;
    });
    bars.sort(function(a, b) {
        if(a.death !== b.death) {
            return b.death - a.death;
        }
        else {
            return b.ratio - a.ratio;
        }
    });

    // Scale the range of the data in the domains
    x.domain([0, d3.max(bars, function(d){ return d.death; }) + 1])
    y.domain(bars.map(function(d) { return d.id; }));

    // set the slider accordingly
    document.getElementById("slider").max = d3.max(bars, function(d){ return d.death;}) + 1;
    document.getElementById("slider").value = 0;
    document.getElementById("slider").step = document.getElementById("slider").max / x(document.getElementById("slider").max);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(bars)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("width", function(d) {return x(d.death * d.ratio);} )
        .attr("y", function(d) { return y(d.id); })
        .attr("fill", "#820087")
        .attr("height", y.bandwidth())

    // adding the second (stacked) bar
    svg.selectAll(".bar")
        .data(bars)
        .exit().data(bars)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {return x(d.death * d.ratio);} )
        .attr("width", function(d) {return x(d.death * (1-d.ratio));} )
        .attr("y", function(d) { return y(d.id); })
        .attr("fill", "#fa9b9b")
        .attr("height", y.bandwidth())

    // this bar is just used for the selection and to attach a border
    svg.selectAll(".bar")
        .data(bars)
        .exit().data(bars)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {return 0;} )
        .attr("width", function(d) {return x(d.death);} )
        .attr("y", function(d) { return y(d.id); })
        .attr("height", y.bandwidth())
        .attr("fill", "#00000000")
        .attr("opacity", 1)
        .on("click", function select_deselect(d) {
            if(d.selected)
            {
                d3.select(this).attr("stroke", null).attr("stroke-width", null);
            }
            else
            {
                d3.select(this).attr("stroke", "blue").attr("stroke-width", 2.0);
            }
            d.selected = !d.selected;
            update_repulsion(d);
        })
        .on("mouseover", function(d)
        {
            nodes
                .selectAll("circle")
                .attr("fill", function (n) {
                    if(!d.componentA.find(function(element)
                    {
                        return element.id === n.id;
                    }))
                    {
                        return "#FF0000";
                    }
                    else
                    {
                        return "#0000FF";
                    }
                });
        })
        .on("mouseout", function()
        {
            nodes
                .selectAll("circle")
                .attr("fill", function (d) {
                    return color(d.group);
                });
        });

    // adding the line associated with the slider => shows repulsion threshold
    svg.selectAll(".bar")
        .data(bars)
        .exit().data(bars)
        .enter().append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 850)
        .attr("stroke", "#4281fc")
        .attr("stroke-width", 2.0);
}

/**
 * Computes the 0D Barcode and all necessary parameters
 * for the bars.
 * Furthermore computes the Minimum Spanning Tree
 * using disjointed sets (algorithm).
 * @param nodes nodes of the graph
 * @param links edges of the graph
 * @returns Bars
 */
function get_ph_features(nodes, links) {
    let mst = [];  // contains the MST
    let bars = []; // contains bars with their live and death
    let components = []; // contains all "living" components

    // for all nodes
    for(let i = 0; i < nodes.length; i++)
    {
        bars[i] = new Bar(i); // initialise bar with death of 1
        components[i] = new Component(nodes[i], i);         // initialise component with the node
    }

    // sort the links
    links.sort(function(a, b)
    {// persistence = 1/w -> increasing = a - b
        return 1/a.value - 1/b.value;
    });

    // loop through all edges
    for(let i = 0; i < links.length; i++)
    {
        // find the component of the source node u that is not in a "dead" component
        let c_u = components.find(function(component)
        {
            return component.contains(links[i].source);
        });

        // find the component of the target node v
        let c_v = components.find(function(component)
        {
            return component.contains(links[i].target);
        });

        if(c_v.id !== c_u.id) // if C_u and C_v not in
        {
            bars[c_u.id].death = links[i].value; // update death time (w instead of 1/w see paper)
            bars[c_u.id].edge = links[i];
            for(let j = 0; j < c_u.nodes.length; j++) // merge C_u and C_v into C_v
            {
                c_v.nodes.push(c_u.nodes[j]);
            }
            // remove c_u from the list so we don't think it exists separately
            components = components.filter(function(current_val) { return current_val.id !== c_u.id; });
            mst.push(links[i]); // add edge to MST
        }
    }
    // remove last component
    bars = bars.filter(function(element) { return element.death !== Number.POSITIVE_INFINITY });

    // for each bar now the ratio needs to be computed (see paper) i.e. for the edge e(u,v) that caused
    // the death of the bar
    // count nodes on left sie u = n
    // count nodes on right side v = m
    // ratio = n:m or ratio = n / (n + m) => count n then divide by all nodes
    for(let i = 0; i < bars.length; i++)
    {
        // for all nodes
        for(let i = 0; i < nodes.length; i++)
        {
            components[i] = new Component(nodes[i], i);  // initialise component with the node
        }

        // remove the edge that caused the death of this bar
        let mst_removed = mst.filter(function(element){ return element !== bars[i].edge; });

        // loop through the remaining edges
        for(let i = 0; i < mst_removed.length; i++)
        {
            // find the component of the source node u that is not in a "dead" component
            let c_u = components.find(function(component)
            {
                return component.contains(mst_removed[i].source);
            });

            // find the component of the target node v
            let c_v = components.find(function(component)
            {
                return component.contains(mst_removed[i].target);
            });

            if(c_v.id !== c_u.id) // if C_u and C_v not in
            {
                for(let j = 0; j < c_u.nodes.length; j++) // merge C_u and C_v into C_v
                {
                    c_v.nodes.push(c_u.nodes[j]);
                }
                components = components.filter(function(current_val) { return current_val.id !== c_u.id; });
            }
        }

        // now we should have 2 components and we can take
        // an arbitrary one
        let n = (components[0].nodes.length >= components[1].nodes.length) ? components[1].nodes.length : components[0].nodes.length;
        // ratio is component size divided by all nodes
        bars[i].ratio = n / nodes.length;
        // we also keep the components in mind
        bars[i].componentA = components[0].nodes;
        bars[i].componentB = components[1].nodes;
    }

    return bars;
}
