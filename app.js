const container = document.getElementById("hello-plan");
const dataEl = document.querySelector(".data");
const meetingCounterEl = document.getElementById("meeting-counter");
const deskCounterEl = document.getElementById("desk-counter");
let active = {};
const startupSettings = {
  panZoom: false,
  theme: {
    background: { color: "#fff", showGrid: false },
    elements: {
      space: {
        fill: [243, 243, 245],
        program: {
          work: { fill: [230, 238, 255] },
          meet: { fill: [230, 238, 255] },
          circulate: { fill: [243, 243, 245] },
          wash: { fill: [243, 243, 245] }
        }
      }
    }
  },
  ui: { menu: false, coordinates: false, scale: false }
};

const publishableToken = "cf0cebd4-8571-4473-bccc-c6a0b2a96147";
const demoSceneId = "ec7fe847-208b-4855-b781-8dd223ba4292";
const floorPlan = new FloorPlanEngine(container, startupSettings);

const dataSensor = fetch(
  "https://xamu-xieh-m9ik.n7.xano.io/api:_HSC9sgl/3_in_1_live"
).then((response) => response.json());

const dataSensor2 = fetch(
  "https://xamu-xieh-m9ik.n7.xano.io/api:_HSC9sgl/9_in_1_live"
).then((response) => response.json());

const dataSensor3 = fetch(
  "https://xamu-xieh-m9ik.n7.xano.io/api:_HSC9sgl/aurasensor_live_data"
).then((response) => response.json());

var scores = [];
Promise.all([dataSensor, dataSensor2, dataSensor3]).then((res) => {
  let dataSensor = res[0][0].score;
  let dataSensor2 = res[1][0].score;
  let dataSensor3 = res[2][0].score;
  scores.push(dataSensor, dataSensor2, dataSensor3);

  console.log(scores);
  floorPlan.loadScene(demoSceneId, { publishableToken }).then(() => {
    const spaces = floorPlan.resources.spaces;
    const workSpaces = spaces.filter((space) => space.program === "work");
    const customOffice = workSpaces.filter(
      (space) => space.customId === "office"
    );

    workSpaces.forEach((space, i) => {
      space.assets.forEach((id, j) => {
        let asset = floorPlan.state.resources.assets.find((f) => f.id === id);
        if (space.customId == "office") {
          let fill = getBackgroundColor(scores[0]);
          asset.node.setHighlight({ fill });
        }
        if (space.customId == "office2") {
          let fill = getBackgroundColor(scores[1]);
          asset.node.setHighlight({ fill });
        }
        if (space.customId == "office3") {
          let fill = getBackgroundColor(scores[2]);
          asset.node.setHighlight({ fill });
        }
      });
    });
    // Listen to mouse events

    floorPlan.on("mousemove", highlightResources, floorPlan);

    console.log(workSpaces);
  });
});

function getBackgroundColor(score) {
  const redBackground = [255, 44, 0];
  const orangeBackground = [255, 195, 0];
  const greenBackground = [50, 255, 0];
  if (score >= 80) {
    return greenBackground;
  } else if (score < 80 && score >= 50) {
    return orangeBackground;
  } else {
    return redBackground;
  }
}

function highlightResources(evt) {
  const pos = evt.pos;
  const infoPos = [pos[0], pos[1] - 0.5];
  let { spaces, assets } = this.getResourcesFromPosition(pos);
  highlight(spaces, "space", [150, 200, 250]);
  //highlight(assets, "asset", [250, 150, 50]);
  setInfoWindow(infoPos);
}
function highlight(items, type, color) {
  if (!items.length) {
    if (active[type]) active[type].node.setHighlight();
    delete active[type];
    return;
  }
  let item = items[0];
  if (active[type]?.id === item.id) return;
  else if (active[type]) active[type].node.setHighlight();
  item.node.setHighlight({ fill: color });
  active[type] = item;
}
function setInfoWindow(infoPos) {
  if (active.asset || active.space) {
    const assetCount = active.space.assets.length;
    const html = `<b>${active.space.name}</b><br>${assetCount} assets<br>${
      active.asset?.name || ""
    }`;
    if (active.infoWindow) active.infoWindow.set({ pos: infoPos, html });
    else
      active.infoWindow = floorPlan.addInfoWindow({
        pos: infoPos,
        html,
        height: 100,
        width: 150,
        closeButton: false
      });
  } else if (active.infoWindow) {
    active.infoWindow.remove();
    delete active.infoWindow;
  }
}
