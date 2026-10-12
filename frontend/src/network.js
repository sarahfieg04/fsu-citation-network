import * as d3 from "d3";

// A holder so drag() can reach the simulation
const simulationRef = { current: null };

export function drawNetwork(svgEl, data) {
  const width = svgEl.clientWidth;
  const height = svgEl.clientHeight;

  // Cast ids to strings to  match them
  const nodes = data.nodes.map((d) => ({ ...d, id: String(d.id) }));
  const links = data.links.map((d) => ({
    ...d, source: String(d.source), target: String(d.target),
  }));

  // Store links and nodes 
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();
  const g = svg.append("g");             

  const link = g.append("g")
    .attr("stroke", "#999").attr("stroke-opacity", 0.6)
    .selectAll("line").data(links).join("line")
    .attr("stroke-width", (d) => Math.sqrt(d.value));

  const node = g.append("g")
    .selectAll("circle").data(nodes).join("circle")
    .attr("r", 4)
    .attr("fill", "#782F40")               
    .call(drag(simulationRef));

  // Tooltip creation 
  d3.selectAll(".tooltip").remove();      
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")      
    .style("background", "white")
    .style("border", "1px solid #782F40")
    .style("border-radius", "4px")
    .style("padding", "6px 8px")
    .style("font", "12px sans-serif")
    .style("max-width", "320px")
    .style("white-space", "pre-line");     

  // Cut-off longer titles 
  const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

  node
    .on("mouseover", (e, d) => {
      const authorList = d.authors || [];
      const authors = authorList.slice(0, 3).join(", ") +
        (authorList.length > 3 ? `, +${authorList.length - 3} more` : "");
      tooltip.style("display", "block").text(
        `${truncate(d.title || "Untitled", 90)}\n${d.year} · ${d.venue || "Unknown venue"}\n${authors}`
      );
    })
    .on("mousemove", (e) => {
      tooltip.style("left", e.pageX + 12 + "px").style("top", e.pageY + 12 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(30))
    .force("charge", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05));
  simulationRef.current = simulation;

  simulation.on("tick", () => {
    link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  // Create zoom and pan feature attached to the svg 
  const zoom = d3.zoom().scaleExtent([0.05, 20])
    .on("zoom", (e) => g.attr("transform", e.transform));
  svg.call(zoom);

  // Create zoom-to-fit once the simulation settles
  let fitted = false;
  simulation.on("end", () => {
    if (fitted) return;
    fitted = true;
    const xs = nodes.map((d) => d.x), ys = nodes.map((d) => d.y);
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    const k = 0.9 * Math.min(width / (x1 - x0), height / (y1 - y0));
    const tx = width / 2 - (k * (x0 + x1)) / 2;
    const ty = height / 2 - (k * (y0 + y1)) / 2;
    svg.transition().duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  });
}

// Fixes drag on each point 
function drag(ref) {
  return d3.drag()
    .on("start", (e, d) => {
      if (!e.active) ref.current.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
    .on("end", (e, d) => {
      if (!e.active) ref.current.alphaTarget(0);
      d.fx = null; d.fy = null;
    });
}