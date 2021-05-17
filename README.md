# Manual levelgeneration

> **Note:** The Level parser in `parser` is irrelevant now since the leveleditor now directly creates valid json levels. 
> It is still there for a later implementation of a level converter (AB ↔ SB)

## Create the Level

1.  Open the index.html in your webbrowser
2.  (Optional) paste the json of a level you want to customize into the text field and press `render/revert`
3.  Create the level you want (x axis starts at the very left side and ends at the very right side) you can put the birds where you want as they will moved to the correct point anyways
4.  Click save and save the level to a folder (for example the `custom_levels` folder in `bambirds/game/Levels`)

## Hints for manual editing
*  Click and press up arrow and down arrow key for zooming
*  del for deleting blocks, birds or pigs
*  follow hints in editor
*  Not all AngryBirds blocks are supported yet, see below

## Transformation Values for editing .json level files
Assuming the x-value for a block in the LevelN-N.json is called *json.x*, and the x-value of the MBR-vision-module is called *mbr.x*, the formula for transforming json.x to mbr.x is: `mbr.x = json.x * 5 + 14`

If you want to edit the manually generated level and change the x- and y-values so that the block in the .json file is in some specific location for the agent to recognize (e.g. json.x=50 equals mbr.x=264), you can manually edit those values according to the formula above.

Remember that mbr.x (and mbr.y) marks the x-value (and y-value) of the *upper left corner* of the block. The RealShape vision module however returns the *center-values* of each block. 

With the y-values, it's a bit more difficult, since there might be blocks underneath the block that *lower* mbr.y. The baseline (ground line of the level) in the vision-module is 385. Each block-y-value (let that be json.y, e.g. 4 on a vertically aligned WOOD_BLOCK_4X1) **lowers the baseline by 5**, so, the higher the block is, the lower the number gets. A vertically aligned WOOD_BLOCK_10X1 has a mbr.y of 335 (`385 - 5 * json.y = mbr.y`), while a vertically aligned WOOD_BLOCK_4X1 has a mbr.y of 365.

## Possible things to add
*  all blocks out of **stone**, **ice**, **wood**, **static breakable structure** as well as **terrain** are possible to use (longest breakable structure block is converted to terrain in the levelgenerator as it does not exist in the newer version. All currently not configured blocks are uncommented in `js/blocks.js` so that they are not accidentally used)
*  **all pigs** can be used
*  **all birds** can be used
*  Converter from and to **ScienceBirds** level files

*if you need other things I can add them to the generator as long as they are available in ScienceBirds or the AngryBirds Chrome Version*