# Situation Editor + CBR Visualization

## How to use

0. Run `yarn install`

- Run `yarn build` and start a web server in this directory OR
- Run `yarn start`

1. Open the index.html in your browser (<http://localhost:7000> if you used `yarn start`)
2. (Optional) paste the situation of a level you want to customize into the text field select any other element
3. Create the level you want (x axis starts at the very left side and ends at the very right side, y axis starts with 0 at the top)
4. Click save changes and you can copy the results from the second text field
5. At any point, you can click on the Analyze Cases Button in order to test which cases from the currently loaded DB can be applied to the current situation

## Hints for manual editing

Controls are described on the page.

Note that Browser shortcuts such as `Ctrl + R` for reload or `F12` for dev tools may not work unless on of the input fields is selected, due to global event listeners.

## Future Development

### Known Bugs

- scaling of multiple objects does not work well when used with multiplier (Ctrl key)

### Possible new Features

- Allow adding new Objects (not just duplicating existing objects)
- Maybe scaling should be applied and reset when deselecting objects?
- Case Based Reasoning Visualizations:
  - Edit cases
