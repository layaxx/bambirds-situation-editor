# Situation Editor + CBR Visualization

## How to use

0. Run `yarn install`, only needs to be done once or after changing dependencies
1. Run `yarn start` or `yarn dev`, both are equivalent
2. Open the index.html in your browser (<http://localhost:7000> by default)

## Modules

### Situation Editor

1. (Optional) paste the situation of a level you want to customize into the text field, then select any other element
2. Create the level you want (x axis starts at the very left side and ends at the very right side, y axis starts with 0 at the top)
3. Click save changes and you can copy the results from the second text field
4. [Legacy CBR (quantitative)] At any point, you can click on the Analyze Cases Button in order to test which cases from the currently loaded DB can be applied to the current situation

### Level Overview

<http://localhost:7000/analysis.html> renders every level in the `data\levels` directory. May not be pixel perfect. Immovable and/or unknown objects are rendered black.

### Knowledge

Similar to the default level editor. Allows loading from Situation files or from Levels. Select Objects and press the `generate Predicates` button to print all relations between selected objects to the console, according to the selected Generator.

If the `EOPRA` generator is used, the `EOPRA` zones are rendered around each selected object. Those can be cleared with the `clear overlay` button.

### Analysis

Useful for visualizing runs via their log file, as well as compute statistics about strategies and CBR cases used during one or more runs.

Runs must be in the `data/logs` directory. Each run has its own subdirectory containing (at least) a `client.log` file which includes the log output of the agent. After adding a new run, the dev server needs to be restarted, i.e. the `yarn dev` or `yarn start` process needs to be restarted.

Each run has statistics on top, followed by a chronology. This includes every shot the agent has taken in chronological order. For every shot, the executed strategy as well as all considered strategies are displayed.

When a CBR case was executed and analyzed, this is also present in the chronology. If you want to modify what other events are logged here, you can edit `src\parser\logFile\state.ts` and add something like

```ts
levelTries.at(-1)?.chronology.push({
  type: "string",
  data: "some message here",
})
```

when the new line matches the event

## Hints for manual editing

Controls are described on the page.

Note that Browser shortcuts such as `Ctrl + R` for reload may not work when at least one object is selected.

## Future Development

### Known Bugs

### Possible Future Features

- Allow adding new Objects (not just duplicating existing objects)
- Maybe scaling should be applied and reset when deselecting objects?
- Case Based Reasoning Visualizations:
  - Edit cases
