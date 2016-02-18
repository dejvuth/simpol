const colors = {
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

//const FONT_SIZES = [ 8, 10, 12, 14, 18, 24, 30, 36, 48, 60, 76, 84 ];

var states;
var rules;

// Parse raw rules to JSON object
var inrules;
var robjs;
function parseRules(rr) {
  for (var s in states) {
    if (!s.match(/^\w+$/)) {
      throw "State name " + s + " is not alphanumeric";
    }
  }

  r = {};
  robjs = [];
  for (var i = 0; i < rr.length; i++) {
    var lr = rr[i].match(/\w+/g);

    // Count states in rule
    if (lr.length != 4) {
        throw "Rule error: " + rr[i];
    }

    // Check whether states exist
    for (var j = 0; j < lr.length; j++) {
      if (!states[lr[j]]) {
        throw "Unknwon state " + lr[j] + " in rule: " + rr[i];
      }
    }

    // Create dictionary
    if (r[lr[0]] == null)
      r[lr[0]] = {};
    r[lr[0]][lr[1]] = {
      "id": i,
      "r": [lr[2], lr[3]]
    };

    // FIXME Modify global var
    robjs.push({
      "states": [[i, lr[0]], [i, lr[1]], [i, lr[2]], [i, lr[3]]]
    });
  }
  return r;
}

// GLOBAL CONFIGS
var w = 500;
var h = 300;
var rpadding = 5;
var rw = 200;
//var rh;
var delay = localStorage.getItem("delay");
if (!delay)
  delay = 500;
var ruler = 15;  // rule radius
var maxPick = 1000;
var opacity = 0.3;
var defaultFontSize = 16;
var svg;
var rsvg;

var inits;
var objs;

function drawRule() {
  var rh = 2*(ruler+rpadding)*robjs.length;
  rsvg = d3.select("#ruleDiv")
  	.append("svg")
  	.attr("width", rw)
  	.attr("height", rh);

    // Draw rule circles
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

  // Draw rule states
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

  // Draw rule arrows
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
      //return 2*(ruler+rpadding)*(i+1);
    })
    .attr("stroke", "black")
    .attr("stroke-width", "2")
    .attr("marker-end", "url(#triangle)");
}

// Stopt the simulator
function stop() {
  run = false;
  d3.select("#run").text("Run >>");
  d3.select("#step").style({"pointer-events": "all"});
}

function drawControl() {
  var d = d3.select("#controlDiv");
  var e = d.append("div").classed("form-group", true);

  // Add step button
  e.append("button").attr("id", "step")
    .classed({ "btn": true, "btn-primary": true, "col-xs-offset-1": true, "col-xs-4": true })
    .text("Step >")
    .on("click", function() {
      if (run)
        return;
      sim("next");
    });

  // Add run button
  e.append("button").attr("id", "run")
    .classed({ "btn": true, "btn-primary": true, "col-xs-offset-1": true, "col-xs-4": true })
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

  // Add delay control
  var e = d.append("div").classed("form-group", true);
  e.append("label")
    .attr("for", "delay")
    .classed({"col-sm-2": true, "control-label": true})
    .text("Delay");
  e.append("div").classed({"col-sm-8": true})
    .append("input").attr("id", "delay")
    .attr("type", "range")
    .attr("min", 0).attr("max", 3000)
    .attr("value", delay).attr("step", 100)
    .classed({ "form-control-static": true })
    .on("change", function(d) {
      delay = d3.select(this).property("value");
      localStorage.setItem("delay", delay);
    });

  d.append("hr");
}

// Draw init
function drawInit() {
  var f = d3.select("#initDiv");
  for (var s in states) {
    // Draw state
    var d = f.append("div").classed("form-group", true);
    var l = d.append("label")
      .attr("for", s)
      .classed({"col-xs-offset-2": true, "col-xs-2": true, "control-label": true})
      .style("padding-top", "0px");
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

    // Append input for number of states
    d.append("div").classed("col-xs-5", true)
      .append("input").attr("id", s).attr("type", "number").attr("placeholder", s)
      .classed("form-control", true)
      .attr("value", states[s].init);
  }

  // Append redraw button
  var d = f.append("div").classed("form-group", true);
  d.append("div").classed({ "col-xs-offset-2": true, "col-xs-8": true })
    .append("button").attr("id", "redraw")
    .classed({ "btn": true, "btn-primary": true, "btn-block": true })
    .text("Redraw")
    .on("click", function() {
      for (s in states) {
        var n = Number(d3.select("#" + s).property("value"));
        //states[s].init = (n) ? n : 0;
        states[s].init = n;
      }
      drawContent();
    });
}

// Preprocess init-states information
function preprocess(states) {
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

// Draw the content
function drawContent() {
  if (svg != null)
    svg.remove();
  stepCount = 0;

  // Preprocess
  inits = preprocess(states);

  // Calculate padding: range [1,5]
  //var paddingThreshold = 350;
  //var padding = (inits.sum >= paddingThreshold) ? 1
    //: Math.floor((paddingThreshold-inits.sum)/paddingThreshold*4) + 2;
  var padding = 1;

  // Calculate radius
  var row = 1;
  var colPerRow = inits.colMax/h;
  var column = Math.floor(colPerRow * row)
  while (row * column < inits.max) {
    row++;
    column = Math.floor(colPerRow * row)

  }
  var r = (Math.min(h/row, inits.colMax/column) - padding*2)/2;

  // Adjust "too-small" columns by taking space from the biggest one
  var minColSize = 2*(r + padding);
  var colSizeDiff = 0;
  for (var i = 0; i < inits.s.length; i++) {
    if (inits.s[i].col < minColSize) {
      colSizeDiff += (minColSize - inits.s[i].col);
      inits.s[i].col = minColSize;
    }
  }
  if (colSizeDiff > 0) {
    for (var i = 0; i < inits.s.length; i++) {
      if (inits.s[i].num == inits.max) {
        inits.s[i].col -= colSizeDiff;
        break;
      }
    }
  }

  /*var maxRowCount = inits.max/(Math.floor(inits.colMax/(2*(r+padding))));
  colSizeDiff = 0;
  for (var i = 0; i < inits.s.length; i++) {
    var maxPerRow = Math.floor(inits.s[i].col/(2*(r+padding)));
    var rowCount = Math.ceil(inits.s[i].num/maxPerRow);
    if (rowCount > maxRowCount + 1) {
      var diff = (maxPerRow+1)*2*(r+padding) - inits.s[i].col;
      inits.s[i].col += diff;
      colSizeDiff += diff;
    }
  }
  if (colSizeDiff > 0) {
    for (var i = 0; i < inits.s.length; i++) {
      if (inits.s[i].num == inits.max) {
        inits.s[i].col -= colSizeDiff;
        break;
      }
    }
  }*/


  // Prepare DOM objects
  objs = [];
  var offset = 0;
  var dy = h/row;
  for (var i = 0; i < inits.s.length; i++) {
    var maxPerRow = Math.max(Math.floor(inits.s[i].col/(2*(r+padding))), 1);
    //var dx = inits.s[i].col/maxPerRow;
    for (var j = 0; j < inits.s[i].num; j++) {
      objs.push({
        "name": inits.s[i].name,
        "cx": offset + (j%maxPerRow)*2*(r+padding) + (r+padding),
        "cy": Math.floor(j/maxPerRow)*dy + dy/2
      });
    }
    //offset += inits.s[i].col;
    offset += maxPerRow*2*(r+padding);
  }

  // Create SVG
  //var realw = 2*(r+padding);
  realh = h + 100 + 80;
  svg = d3.select("#content")
  	.append("svg")
  	.attr("width", w)
  	.attr("height", realh);

  // Draw circles
//  svg.selectAll("circle")
//    .data(objs)
//    .enter()
//    .append("circle")
//    .attr("class", "node")
//    .attr("id", function(d, i) {
//      return "c" + i;
//    })
//    .attr("cx", function(d, i) {
//      return d["cx"];
//    })
//    .attr("cy", function(d, i) {
//      return d["cy"];
//    })
//    .attr("r", function(d, i) {
//      return r;
//    })
//    .attr("fill", function(d) {
//      return colors[states[d["name"]].color];
//    })
//    .attr("opacity", opacity);

  // Draw rect
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
    .attr("opacity", opacity);


  // Draw labels
  var fontScale = d3.scale.threshold()
    .domain([10, 30, 60, 100, 200, 300, 400])
    .range([40, 22, 18, 16, 14, 12, 10, 8]);
  //console.log("fontSize: " + fontScale(objs.length));
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
    .attr("font-weight", "bold");


  // Draw log
  svg.append("text")
    .text("")
    .attr("id", "log")
    .attr("x", w/2)
    .attr("y", realh - 40)
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "11");
}

// Random [0, max)
function random(max) {
  return Math.floor(Math.random() * max);
}

// Simulator function
var sels = null;
var run = false;
var stepCount = 0;
sim = function(mode) {

  if (mode == "run" && !run)
    return;

  var pick = 0;
  var t = [-1, -1];
  var rid;
  var n;
  while (n == null) {
    pick++;
    if (pick > maxPick) {
//      humane.log("No applicable rules");
//      svg.select("#log")
//        .text("No applicable rules");
      toastr.info("No applicable rules");
      stop();
      return;
    }
    t[0] = random(inits.sum);
    t[1] = random(inits.sum);
    var m = inrules[objs[t[0]].name];
    if (m == null) {
      m = inrules[objs[t[1]].name];
      if (m == null)
        continue;
      var o = m[objs[t[0]].name];
      if (o == null)
        continue;
      rid = o.id;
      n = o.r;
    } else {
      var o = m[objs[t[1]].name];
      if (o == null)
        continue;
      rid = o.id;
      n = o.r;
    }
  }

  // Highlight rule
  rsvg.selectAll(".rule")
    .attr("stroke", "none");
  rsvg.selectAll(".rule" + rid)
     .attr("stroke", function() {
      return colors["brown"];
    })
    .attr("stroke-width", "3")
    .attr("stroke-opacity", "0.9");

  // Write log
  svg.selectAll("#log")
    .text("[#" + (stepCount++) + "] " + objs[t[0]].name + " " + objs[t[1]].name
          + " ->  " + n[0] + " " + n[1]);

  objs[t[0]].name = n[0];
  objs[t[1]].name = n[1];

  // Remove previous selections
  if (sels != null) {
    svg.selectAll(".node")
      .attr("stroke", "none");
  }

  sels = [ "#c"+t[0], "#c"+t[1] ];

  svg.selectAll(sels)
    .transition()
    .duration(delay)
/*    .attr("stroke", function() {
      return colors["brown"];
    })
    .attr("stroke-width", "3")*/
    .each("end", function(d, i) {
      svg.select("#c" + t[i])
        .transition()
        .duration(delay)
        .attr("fill", function() {
          return colors[states[n[i]].color];
        });

      var x = svg.select("#t" + t[i])
        .transition()
        .duration(delay)
        .text(function() {
          return states[n[i]].label;
        });
      if (mode == "run")
        x.each("end", function() {
          if (i%2 == 0)
            sim("run");
        });
    });
}

function draw() {
  d3.select("#ruleDiv").selectAll("*").remove();
  d3.select("#controlDiv").selectAll("*").remove();
  d3.select("#initDiv").selectAll("*").remove();
  d3.select("#content").selectAll("*").remove();

  drawRule();
  drawControl();
  drawInit();
  drawContent();
}

d3.select("#inputFile")
  .on("change", function() {
    fileName = d3.select(this).property("value").replace(/^C:\\fakepath\\/, "");
    d3.select("#selFile").text(fileName);

  });

d3.select("#draw")
  .on("click", function() {
    try {
       var file = d3.select("#inputFile").property("files")[0];
       if (!file) {
         toastr.error("File not found");
         return;
       }
       var reader = new FileReader();
       reader.onload = function(e) {
         try {
           eval(reader.result);
           inrules = parseRules(rules);
           draw();
         } catch (err) {
           if (err.message)
             toastr.error("Syntax error: " + err.message);
           else if (err.lastIndexOf("Warning", 0) === 0)
             toastr.warning(err.replace(/^Warning: /, ""));
           else
             toastr.error(err);
         }
       }

       reader.readAsText(file);
    }
    catch (err) {
      console.log(err.message);
      if (err.message)
        toastr.error(err.message);
      else
        toastr.error(err);
    }
  });

