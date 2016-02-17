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
var delay = 500;
var ruler = 15;  // rule radius
var maxPick = 1000;
var opacity = 0.3;
var fontSize = 16;
var svg;
var rsvg;

var inits;
var objs;

// Set transition delay
function setDelay(d) {
  delay = d;
}

// Preprocess init-states information
function init(states) {
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
    throw "No initial states";
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
    .attr("opacity", opacity);

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
    .attr("font-size", fontSize)
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

// Draw init control
function drawInit() {
  var f = d3.select("#initForm");
  for (var s in states) {
    var d = f.append("div").classed("form-group", true);
    var l = d.append("label")
      .attr("for", s)
      .classed({"col-sm-offset-1": true, "col-sm-2": true, "control-label": true})
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
      .attr("font-size", fontSize)
      .attr("font-weight", "bold");

    // Append input
    d.append("div").classed("col-sm-5", true)
      .append("input").attr("id", s).attr("type", "number").attr("placeholder", s)
      .classed("form-control", true)
      .attr("value", states[s].init);
  }
}

// Draw the content
function draw() {
  if (svg != null)
    svg.remove();

  // Preprocess
  inits = init(states);

  // Calculate padding: range [1,5]
  var paddingThreshold = 350;
  var padding = (inits.sum >= paddingThreshold) ? 1
    : Math.floor((paddingThreshold-inits.sum)/paddingThreshold*4) + 2;

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
      }
    }
  }

  // Prepare DOM objects
  objs = [];
  var offset = 0;
  var dy = h/row;
  for (var i = 0; i < inits.s.length; i++) {
    var maxPerRow = Math.max(Math.floor(inits.s[i].col/(2*(r+padding))), 1);
    var dx = inits.s[i].col/maxPerRow;
    for (var j = 0; j < inits.s[i].num; j++) {
      objs.push({
        "name": inits.s[i].name,
        "cx": offset + (j%maxPerRow)*dx + dx/2,
        "cy": Math.floor(j/maxPerRow)*dy + dy/2
      });
    }
    offset += inits.s[i].col;
  }

  // Create SVG
  realh = h + robjs.length*2*(ruler + rpadding) + 80;
  //realh = h + 80;
  svg = d3.select("#content")
  	.append("svg")
  	.attr("width", w)
  	.attr("height", realh);

  // Draw circles
  svg.selectAll("circle")
    .data(objs)
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("id", function(d, i) {
      return "c" + i;
    })
    .attr("cx", function(d, i) {
      return d["cx"];
    })
    .attr("cy", function(d, i) {
      return d["cy"];
    })
    .attr("r", function(d, i) {
      return r;
    })
    .attr("fill", function(d) {
      return colors[states[d["name"]].color];
    })
    .attr("opacity", opacity);

  // Draw labels
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
    .attr("font-size", fontSize)
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


d3.select("#inputFile")
  .on("change", function() {
    var fileName = d3.select(this).property("value").replace(/^C:\\fakepath\\/, "");
    console.log(fileName);
    d3.select("#selFile").text(fileName);

     });

d3.select("#draw")
  .on("click", function() {
    try {
       var file = d3.select("#inputFile").property("files")[0];
       var reader = new FileReader();
       reader.onload = function(e) {
         eval(reader.result);
         inrules = parseRules(rules);
         drawRule();
         drawInit();
         draw();
       }

       reader.readAsText(file);
    }
    catch (err) {
      console.log(err.message);
    }
  });

