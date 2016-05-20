// *** States ***
// A collection of key-value pairs.
// Keys are state names, whereas values are objects, defining state properties
states = {
  "AY": {
    "color": "green",
    "label": 1,
    "init": 20
  },
  "AN": {
    "color": "red",
    "label": 2,
    "init": 19
  },
  "PY": {
    "color": "green",
    "label": 3,
    "init": 0
  },
  "PN": {
    "color": "red",
    "label": 4,
    "init": 0
  },
};

// *** Rules ***
// An array of strings, defining transitions between comma-separated pairs of states
rules = [
  "AY, AN -> PY, PY",
  "AY, PN -> AY, PY",
  "AN, PY -> AN, PN",
  "PY, PN -> PY, PY",
];
