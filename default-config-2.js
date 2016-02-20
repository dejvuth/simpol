outputs = {
  "yes": {
    "color": "green"
  },
  "no": {
    "color": "red"
  },
};
states = {
  "AY": {
    "output": "yes",
    "label": 1,
    "init": 40
  },
  "AN": {
    "output": "no",
    "label": 2,
    "init": 20
  },
  "PY": {
    "output": "yes",
    "label": 3,
    "init": 10
  },
  "PN": {
    "output": "no",
    "label": 4,
    "init": 5
  },
};
rules = [
  "AY, AN -> PY, PY",
  "AY, PN -> AY, PY",
  "AN, PY -> AN, PN",
  "PY, PN -> PY, PY",
  //"PN, PN -> PY, PY",
];
