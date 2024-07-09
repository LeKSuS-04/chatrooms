// ==UserScript==
// @name         chat rooms
// @namespace    http://tampermonkey.net/
// @version      v0.0.1
// @description  Polls for messages in specified room
// @author       https://github.com/LeKSuS-04
// @match        https://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mephi.ru
// @require      https://code.jquery.com/jquery-3.7.1.js
// @require      https://code.jquery.com/ui/1.13.3/jquery-ui.js
// @resource     JQUERY_UI_CSS https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  const chatRoomsBackend = "https://chatrooms.example.ru";

  const jqueryUiCss = GM_getResourceText("JQUERY_UI_CSS");
  GM_addStyle(jqueryUiCss);

  const container = document.createElement("div");
  container.id = "draggable-container";
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.justifyContent = "space-between";
  container.style.background = "white";
  container.style.padding = "20px";
  container.style.visibility = "visible";
  container.style.borderRadius = "10px";
  container.style.userSelect = "none";
  container.style.boxShadow = "0 0 2px rgba(0, 0, 0, 0.3)";
  container.style.zIndex = '999999999999';

  const dragHandle = document.createElement("div");
  dragHandle.id = "draggable-handle";
  dragHandle.style.position = "absolute";
  dragHandle.style.top = "5px";
  dragHandle.style.left = "5px";
  dragHandle.style.width = "20px";
  dragHandle.style.height = "20px";
  dragHandle.style.background = "gray";
  dragHandle.style.cursor = "move";

  const img = document.createElement("img");
  img.src = "https://imgs.xkcd.com/comics/automation.png";
  img.style.maxWidth = "100%";
  img.style.maxHeight = "calc(100% - 3em)";
  img.style.objectFit = "scale-down";

  const description = document.createElement("p");
  description.textContent = "xkcd 1319, Automation";

  const content = document.createElement("div");
  content.style.maxHeight = "calc(100% - 4.5em)";
  content.style.flexGrow = "1";

  const bottomRow = document.createElement("div");
  bottomRow.style.display = "flex";
  bottomRow.style.justifyContent = "space-between";
  bottomRow.style.alignItems = "center";
  bottomRow.style.padding = "10px";

  let page = 0;
  const updatePage = (updater) => {
    page =
      messages.length === 0
        ? 0
        : (updater(page) + messages.length) % messages.length;
    saveState();
    updateUI();
  };
  const pageCounter = document.createElement("p");
  pageCounter.style.userSelect = "none";
  pageCounter.textContent = "0/0";
  content.onclick = () => updatePage((p) => p + 1);

  const opacitySlider = document.createElement("input");
  opacitySlider.type = "range";
  opacitySlider.min = "0";
  opacitySlider.max = "1";
  opacitySlider.step = "0.1";
  opacitySlider.value = "1";
  opacitySlider.style.flexGrow = "1";
  opacitySlider.oninput = function () {
    container.style.opacity = this.value;
    saveState();
  };

  let roomId = "";
  let scrollToLastPage = false;
  let messages = [];
  const roomIdInput = document.createElement("input");
  roomIdInput.type = "text";
  roomIdInput.placeholder = "room id";
  roomIdInput.oninput = function () {
    roomId = this.value;
    saveState();
  };
  const updateUI = () => {
    pageCounter.textContent = `${page + 1}/${messages.length}`;
    if (messages[page].image_file !== null) {
      img.style.display = "block";
      img.src = `${chatRoomsBackend}/uploads/${messages[page].image_file}`;
    } else {
      img.style.display = "none";
    }
    description.textContent = messages[page].message;
  };
  const refreshMessages = (callback) => {
    if (roomId === "") {
      return;
    }

    fetch(`${chatRoomsBackend}/messages/${roomId}`, { method: "GET" })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        throw "Room not found";
      })
      .then((json) => {
        messages = json;
        if (scrollToLastPage) {
          page = messages.length - 1;
        }
        callback();
      })
      .catch((error) =>
        console.error(`Failed to fetch messages from room ${roomId}: ${error}`)
      );
  };

  const loadState = () => {
    let state = localStorage.getItem("chrms.state");
    if (state === null) {
      state = {
        container: {
          top: "20px",
          left: "20px",
          width: "400px",
          height: "600px",
          opacity: 0.7,
        },
        room: {
          id: "",
          page: 0,
          scrollToLastPage: true,
        },
      };
    } else {
      state = JSON.parse(state);
    }
    opacitySlider.value = state.container.opacity;
    container.style.opacity = state.container.opacity;
    container.style.top = state.container.top;
    container.style.left = state.container.left;
    container.style.width = state.container.width;
    container.style.height = state.container.height;
    container.style.visibility = state.container.visibility;
    roomId = state.room.id;
    roomIdInput.value = state.room.id;
    page = state.room.page;
    scrollToLastPage = state.room.scrollToLastPage;
  };
  const saveState = () => {
    const position = localStorage.setItem(
      "chrms.state",
      JSON.stringify({
        container: {
          top: container.style.top,
          left: container.style.left,
          width: container.style.width,
          height: container.style.height,
          opacity: opacitySlider.value,
          visibility: container.style.visibility,
        },
        room: {
          id: roomIdInput.value,
          page: page,
          scrollToLastPage: scrollToLastPage,
        },
      })
    );
  };

  loadState();

  bottomRow.appendChild(pageCounter);
  bottomRow.appendChild(opacitySlider);
  bottomRow.appendChild(roomIdInput);
  content.appendChild(img);
  content.appendChild(description);
  container.appendChild(dragHandle);
  container.appendChild(content);
  container.appendChild(bottomRow);
  document.body.appendChild(container);

  (function ($) {
    $(document).ready(function () {
      $("#draggable-container")
        .draggable({
          handle: "#draggable-handle",
          drag: saveState,
        })
        .resizable({
          handles: "all",
          resize: saveState,
        });
    });
  })(jQuery);

  document.addEventListener("keydown", (event) => {
    const key = event.key;
    switch (key) {
      case "z":
        container.style.visibility =
          container.style.visibility === "hidden" ? "visible" : "hidden";
        saveState();
        break;

      case "ArrowLeft":
        updatePage((p) => p - 1);
        break;

      case "ArrowRight":
        updatePage((p) => p + 1);
        break;

      case "f":
        scrollToLastPage = !scrollToLastPage;
        saveState();
        break;
    }
  });

  refreshMessages(updateUI);
  setInterval(() => {
    refreshMessages(updateUI);
  }, 1000);
})();
