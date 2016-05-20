title = "MAJORITY";
//opacity = 0.6;
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
initial = ["AY", "AN"];
rules = [
  "AY, AN -> PY, PY",
  "AY, PN -> AY, PY",
  "AN, PY -> AN, PN",
  "PY, PN -> PY, PY",
  //"AY, AY -> PY, PY",
  //"PN, PN -> PY, PY",
];
