var colors = {
  "magenta": "#F49AC2",
  "violet": "#CB99C9",
  "darkred": "#C23B22",
  "pink2": "#FFD1DC",
  "pink": "#DEA5A4",
  "blue": "#AEC6CF",
  "green": "#77DD77",
  "gray": "#CFCFC4",
  "purple": "#B39EB5",
  "orange": "#FFB347",
  "lightpurple": "#B19CD9",
  "red": "#FF6961",
  "darkgreen": "#03C03C",
  "yellow": "#FDFD96",
  "brown": "#836953",
  "darkblue": "#779ECB",
  "darkpurple": "#966FD6",
};

var title;
var outputs;
var states;
var rules;

// Parses raw rules to JSON object
// Rule: s1, s2 -> t1, t2
var inrules;  // map s1 -> (s2 -> { id, r: [t1, t2] }), where s1 <= s2
var robjs;    // [ states: [[id,s1], [id,s2], [id,t1], [id,t2]] ]
function parseRules(rr) {
  for (var s in states) {
    if (!s.match(/^\w+$/)) {
      throw "State name " + s + " is not alphanumeric";
    }

    if (states[s].hasOwnProperty("output")) {
      if (!outputs.hasOwnProperty(states[s].output))
        throw "Output " + states[s].output + " not found";

      states[s].color = outputs[states[s].output].color;
    }
  }

  inrules = {};
  robjs = [];
  for (var i = 0; i < rr.length; i++) {
    var lr = rr[i].match(/\w+/g);

    // Counts states in rule
    if (lr.length != 4) {
        throw "Rule error: " + rr[i];
    }

    // Checks whether states exist
    for (var j = 0; j < lr.length; j++) {
      if (!states[lr[j]]) {
        throw "Unknwon state " + lr[j] + " in rule: " + rr[i];
      }
    }

    // FIXME Global inrules
    var s1 = lr[0];
    var s2 = lr[1];
    if (s2 < s1) {
      var tmp = s1;
      s1 = s2;
      s2 = tmp;
    }
    if (inrules[s1] == null)
      inrules[s1] = {};
    inrules[s1][s2] = {
      "id": i,
      "r": [lr[2], lr[3]]
    };

    // FIXME Global robjs
    robjs.push({
      "states": [[i, lr[0]], [i, lr[1]], [i, lr[2]], [i, lr[3]]]
    });
  }
}

// GLOBAL CONFIGS
var w = 500;
var h = 300;
var padding = 1;
var rpadding = 5;
var rw = 200;
var highlightState = true;
var delay = 500;
if (localStorage.hasOwnProperty("delay"))
  delay = localStorage.getItem("delay");
var ruler = 15;  // rule radius
var maxPick = 1000;
var opacity = 0.5;
var defaultFontSize = 16;
var showLabel = true;
if (localStorage.hasOwnProperty("showLabel")) {
  showLabel = localStorage.getItem("showLabel") === "true";
}
var simTime = true;
if (localStorage.hasOwnProperty("simTime")) {
  simTime = localStorage.getItem("simTime") === "true";
}


var svg;
var rsvg;

var inits;
var objs;  // array of state names and x,y positions
var rems;  // maps state names to remaining numbers of states

// Draws init
function drawInit() {
  var f = d3.select("#initDiv");
  var count = 0;
  var d;
  for (var s in states) {
    // Draws state
    if (count % 2 == 0)
      d = f.append("div").classed("form-group", true);
    var l = d.append("label")
      .attr("for", s)
      .classed({"col-xs-2": true, "control-label": true})
      .style("padding-top", "0px")
      .style("text-align", "right");
    var isvg = l.append("svg").attr("width", 2*(ruler)).attr("height", 2*(ruler));
    isvg.append("circle")
      .attr("cx", ruler)
      .attr("cy", ruler)
      .attr("r", ruler)
      .attr("fill", function(d) {
        return colors[states[s].color];
      })
      .attr("opacity", opacity);;
    isvg.append("text")
      .text(states[s].label)
      .attr("x", ruler)
      .attr("y", ruler)
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("font-family", "sans-serif")
      .attr("font-size", defaultFontSize)
      .attr("font-weight", "bold");

    // Appends input for number of states
    d.append("div").classed("col-xs-4", true)
      .append("input").attr("id", s).attr("type", "number").attr("placeholder", s)
      .classed("form-control", true)
      .attr("value", states[s].init);

    count++;
  }

  f.append("hr");
}

// Draws rules
function drawRule() {
  var rh = 2*(ruler+rpadding)*robjs.length;
  rsvg = d3.select("#ruleDiv")
  	.append("svg")
  	.attr("width", rw)
  	.attr("height", rh);

    // Draws rule circles
  rsvg.selectAll("rules")
    .data(robjs)
    .enter()
    .append("g")
    .selectAll("rulecircle")
    .data(function(d) {
      return d.states;
    })
    .enter()
    .append("circle")
    .attr("class", function(d) {
      return "rule rule" + d[0];
    })
    .attr("id", function(d, i) {
      return "r" + d[0] + i;
    })
    .attr("cx", function(d,i) {
      if (i <= 1) i--;
      return rw/2 + (i-1)*2*(ruler+rpadding);
    })
    .attr("cy", function(d) {
      return (ruler+rpadding) + 2*(ruler+rpadding)*d[0];
    })
    .attr("r", ruler)
    .attr("fill", function(d) {
      return colors[states[d[1]].color];
    })
    .attr("fill-opacity", opacity);

  // Draws rule states
  rsvg.selectAll("rules")
    .data(robjs)
    .enter()
    .append("g")
    .selectAll("ruletext")
    .data(function(d) {
      return d.states;
    })
    .enter()
    .append("text")
    .text(function(d) {
      return states[d[1]].label;
    })
    .attr("x", function(d, i) {
      if (i <= 1) i--;
      return rw/2 + (i-1)*2*(ruler+rpadding);
    })
    .attr("y", function(d) {
      return (ruler+rpadding) + 2*(ruler+rpadding)*d[0];
    })
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .attr("font-family", "sans-serif")
    .attr("font-size", defaultFontSize)
    .attr("font-weight", "bold");

  // Draws rule arrows
  rsvg.append("marker")
    .attr("id", "triangle")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", "0")
    .attr("refY", "5")
    .attr("markerUnits", "strokeWidth")
    .attr("markerWidth", "4")
    .attr("markerHeight", "3")
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z");
  rsvg.selectAll("rules")
    .data(robjs)
    .enter()
    .append("line")
    .attr("x1", rw/2 - ruler + rpadding)
    .attr("y1", function(d, i) {
      return (ruler+rpadding) + 2*(ruler+rpadding)*i;
    })
    .attr("x2", rw/2 + ruler - rpadding)
    .attr("y2", function(d, i) {
      return (ruler+rpadding) + 2*(ruler+rpadding)*i;
    })
    .attr("stroke", "black")
    .attr("stroke-width", "2")
    .attr("marker-end", "url(#triangle)");
}

// Preprocesses init-states information
function preprocess(states) {
  if (!states)
    throw "Nothing to draw";

  var names = [];
  var nums = [];
  var sum = 0;
  var max = -1;
  for (var s in states) {
    var i = states[s].init;
    if (i == null || i <= 0)
      continue;

    names.push(s);
    nums.push(i);
    sum += i;
    if (max < i)
      max = i;
  }

  if (sum == 0) {
    throw "Warning: No initial states";
  }

  var inits = {
    "sum": sum,
    "max": max,
    "colMax": w*max/sum, // Max column size
    "s" : []
  }
  for (var i = 0; i < names.length; i++) {
    inits["s"].push({
      "name": names[i],
      "num": nums[i],
      "col": w*nums[i]/sum
    });
  }
  return inits;
}

// Draws the content
function drawContent() {
  if (svg != null)
    svg.remove();
  stepCount = 0;

  // Preprocesses
  inits = preprocess(states);

  // Calculates radius
  var row = 1;
  var colPerRow = inits.colMax/h;
  var column = Math.floor(colPerRow * row)
  while (row * column < inits.max) {
    row++;
    column = Math.floor(colPerRow * row)

  }
  var r = (Math.min(h/row, inits.colMax/column) - padding*2)/2;

  // Adjusts "too-small" columns
  var minColSize = 2*(r + padding);
  var colSizeDiff = 0;
  for (var i = 0; i < inits.s.length; i++) {
    if (inits.s[i].col < minColSize) {
      colSizeDiff += (minColSize - inits.s[i].col);
      inits.s[i].col = minColSize;
    }
  }

  // Adjusts "too-long" columns
  var maxRowCount = inits.max/(Math.floor(inits.colMax/(2*(r+padding))));
  for (var i = 0; i < inits.s.length; i++) {
    var maxPerRow = Math.floor(inits.s[i].col/(2*(r+padding)));
    var rowCount = Math.ceil(inits.s[i].num/maxPerRow);
    if (rowCount > maxRowCount + 1) {
      var diff = (maxPerRow+1)*2*(r+padding) - inits.s[i].col;
      inits.s[i].col += diff;
      colSizeDiff += diff;
    }
  }

  // Prepares DOM objects
  objs = [];
  var offset = 0;
  var dy = h/row;
  for (var i = 0; i < inits.s.length; i++) {
    var maxPerRow = Math.max(Math.floor(inits.s[i].col/(2*(r+padding))), 1);
    for (var j = 0; j < inits.s[i].num; j++) {
      objs.push({
        "name": inits.s[i].name,
        "cx": offset + (j%maxPerRow)*2*(r+padding) + (r+padding),
        "cy": Math.floor(j/maxPerRow)*dy + dy/2
      });
    }
    offset += maxPerRow*2*(r+padding);
  }

  // Prepares rems
  rems = {};
  for (var s in states) {
    var i = states[s].init;
    if (i == null || i <= 0)
      rems[s] = 0;
    else
      rems[s] = i;
  }

  // Creates SVG
  var realw = w + colSizeDiff;
  realh = h + 40;
  svg = d3.select("#content")
  	.append("svg")
  	.attr("width", realw)
  	.attr("height", realh);

  // Draws rect
  svg.selectAll("rect")
    .data(objs)
    .enter()
    .append("rect")
    .attr("class", "node")
    .attr("id", function(d, i) {
      return "c" + i;
    })
    .attr("x", function(d, i) {
      return d["cx"] - r;
    })
    .attr("y", function(d, i) {
      return d["cy"] - r;
    })
    .attr("width", 2*r)
    .attr("height", 2*r)
    .attr("fill", function(d) {
      return colors[states[d["name"]].color];
    })
    .attr("fill-opacity", opacity);


  // Draws labels
  var fontScale = d3.scale.threshold()
    .domain([10, 30, 60, 100, 200, 300, 400])
    .range([40, 22, 18, 16, 14, 12, 10, 8]);
  svg.selectAll("text")
    .data(objs)
    .enter()
    .append("text")
    .attr("id", function(d, i) {
      return "t" + i;
    })
    .text(function(d) {
      return states[d["name"]].label;
    })
    .attr("x", function(d) {
      return d["cx"];
    })
    .attr("y", function(d) {
      return d["cy"];
    })
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .attr("font-family", "sans-serif")
    .attr("font-size", fontScale(objs.length))
    .attr("font-weight", "bold")
    .attr("opacity", (showLabel) ? 1 : 0);;
}

// Stops the simulator
function stop() {
  run = false;
  d3.select("#run").text("Run >>");
  d3.select("#step").style({"pointer-events": "all"});
}

// Draws controls
function drawControl() {
  var d = d3.select("#controlDiv");
  var e = d.append("div").classed({"form-group": true, "col-md-11": true});

  // Adds step button
  e.append("div").classed({ "col-xs-3": true })
    .append("button").attr("id", "step")
    .classed({ "btn": true, "btn-primary": true, "btn-block": true })
    .text("Step >")
    .on("click", function() {
      if (run)
        return;
      sim("next");
    });

  // Adds run button
  e.append("div").classed({ "col-xs-3": true })
    .append("button").attr("id", "run")
    .classed({ "btn": true, "btn-primary": true, "btn-block": true })
    .text("Run >>")
    .on("click", function() {
      if (!run) {
        run = true;
        d3.select("#run").text("[Stop]");
        d3.select("#step").style({"pointer-events": "none"});
        sim("run");
      } else {
        stop();
      }
    });

  // Adds label switch
  var ls = e.append("div").classed({ "col-xs-3": true })
    .append("input")
    .attr("id", "labelSwitch")
    .attr("name", "labelSwitch")
    .attr("type", "checkbox")
    .attr("data-label-text", "Label");
  if (showLabel) {
    ls.attr("checked", "");
  }
  $("[name='labelSwitch']").bootstrapSwitch();
  $('input[name="labelSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
    showLabel = state;
    localStorage.setItem("showLabel", showLabel);
    svg.selectAll("text").attr("opacity", (showLabel) ? 1 : 0);
  });

  // Adds time switch
  var ts = e.append("div").classed({ "col-xs-3": true })
    .append("input")
    .attr("id", "timeSwitch")
    .attr("name", "timeSwitch")
    .attr("type", "checkbox")
    .attr("data-label-text", "Time");
  if (simTime) {
    ts.attr("checked", "");
  }
  $("[name='timeSwitch']").bootstrapSwitch();
  $('input[name="timeSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
    simTime = state;
    localStorage.setItem("simTime", simTime);
  });

  // Adds delay control
  var e = d.append("div").classed({ "form-group": true })
    .append("div").classed({ "col-xs-11": true });
  e.append("div").classed({"col-xs-1": true}).style("padding-left", "0px")
    .append("label")
    .attr("for", "delay")
    .classed({"control-label": true})
    .text("Delay");
  e.append("div").classed({"col-xs-11": true})
    .append("input").attr("id", "delay")
    .attr("type", "range")
    .attr("min", 0).attr("max", 2000)
    .attr("value", delay).attr("step", 100)
    .classed({ "form-control-static": true })
    .on("change", function(d) {
      delay = d3.select(this).property("value");
      localStorage.setItem("delay", delay);
    });
}

// Random [0, max)
function random(max) {
  return Math.floor(Math.random() * max);
}

// Returns true iff there exists an applicable rule
function hasRule() {
  for (var i = 0; i < robjs.length; i++) {
    var ls = [ robjs[i].states[0][1], robjs[i].states[1][1] ];
    if (ls[0] == ls[1]) {
      if (rems[ls[0]] >= 2)
        return true;
    } else {
      if (rems[ls[0]] >= 1 && rems[ls[1]] >= 1) {
        return true;
      }
    }
  }
  return false;
}

function randomSelect() {
  // Calculates rule probs
  var psum = 0;
  var rprob = [];
  for (var i = 0; i < robjs.length; i++) {
    var s1 = robjs[i].states[0][1];
    var s2 = robjs[i].states[1][1];
    var p;
    if (s1 == s2) {
      p = rems[s1]*(rems[s1]-1)/2;
    } else {
      p = rems[s1]*rems[s2];
    }
    psum += p;
    rprob.push(psum);
  }
  console.log(rprob);

  // Randomly picks a rule
  var r = random(psum);
  var rid = -1;
  for (var i = 0; i < rprob.length; i++) {
    if (r < rprob[i]) {
      rid = i;
      break;
    }
  }
  console.log(rid);

  // Randomly picks two states
  var s1 = robjs[rid].states[0][1];
  var s2 = robjs[rid].states[1][1];
  var rs1 = random(rems[s1]);
  var rs2 = random(rems[s2]);
  while (s1 == s2 && rs1 == rs2) {
    rs1 = random(rems[s1]);
    rs2 = random(rems[s2]);
  }
  console.log(rs1 + " " + rs2);

  // Finds the object ids of the states
  var s1count = 0;
  var s2count = 0;
  var t1, t2;
  for (var i = 0; i < objs.length; i++) {
    if (objs[i].name == s1) {
      if (t1 == null && s1count == rs1)
        t1 = i;
      else
        s1count++;
    }
    if (objs[i].name == s2) {
      if (t2 == null && s2count == rs2)
        t2 = i;
      else
        s2count++;
    }
    if (t1 != null && t2 != null)
      break;
  }
  console.log(t1 + " " + t2);
  return [t1, t2];
}

// Returns { id, r: [t1, t2] } for rule (s1,s2) -> (t1,t2);
// or null if no such rules with (s1,s2)
function findRule(s1, s2) {
  if (s2 < s1) {
    var tmp = s1;
    s1 = s2;
    s2 = tmp;
  }

  if (inrules.hasOwnProperty(s1)) {
    if (inrules[s1].hasOwnProperty(s2))
      return inrules[s1][s2];
  }

  return null;
}

// Simulator function
var sels = null;
var run = false;
var stepCount = 0;
sim = function(mode) {
  // Checks the mode
  if (mode == "run" && !run)
    return;

  var pick = 0;
  var t = [-1, -1];  // current states
  var rid;  // rule id
  var n;    // next states

  // Checks for applicable rules
  if (!hasRule()) {
    toastr.info("No applicable rules");
    stop();
    return;
  }

  if (simTime) {
    // Randomly picks a pair of states
    do {
      t[0] = random(inits.sum);
      t[1] = random(inits.sum);
    } while (t[0] == t[1]);  // until the states are not identical
  } else {
    t = randomSelect();
  }

  var rs = findRule(objs[t[0]].name, objs[t[1]].name);
  //console.log(t[0] + ": " + objs[t[0]].name + ", " + t[1] + ": " + objs[t[1]].name);
  if (rs != null) {
    rid = rs.id;
    n = rs.r;
    console.log("Rule " + n);

    // Highlight rule
    rsvg.selectAll(".rule" + rid)
      .attr("stroke", function() {
        return colors["brown"];
      })
      .attr("stroke-width", "3")
      .attr("stroke-opacity", "0.9")
      .transition()
      .duration(2*delay)
      .each("end", function() {
        rsvg.selectAll(".rule" + rid)
          .attr("stroke", "none");
      });
  }

  // Hightlights states
  var sl = svg.selectAll([ "#c"+t[0], "#c"+t[1] ])
    .transition()
    .duration(delay);
  if (highlightState) {
    sl.attr("stroke", function() {
      return colors["brown"];
    });
  }
  sl.attr("stroke-width", "3")
    .attr("stroke-opacity", "0.9")
    .each("end", function(d, i) {
      // Selects the state again
      var ti = svg.select("#c" + t[i])
        .transition()
        .duration(delay);

      // If found a rule
      if (rs != null) {
        // Updates objects
        rems[objs[t[0]].name]--;
        rems[objs[t[1]].name]--;
        objs[t[0]].name = n[0];
        objs[t[1]].name = n[1];
        rems[objs[t[0]].name]++
        rems[objs[t[1]].name]++;

        // Changes label
        svg.select("#t" + t[i])
          .transition()
          .duration(delay)
          .text(function() {
            return states[n[i]].label;
          });

        // Fills new color
        ti.attr("fill", function() {
          return colors[states[n[i]].color];
        });
      }

      // Restarts if mode is "run"
      ti.each("end", function() {
        svg.select("#c" + t[i]).attr("stroke", "none");
        if (mode == "run" && i%2 == 0)
          sim("run");
      });
    });
}

// Draws everything
function draw() {
  d3.select("#initDiv").selectAll("*").remove();
  d3.select("#ruleDiv").selectAll("*").remove();
  d3.select("#content").selectAll("*").remove();
  d3.select("#controlDiv").selectAll("*").remove();

  drawInit();
  drawRule();
  drawContent();
  drawControl();
}

// Toasts the error
function toast(err) {
  if (err.message)
    toastr.error("Syntax error: " + err.message);
  else if (err.lastIndexOf("Warning", 0) === 0)
    toastr.warning(err.replace(/^Warning: /, ""));
  else
    toastr.error(err);
}

// Loads and draws
function load() {
  try {
    // Reads file
    var file = d3.select("#load").property("files")[0];
    if (!file) {
      toastr.error("File not found");
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        // Evals the result
        eval(reader.result);
        d3.select("#title").html((title) ? title : "&nbsp;");
        parseRules(rules);
        draw();
      } catch (err) {
        toast(err);
      }
    }
    reader.readAsText(file);
  }
  catch (err) {
    toast(err);
  }
}

// Adds load event
d3.select("#load")
  .on("change", function() {
    // Displays file name
    fileName = d3.select(this).property("value").replace(/^C:\\fakepath\\/, "");
    d3.select("#selFile").text("File: " + fileName);
    d3.select("#ruleH").text("Rules");
    load();
  });

// Adds reload event
d3.select("#reload")
  .on("click", function() {
    load();
  });

// Adds draw event
d3.select("#draw")
  .on("click", function() {
    // Reads numbers of states
    for (s in states) {
      var n = Number(d3.select("#" + s).property("value"));
      states[s].init = n;
    }

    // Draws content SVG
    try {
      drawContent();
    } catch (err) {
      toast(err);
    }
  });

