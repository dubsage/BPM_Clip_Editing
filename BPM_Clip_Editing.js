function createUI() {
	var window = new Window("dialog", "Create BPM clip");
    window.alignChildren = "left";
	window.orientation = "column"; 
	
	var bpmGroup = window.add("group");
	bpmGroup.orientation = "row";
	bpmGroup.add("statictext", undefined, "BPM:");
    var bpmInput = bpmGroup.add("edittext", undefined, "140");
    bpmInput.characters = 4;
	
	bpmGroup.add("statictext", undefined, "beats:");
    var beatsInput = bpmGroup.add("edittext", undefined, "4");
    beatsInput.characters = 3;

	function createButton(iterator) {
	  var btn = row.add("button", undefined, "All " + (iterator + 1));
		btn.onClick = function() { 
		var v = iterator * 4;
		if (!ch[v].value) ch[v].value = ch[v + 1].value = ch[v + 2].value = ch[v + 3].value = true;
		else ch[v + 0].value = ch[v + 1].value = ch[v + 2].value = ch[v + 3].value = false;
		};
	}

	var ch = [];
	for (var j = 0; j < 4; j++) {
		var row = window.add("group");
		row.orientation = "row";	
		createButton(j);
		for (var i = 0; i < 4;i++) {
			ch.push(row.add("checkbox", undefined, ""));
		}
	}	
	// Создаем группу для кнопок
	var myGroup = window.add("group");
	var btn = myGroup.add("button", undefined, "Включить");
	btn.onClick = function() {
		var selectedLayers = app.project.activeItem.selectedLayers; // получаем выбранный слой
		var length = selectedLayers.length;
		if (length == 0) {
			window.close();
			return;
		}
		var comp = selectedLayers[0].containingComp; // получаем композицию, содержащую выбранный слой
		var fps = comp.frameRate; // получаем частоту кадров композиции
		var duration = comp.duration; // получаем длительность композиции

	var bpm = parseFloat(bpmInput.text);
	var beats = parseFloat(beatsInput.text);

		for (j = 0; j < selectedLayers.length; j++){
			var layer = selectedLayers[j];
			try {
			  for (var i = layer.opacity.numKeys - 1; i >= 0; i--) {
				  layer.opacity.removeKey(i + 1);
			  }} catch(e){return;}
			  
			var beatsPerSecond = 60 / (bpm * 16 / beats);
			var count = duration * (bpm * 16 / beats) / 60;


			var markerTime = 0;
			var keyframe = layer.opacity.addKey(0);

			if (ch[0].value) {
				layer.opacity.setValueAtKey(keyframe, 100);
			}
			else {
				layer.opacity.setValueAtKey(keyframe, 0);
			}
				
			for (i = 1; i < count; i++) {
				if (ch[i % 16].value == ch[(i - 1) % 16].value) continue;
				markerTime = (Math.round(i * beatsPerSecond * fps))/fps;
				var keyframeOld = layer.opacity.addKey((markerTime * fps - 1) / fps);
				layer.opacity.setValueAtKey(keyframeOld, (1 - ch[i % 16].value) * 100);
				var keyframeNew = layer.opacity.addKey(markerTime);
				layer.opacity.setValueAtKey(keyframeNew, ch[i % 16].value * 100);	
			}

		}
		window.close();
	};
	window.show();
}
createUI();
