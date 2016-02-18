states = {
  "AY": {
    "color": "green",
    "label": 1,
    "init": 10
  },
  "AN": {
    "color": "yellow",
    "label": 2,
    "init": 11
  },
  "PY": {
    "color": "green",
    "label": 3,
    "init": 5
  },
  "PN": {
    "color": "yellow",
    "label": 4,
    "init": 3
  }
};
rules = [
  "AY, AN -> PY, PY",
  "AY, PN -> AY, PY",
  "AN, PY -> AN, PN",
  "PY, PN -> PY, PY",
  //"PN, PN -> PY, PY",
];
