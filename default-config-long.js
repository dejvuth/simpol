// Title of the simulation
title = "MAJORITY";

// Color opacity of nodes
opacity = 0.5;

// Output attributes
outputs = {
  "yes": {
    "color": "green"
  },
  "no": {
    "color": "red"
  },
};

// *** States ***
// A collection of key-value pairs.
// Keys are state names, whereas values are objects, defining state properties
states = {
  "AY": {
    "output": "yes",
    "label": 1,
    "init": 20,
  },
  "AN": {
    "output": "no",
    "label": 2,
    "init": 19
  },
  "PY": {
    "output": "yes",
    "label": 3,
    "init": 0
  },
  "PN": {
    "output": "no",
    "label": 4,
    "init": 0
  },
};

// *** Initial states ***
// An array of state names.
// Used only for highlighting purpose.
initial = ["AY", "AN"];

// *** Rules ***
// An array of strings, defining transitions between comma-separated pairs of states
rules = [
  "AY, AN -> PY, PY",
  "AY, PN -> AY, PY",
  "AN, PY -> AN, PN",
  "PY, PN -> PY, PY",
];
