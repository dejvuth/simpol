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
var initial;
var rules;

var stateNames;  // in ascending order

//console.log = function() {}

// Parses raw rules to JSON object
// Rule: s1, s2 -> t1, t2
var inrules;  // map s1 -> (s2 -> { id, r: [t1, t2] })
var robjs;    // [ states: [[id,s1], [id,s2], [id,t1], [id,t2]] ]
function parseRules(rr) {
  stateNames = [];
  for (var s in states) {
    if (!s.match(/^\w+$/)) {
      throw "State name " + s + " is not alphanumeric";
    }

    stateNames.push(s);

    // Use the output property to update the state's color
    if (states[s].hasOwnProperty("output")) {
      if (!outputs.hasOwnProperty(states[s].output))
        throw "Output " + states[s].output + " not found";
      states[s].color = outputs[states[s].output].color;
    }
  }
  stateNames.sort();

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
    if (inrules[lr[0]] == null)
      inrules[lr[0]] = {};
    inrules[lr[0]][lr[1]] = {
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
var selColor = "#4E443C";
var selRedColor = "#EB4B2B";
var selMode;
if (localStorage.hasOwnProperty("selMode")) {
  selMode = localStorage.getItem("selMode");
}
const SEL_MODES = [ "", "Sequential", "Sequential Timed", "Parallel" ];

var svg;
var rsvg;

var inits;
var objs;  // array of state names and x,y positions
var rems;  // maps state names to remaining state indices

// Draws init
function drawInit() {
  var f = d3.select("#initDiv");
  var count = 0;
  var d;
  for (var s in states) {
    // New row every two columns
    if (count % 2 == 0)
      d = f.append("div").classed("form-group", true);

    // Draws state
    var l = d.append("label")
      .attr("for", s)
      .classed({"col-xs-2": true, "control-label": true})
      .style("padding-top", "0px")
      .style("text-align", "right");
    var isvg = l.append("svg")
      .attr("width", 2*(ruler + padding))
      .attr("height", 2*(ruler + padding));
    var c = isvg.append("circle")
      .attr("cx", ruler + padding)
      .attr("cy", ruler + padding)
      .attr("r", ruler)
      .attr("fill", function(d) {
        return colors[states[s].color];
      })
      .attr("fill-opacity", opacity);
    if (initial && initial.indexOf(s) >= 0) {
      c.attr("stroke", selColor)
        .attr("stroke-width", "2")
        .attr("stroke-opacity", "0.9");
    }
    isvg.append("text")
      .text(states[s].label)
      .attr("x", ruler + padding)
      .attr("y", ruler + padding)
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

  // Prepares rems
  rems = {};
  for (var s in states) {
    rems[s] = [];
  }

  // Prepares DOM objects
  objs = [];
  var count = 0;
  var offset = 0;
  var dy = h/row;
  for (var i = 0; i < inits.s.length; i++) {
    var maxPerRow = Math.max(Math.floor(inits.s[i].col/(2*(r+padding))), 1);
    for (var j = 0; j < inits.s[i].num; j++) {
      var len = objs.push({
        "id": count,
        "name": inits.s[i].name,
        "cx": offset + (j%maxPerRow)*2*(r+padding) + (r+padding),
        "cy": Math.floor(j/maxPerRow)*dy + dy/2
      });
      rems[inits.s[i].name].push(len-1);
      count++;
    }
    offset += maxPerRow*2*(r+padding);
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

// Changes the selection mode
function changeMode(m) {
  selMode = m;
  d3.select("#selMode")
    .text(SEL_MODES[m] + " ")
    .append("span")
    .classed({ "caret": true });
  localStorage.setItem("selMode", selMode);
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

  // Adds mode selection dropdown
  var ts = e.append("div")
    .classed({ "col-xs-3": true })
    .append("div")
    .classed({ "dropdown": true });
  var bt = ts.append("button")
    .attr("id", "selMode")
    .classed({ "btn": true, "btn-default": true, "dropdown-toggle": true })
    .attr("type", "button")
    .attr("data-toggle", "dropdown");
  if (selMode)
    bt.text(SEL_MODES[selMode] + " ");
  else
    bt.text("Mode ");
  bt.append("span")
    .classed({ "caret": true });
  var ul = ts.append("ul")
    .classed({ "dropdown-menu": true });
  for (var i = 1; i < SEL_MODES.length; i++) {
    ul.append("li")
      .append("a")
      .attr("href", "#")
      .attr("onclick", "changeMode(" + i + ")")
      .text(SEL_MODES[i]);
  }

  // Adds delay control
  var e = d.append("div").classed({ "form-group": true })
    .append("div").classed({ "col-xs-11": true });
  e.append("div").classed({"col-xs-1": true}).style("padding-left", "0px")
    .append("label")
    .attr("for", "delay")
    .classed({"control-label": true})
    .text("Delay");
  e.append("div").classed({"col-xs-10": true})
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
      if (rems[ls[0]].length >= 2)
        return true;
    } else {
      if (rems[ls[0]].length >= 1 && rems[ls[1]].length >= 1) {
        return true;
      }
    }
  }
  return false;
}

// Selects sequentially
// { "id": rid,
//   "sel": [ {"name", "remIndex"}, {"name", "remIndex"} ],
//   "next": [ x,y ] }
function seqSelect() {
  // Calculates rule probs
  var psum = 0;
  var rprob = [];
  for (var i = 0; i < robjs.length; i++) {
    var s1 = robjs[i].states[0][1];
    var s2 = robjs[i].states[1][1];
    var p;
    if (s1 == s2) {
      p = rems[s1].length*(rems[s1].length-1)/2;
    } else {
      p = rems[s1].length*rems[s2].length;
    }
    psum += p;
    rprob.push(psum);
  }

  // Randomly picks a rule
  var r = random(psum);
  var rid = -1;
  for (var i = 0; i < rprob.length; i++) {
    if (r < rprob[i]) {
      rid = i;
      break;
    }
  }

  // Randomly picks two states
  var s1 = robjs[rid].states[0][1];
  var s2 = robjs[rid].states[1][1];
  var rs1 = random(rems[s1].length);
  var rs2 = random(rems[s2].length);
  while (s1 == s2 && rs1 == rs2) {
    rs1 = random(rems[s1].length);
    rs2 = random(rems[s2].length);
  }

  return { "id": rid,
    "sel": [ { "name": s1, "remIndex": rs1 }, { "name": s2, "remIndex": rs2 } ],
    "next": [ robjs[rid].states[2][1], robjs[rid].states[3][1] ]};
}

// Finds out the indices of the states in rems from objs indices a,b
// [ {name, remIndex}, {name, remIndex} ]
function findSel(a, b) {
  sel = [{}, {}];
  var rsum = 0;
  for (var i = 0; i < stateNames.length; i++) {
    var l = rems[stateNames[i]].length;
    if (rsum <= a && a < rsum + l) {
      sel[0]["name"] = stateNames[i];
      sel[0]["remIndex"] = a - rsum;
    }
    if (rsum <= b && b < rsum + l) {
      sel[1]["name"] = stateNames[i];
      sel[1]["remIndex"] = b - rsum;
    }
    rsum += l;
  }
  return sel
}

// Paints the selections
function paint(mode, sels, rids, nexts) {
  var cs = [];
  var nextMap = {};
  var delRemInd = {};
  for (var s in states) {
    delRemInd[s] = [];
  }
  var ridSet = d3.set();
  for (var i = 0; i < sels.length; i++) {
    // source states [0..n-1, 0..n-1]
    var src = [
      rems[sels[i][0].name][sels[i][0].remIndex],
      rems[sels[i][1].name][sels[i][1].remIndex] ];

    cs.push("#c" + src[0]);
    cs.push("#c" + src[1]);

    //console.log(sels[i][0].name + " " + sels[i][0].remIndex
               //+ ", " + sels[i][1].name + " " + sels[i][1].remIndex
               //+ ", " + rids[i]);

    if (rids[i] != -1) {
      objs[src[0]].name = nexts[i][0];
      objs[src[1]].name = nexts[i][1];
      rems[nexts[i][0]].push(src[0]);
      rems[nexts[i][1]].push(src[1]);

      delRemInd[sels[i][0].name].push(sels[i][0].remIndex);
      delRemInd[sels[i][1].name].push(sels[i][1].remIndex);

      ridSet.add(".rule" + rids[i]);

      nextMap[src[0]] = nexts[i][0];
      nextMap[src[1]] = nexts[i][1];
    }
  }
  //console.log(cs);
  //console.log(nextMap);

  // Deletes from right to left in rems using indices.
  for (var s in delRemInd) {
    delRemInd[s].sort(function(a,b) {
      return a - b;
    });
    //console.log(delRemInd[s]);

    for (var i = delRemInd[s].length - 1; i >= 0; i--) {
      rems[s].splice(delRemInd[s][i], 1);
    }
  }

  // Highlights rule
  if (!ridSet.empty()) {
    rsvg.selectAll(ridSet.values())
      .attr("stroke", selColor)
      .attr("stroke-width", "3")
      .attr("stroke-opacity", "0.9")
      .transition()
      .duration(2*delay)
      .each("end", function() {
        //rsvg.selectAll(".rule" + rid)
        d3.select(this)
          .attr("stroke", "none");
      });
  }

  // Highlights states
  var sl = svg.selectAll(cs);
  if (highlightState) {
    sl.attr("stroke-width", "0")
      .attr("stroke", function(d, i) {
        if (nextMap.hasOwnProperty(d.id))
          return selColor;
        if (selMode == 1 || selMode == 2)
          return selRedColor;
        return null;
        //return (nextMap.hasOwnProperty(d.id)) ? selColor : selRedColor;
      });
  }

  // Removes state highlights, and if applicable,
  // changes state colors and labels
  sl.transition()
    .duration(delay)
    .attr("stroke-width", "3")
    .attr("stroke-opacity", "0.9")
    .each("end", function(d, i) {  // End of selection highlights
      //console.log(i + ", id: " + d.id + ", next: " + nextMap[d.id]);
      // If found a rule
      if (nextMap.hasOwnProperty(d.id)) {
        // Fills new color
        svg.select("#c" + d.id)
          .transition()
          .duration(delay)
          .attr("fill", colors[states[nextMap[d.id]].color])
          .attr("stroke-width", "0")
          .each("end", function() {
            // Runs again
            if (mode == "run" && i == cs.length-1)
              sim("run");
          });

        // Changes label
        svg.select("#t" + d.id)
          .transition()
          .duration(delay)
          .text(function() {
            return states[nextMap[d.id]].label;
          });
      } else {
        // No rules: only removes the highlights
        svg.select("#c" + d.id)
          .transition()
          .duration(delay)
          .attr("stroke-width", "0")
          .each("end", function() {
            // Runs again
            if (mode == "run" && i == cs.length-1)
              sim("run");
          });
      }
    });
}

function simAllPairs(mode) {
  // Permutes indices [0, ..., objs.length-1] with Fisher-Yates shuffle
  var perms = [];
  for (var i = 0; i < objs.length; i++)
    perms.push(i);
  for (var i = perms.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = perms[i];
    perms[i] = perms[j];
    perms[j] = temp;
  }

  // Finds indices in rems
  var sels = [];
  for (var i = 0; i < perms.length-1; i += 2) {
    // Saves the pair
    sels.push(findSel(perms[i], perms[i+1]));
  }

  // Find applicable rules
  var rss = [];
  var rids = [];
  var nexts = [];
  for (var i = 0; i < sels.length; i++) {
    // Finds rules
    var rs = null;
    if (inrules.hasOwnProperty(sels[i][0].name)) {
      if (inrules[sels[i][0].name].hasOwnProperty(sels[i][1].name))
        rs = inrules[sels[i][0].name][sels[i][1].name];
    }
    if (rs == null && inrules.hasOwnProperty(sels[i][1].name)) {
      if (inrules[sels[i][1].name].hasOwnProperty(sels[i][0].name)) {
        // Swaps the selected pair to correct ordering
        var tmp = sels[i][0];
        sels[i][0] = sels[i][1];
        sels[i][1] = tmp;
        rs = inrules[sels[i][0].name][sels[i][1].name];
      }
    }
    rss.push(rs);

    // Saves the rule
    if (rs != null) {
      rids.push(rs.id);
      nexts.push(rs.r);
    } else {
      rids.push(-1);
      nexts.push(null);
    }
  }

  paint(mode, sels, rids, nexts);
}

// Simulator function
var run = false;
var stepCount = 0;
sim = function(mode) {
  // Checks the simulation mode
  if (mode == "run" && !run)
    return;

  var pick = 0;
  var rid = -1;  // rule id
  var next = null;    // next states [name, name]

  // Checks for applicable rules
  if (!hasRule()) {
    toastr.info("No applicable rules");
    stop();
    return;
  }

  var sel;  // [ {name, remIndex}, {name, remIndex} ]

  // Checks if the mode is selected
  if (!selMode) {
    toastr.error("No mode selected");
    stop();
    return;
  }

  if (selMode == 2) {  // Any pair
    // Randomly picks a pair of states
    var rands = [-1, -1]
    do {
      rands[0] = random(inits.sum);
      rands[1] = random(inits.sum);
    } while (rands[0] == rands[1]);  // until the states are not identical

    // Finds out the indices of the states in rems
    sel = findSel(rands[0], rands[1]);

    // Finds rule from the pair
    var rs = null;
    if (inrules.hasOwnProperty(sel[0].name)) {
      if (inrules[sel[0].name].hasOwnProperty(sel[1].name))
        rs = inrules[sel[0].name][sel[1].name];
    }
    if (rs == null && inrules.hasOwnProperty(sel[1].name)) {
      if (inrules[sel[1].name].hasOwnProperty(sel[0].name)) {
        // Swaps the selected pair to correct ordering
        var tmp = sel[0];
        sel[0] = sel[1];
        sel[1] = tmp;
        rs = inrules[sel[0].name][sel[1].name];
      }
    }

    if (rs != null) {
      rid = rs.id;
      next = rs.r;
    }
  } else if (selMode == 1) {  // Any pair with rule
    var rs =seqSelect();
    sel = rs.sel;

    rid = rs.id;
    next = rs.next;
  } else {  // All pairs
    simAllPairs(mode);
    return;
  }

  paint(mode, [sel], [rid], [next]);
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

// Parses config and draw
function parseConfigAndDraw(conf) {
  try {
    // Evals the result
    eval(conf);
    d3.select("#title").html((title) ? title : "&nbsp;");
    parseRules(rules);
    draw();
  } catch (err) {
    toast(err);
  }
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
      parseConfigAndDraw(reader.result);
    }
    reader.readAsText(file);
  }
  catch (err) {
    toast(err);
  }
}

// Displays file name and load it
function displayFileName(fileName) {
  d3.select("#selFile").text("File: " + fileName);
  d3.select("#ruleH").text("Rules");
}

// Adds load event
d3.select("#load")
  .on("change", function() {
    // Displays file name
    var fileName = d3.select(this).property("value").replace(/^C:\\fakepath\\/, "");
    displayFileName(fileName);
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

// Loads the default config file
window.onload = function() {
  // Default file name
  var fileName = "Default";
  displayFileName(fileName);

  // No config text to parse, because it was already loaded
  parseConfigAndDraw();
}
