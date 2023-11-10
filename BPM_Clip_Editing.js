/*function onSelectionChange() {
  var selectedLayers = app.project.activeItem.selectedLayers;
  alert("Вы выбрали " + selectedLayers.length + " слоя(ев).");
}*/

function getTime() {
  var _time = 0;
  try {
    var timeString = system.callSystem('cmd.exe /c "time"');

    var colonPosition = timeString.indexOf(":");
    var colonPosition2 = timeString.indexOf(":", colonPosition + 1);
    var hour = parseInt(
      timeString.substring(colonPosition + 2, colonPosition2)
    );
    colonPosition = colonPosition2;
    colonPosition2 = timeString.indexOf(":", colonPosition + 1);
    var minute = parseInt(
      timeString.substring(colonPosition + 1, colonPosition2)
    );
    colonPosition = colonPosition2;
    colonPosition2 = timeString.indexOf(".", colonPosition + 1);
    var seconds = parseInt(
      timeString.substring(colonPosition + 1, colonPosition2)
    );
    colonPosition = colonPosition2;
    colonPosition2 = timeString.indexOf("\n", colonPosition + 1);
    var miliseconds = parseInt(
      timeString.substring(colonPosition + 1, colonPosition2)
    );

    _time = (hour * 60 + minute) * 60 + seconds + miliseconds / 100;
  } catch (e) {
    alert(e);
  }
  return _time;
}
var cursorMonitor = 5;
var currentBeat = -1;
function createUI() {
  var window = new Window("palette", "Create BPM clip", undefined, {
    resizeable: true,
  });

  window.margins = 0;
  var mainGroup = window.add("group");
  mainGroup.orientation = "column";
  mainGroup.margins = 10;
  mainGroup.size = [500, 350];
  mainGroup.alignChildren = ["center", "top"];
  var imageBeatFile = new File("Data\\beatT4.png");

  var opnGroup = mainGroup.add("group");
  opnGroup.orientation = "row";
  var isOppositeProcess = opnGroup.add(
    "checkbox",
    undefined,
    "if two layers are selected, process them with opposite values"
  );
  isOppositeProcess.value = true;

  var bpmGroup = mainGroup.add("group");
  bpmGroup.orientation = "row";
  bpmGroup.add("statictext", undefined, "BPM:");
  var bpmInput = bpmGroup.add("edittext", undefined, "140");
  bpmInput.characters = 4;
  bpmGroup.add("statictext", undefined, "beats:");
  var beatsInput = bpmGroup.add("edittext", undefined, "4");
  beatsInput.characters = 3;

  var selectedGroup = mainGroup.add("group");
  selectedGroup.add("statictext", undefined, "Selected layers: ");
  var countText = selectedGroup.add(
    "statictext",
    undefined,
    app.project.activeItem.selectedLayers.length
  );

  window.addEventListener("focus", function () {
    try {
      countText.text = app.project.activeItem.selectedLayers.length;
    } catch (e) {}
  });

  var rectangles = [];
  var panelGroup = mainGroup.add("group");
  panelGroup.alignChildren = ["center", "top"];
  for (var i = 0; i < 16; i++) {
    var floor = Math.floor(i / 4);
    var rect = panelGroup.add("group", undefined, "");

    rect.size = [15, 24];
    rect.beat = floor;
    rect.state = false;
    rect.changed = false;
    rect.color1 = [0, 0, 0];
    rect.color2 = [1, 1, 1];

    rect.setBeat = function (value) {
      if (value == 2) {
        if (!this.changed) {
          this.change(!this.state);
          this.changed = true;
        }
      } else if (value == 1) this.change(true);
      else this.change(false);
    };
    if (floor % 2 == 0) {
      rect.color1 = [0.09, 0.09, 0.09];
      rect.color2 = [0.77, 0.7, 0.57];
    } else {
      rect.color1 = [0.21, 0.09, 0.09];
      rect.color2 = [0.88, 0.63, 0.51];
    }
    rect.activeColor = function (brushState) {
      if (brushState) return this.color2;
      return this.color1;
    };
    rect.change = function (brushState) {
      if (this.state != brushState) {
        this.state = brushState;
        this.graphics.backgroundColor = this.graphics.newBrush(
          this.graphics.BrushType.SOLID_COLOR,
          this.activeColor(brushState)
        );
        ch[this.index].value = this.state;
      }
    };
    rect.graphics.backgroundColor = rect.graphics.newBrush(
      rect.graphics.BrushType.SOLID_COLOR,
      rect.color1
    );

    rect.hitTest = function (x, y) {
      var _x = window.bounds.x;
      var _y = window.bounds.y;
      var _l = this.windowBounds.left;
      var _r = this.windowBounds.right;
      var _t = this.windowBounds.top;
      var _b = this.windowBounds.bottom;
      //debugText.text = "mx " + x + "my " + y + "xl " + (_x+_l) + "xr " + (_x+_r) + "yt " + (_y+_t) + "yb " + (_y+_b);
      return x >= _x + _l && x <= _x + _r && y >= _y + _t && y <= _y + _b;
    };

    rect.onRectMouseOut = function () {
      var color = this.graphics.backgroundColor.color;
      color[3] = 1;
      this.graphics.backgroundColor = this.graphics.newBrush(
        this.graphics.BrushType.SOLID_COLOR,
        color
      );
    };
    rect.onMouseDown = function (event) {
      currentBeat = this.index;
      if (event.button === undefined) {
        cursorMonitor = 5;
      } else if (event.button === 0) {
        //this.change(1);
        this.setBeat(true);
        cursorMonitor = 0;
      } else if (event.button === 1) {
        //this.change(!this.state);
        cursorMonitor = 1;
        this.setBeat(2);
      } else if (event.button === 2) {
        //this.change(0);
        this.setBeat(false);
        cursorMonitor = 2;
      }
    };

    rect.addEventListener("mousedown", rect.onMouseDown);
    //rect.addEventListener("mouseout", rect.onRectMouseOut);

    rect.index = i; // Добавляем индекс для каждого прямоугольника
    rect.margins = 0;
    if (imageBeatFile.exists)
      var image = rect.add("image", undefined, imageBeatFile);

    rectangles.push(rect);
  }

  function showProps(panel) {
    var propsT = "";
    function parseProps(level, panel) {
      if (level > 5) return;
      try {
        var tab = "";
        for (var i = 0; i < level; i++) tab += "\t";

        for (var prop in panel) {
          propsT +=
            tab +
            prop +
            ": " +
            String(panel[prop]) +
            ": " +
            typeof panel[prop] +
            "\n";
          if (typeof panel[prop] == "object") {
            if (panel[prop] != null && prop != "window" && prop != "parent") {
              parseProps(level + 1, panel[prop]);
            }
          }
        }
      } catch (e) {
        alert(e);
      }
    }
    parseProps(0, panel);
    return propsT;
  }
  function changeStates(screenX, state) {
    for (var i = 0; i < currentBeat; i++) {
      var _l = rectangles[i].windowBounds.right + window.bounds.x;
      if (screenX <= _l) {
        for (var j = i; j < currentBeat; j++) {
          rectangles[j].setBeat(state);
        }
        return;
      }
    }
    for (var i = 15; i > currentBeat; i--) {
      var _r = rectangles[i].windowBounds.left + window.bounds.x;
      if (screenX >= _r) {
        for (var j = i; j > currentBeat; j--) {
          rectangles[j].setBeat(state);
        }
        return;
      }
    }
  }
  // Функция для изменения цвета прямоугольника при проведении по нему мышкой
  function onMouseMove(event) {
    //infoStateText.text =
    //"x = " + event.screenX + " y = " + event.screenY + "b " + event.button;

    var newCursorMonitor = 5;
    if (event.button == undefined) newCursorMonitor = 5;
    else newCursorMonitor = event.button;

    if (cursorMonitor != newCursorMonitor) {
      for (var i = 0; i < 16; i++) {
        rectangles[i].changed = false;
      }
      currentBeat = -1;
      cursorMonitor = newCursorMonitor;
    }

    if (cursorMonitor == 0 && currentBeat != -1) {
      changeStates(event.screenX, true);
      return;
    } else if (cursorMonitor == 2 && currentBeat != -1) {
      changeStates(event.screenX, false);
      return;
    } else if (cursorMonitor == 1 && currentBeat != -1) {
      changeStates(event.screenX, 2);
      return;
    }
    for (var i = 0; i < rectangles.length; i++) {
      var rect = rectangles[i];
      if (rect.hitTest(event.screenX, event.screenY)) {
        if (event.button === undefined) {
        } else if (event.button === 0) {
          rect.setBeat(true);
          currentBeat = i;
          cursorMonitor = 0;
        } else if (event.button === 1) {
          rect.setBeat(2);
          currentBeat = i;
          cursorMonitor = 1;
        } else if (event.button === 2) {
          rect.setBeat(false);
          currentBeat = i;
          cursorMonitor = 2;
        }
      }
    }
  }

  // Добавляем обработчик события для окна
  window.addEventListener("mousemove", onMouseMove);

  /*
  var invertGroup = mainGroup.add("group");
  invertGroup.orientation = "row";
  var btnInvertAll = invertGroup.add("button", undefined, "Invert all");
  btnInvertAll.onClick = invertAll;*/

  function createFourSixteenthsChangeButton(iterator, row) {
    var btn = row.add("button", undefined, "All");
    btn.onClick = function () {
      var v = iterator * 4;
      var _state = !ch[v].value;
      for (var i = 3; i >= 0; i--) {
        ch[v + i].value = _state;
        rectangles[v + i].setBeat(_state);
      }
    };
  }

  function createInvertButton(iterator, row) {
    var btn = row.add("button", undefined, "Inv");
    btn.onClick = function () {
      var rowNumber = iterator * 4;
      for (var i = rowNumber; i < rowNumber + 4; i++) {
        ch[i].value = !ch[i].value;
        rectangles[i].setBeat(ch[i].value);
      }
    };
  }

  function invertAll() {
    for (var i = 0; i < 16; i++) {
      ch[i].value = !ch[i].value;
      rectangles[i].setBeat(ch[i].value);
    }
  }

  var ch = [];
  for (var j = 0; j < 4; j++) {
    var row = mainGroup.add("group");
    row.orientation = "row";
    row.add("statictext", undefined, "" + (j + 1));
    createFourSixteenthsChangeButton(j, row);
    createInvertButton(j, row);
    for (var i = 0; i < 4; i++) {
      var checkbox = row.add("checkbox", undefined, "");
      checkbox.index = j * 4 + i;
      checkbox.onChange = function () {
        rectangles[this.index].setBeat(this.value);
      };
      checkbox.onClick = checkbox.onChange;
      ch.push(checkbox);
    }
  }

  var myGroup = mainGroup.add("group");
  var btnInvertAll = myGroup.add("button", undefined, "Invert all");
  btnInvertAll.onClick = invertAll;
  var btn = myGroup.add("button", undefined, "Создать");
  var startTime = 0;
  var endTime = 0;
  btn.onClick = function () {
    //debugText.text = showProps(image);

    startTimer();
    var selectedLayers = app.project.activeItem.selectedLayers;
    var length = selectedLayers.length;
    if (length == 0) {
      infoStateText.text = "no layers selected";
      endTimer();
      //window.close();
      return;
    }
    var comp = selectedLayers[0].containingComp; // получаем композицию, содержащую выбранный слой
    var fps = comp.frameRate; // получаем частоту кадров композиции
    var duration = comp.duration; // получаем длительность композиции

    var bpm = parseFloat(bpmInput.text);
    var beats = parseFloat(beatsInput.text);

    for (var j = 0; j < length; j++) {
      if (length == 2 && j == 1 && isOppositeProcess.value) invertAll();
      var layer = selectedLayers[j];
      var opacityProperty = layer
        .property("ADBE Transform Group")
        .property("ADBE Opacity");
      try {
        for (var i = layer.opacity.numKeys - 1; i >= 0; i--) {
          layer.opacity.removeKey(i + 1);
        }
      } catch (e) {
        return;
      }

      var beatsPerSecond = 60 / ((bpm * 16) / beats);
      var count = (duration * ((bpm * 16) / beats)) / 60;

      var keyframe = layer.opacity.addKey(0);
      var holdInt = KeyframeInterpolationType.HOLD;

      try {
        opacityProperty.setValueAtKey(keyframe, ch[0].value * 100);
        //Сделать интерполяцию с остановкой
        opacityProperty.setInterpolationTypeAtKey(keyframe, holdInt, holdInt);
        for (var i = 1; i < count; i++) {
          if (ch[i % 16].value == ch[(i - 1) % 16].value) continue;
          markerTime = Math.round(i * beatsPerSecond * fps) / fps;
          keyframe = opacityProperty.addKey(markerTime);
          opacityProperty.setValueAtKey(keyframe, ch[i % 16].value * 100);
          opacityProperty.setInterpolationTypeAtKey(keyframe, holdInt, holdInt);
        }
      } catch (e) {
        alert(e);
      }
    }
    if (length == 1) infoStateText.text = "1 layer Complete";
    else infoStateText.text = length + " layers Complete";
    endTimer();
    //window.close();
  };
  var infoGroup = mainGroup.add("group");
  infoGroup.orientation = "row";
  var infoStateText = infoGroup.add("statictext", undefined, "");
  infoStateText.characters = 20;
  var infoTimeText = infoGroup.add("statictext", undefined, "");
  infoTimeText.characters = 20;

  var debugGroup = mainGroup.add("group");
  var debugText = debugGroup.add("edittext", undefined, "", {
    multiline: true,
    readonly: false,
    scrolling: true,
  });
  debugText.size = [500, 500];
  debugGroup.visible = false;
  function startTimer() {
    var allowScriptsToWriteFiles = app.preferences.getPrefAsLong(
      "Main Pref Section",
      "Pref_SCRIPTING_FILE_NETWORK_SECURITY"
    );
    if (allowScriptsToWriteFiles === 1) {
      startTime = getTime();
    } else {
      //alert("Запрещено сценариям выполнять запись файлов и осуществлять доступ к сети");
    }
  }
  function endTimer() {
    var allowScriptsToWriteFiles = app.preferences.getPrefAsLong(
      "Main Pref Section",
      "Pref_SCRIPTING_FILE_NETWORK_SECURITY"
    );
    if (allowScriptsToWriteFiles === 1) {
      var executionTime = getTime() - startTime;
      infoTimeText.text = Math.round(executionTime * 100) / 100 + " seconds";
    } else {
      infoTimeText.text = "~ seconds";
    }
  }

  window.show();
}
createUI();
