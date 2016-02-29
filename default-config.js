states = {
  "AY": {
    "color": "green",
    "label": 1,
    "init": 39
  },
  "AN": {
    "color": "red",
    "label": 2,
    "init": 4
  },
  "PY": {
    "color": "green",
    "label": 3,
    "init": 5
  },
  "PN": {
    "color": "red",
    "label": 4,
    "init": 4
  },
};
rules = [
  "AY, AN -> PY, PY",
  "AY, PN -> AY, PY",
  "AN, PY -> AN, PN",
  "PY, PN -> PY, PY",
];
