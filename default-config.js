states = {
  "AY": {
    "color": "green",
    "label": 1,
    "init": 10
  },
  "AN": {
    "color": "red",
    "label": 0,
    "init": 40
  },
  "PY": {
    "color": "yellow",
    "label": 1
  },
  "PN": {
    "color": "orange",
    "label": 0
  }
};
rules = [
  "AY, AN -> PY, PY",
  "AY, PN -> AY, PY",
  "AN, PY -> AN, PN",
  "PY, PN -> PY, PY"
];
