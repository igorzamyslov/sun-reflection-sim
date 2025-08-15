# Sun Reflection Simulator

This is a 2D web-based application that simulates how sunlight entering a room through windows reflects off a monitor. It allows users to dynamically configure the room layout, window placement, and the position of a monitor and a person to see the resulting light reflections and shadows in real-time.

This entire project was created using the Gemini CLI.

## Features

- **Dynamic Room Configuration:** Set the width and height of the room.
- **Interactive Objects:** 
    - **Windows:** Add, remove, and move windows along all four walls.
    - **Monitor:** Drag to move and use the handle to rotate (snaps to 15-degree increments).
    - **Person:** A draggable head object that casts a shadow.
- **Volumetric Lighting:** Light from windows is rendered as a smooth, volumetric stream.
- **Real-time Shadows:** The monitor and the person cast realistic, soft shadows that update as objects are moved.
- **Real-time Reflections:** The monitor's screen shows a volumetric reflection of the light from the windows.
- **Responsive Design:** The simulation scales to fit your browser window.

## How to Use

1.  Open the `index.html` file in a web browser.
2.  Use the controls on the left to change the room size or add new windows.
3.  Click and drag any object on the canvas to move it.
4.  Click the red handle on the monitor to rotate it.
