# Manual levelgeneration

## Installation beforehand

Make sure you have python3 installed on your computer

## Create the Level

1.  Open the index.html in your webbrowser
2.  Create the level you want (x axis starts at the very left side and ends at the very right side) you can put the birds where you want as they will moved to the correct point anyways
3.  Click save and save the level to a folder
4.  Run Parser.py and with 
6.  If you did not change the structure of the output-file to the directory (json directory) where you run your file (if you run the game in slingshot this would be in `cors/fowl/json/`), copy the file now in this directory
7.  Run Angrybirds (now you should see the new level you just created)

## Hints for manual editing
*  Click and press up arrow and down arrow key for zooming (if you arrange the things in the zoomed in mode you need to look into the Parser.py and remove the *91 as mentioned in the comment and do not put stuff at the very left then) 
*  del for deleting blocks, birds or pigs
*  follow hints in editor
*  the parser removes the blocks and pig that are already in the editor so no need to remove that. If you do not want the birds as well you can let the parser remove them by using the lines that are currently in a comment.

## Transformation Values for editing .json level files
Assuming the x-value for a block in the LevelN-N.json is called *json.x*, and the x-value of the MBR-vision-module is called *mbr.x*, the formula for transforming json.x to mbr.x is: `mbr.x = json.x * 5 + 14`

If you want to edit the manually generated level and change the x- and y-values so that the block in the .json file is in some specific location for the agent to recognize (e.g. json.x=50 equals mbr.x=264), you can manually edit those values according to the formula above.

Remember that mbr.x (and mbr.y) marks the x-value (and y-value) of the *upper left corner* of the block. The RealShape vision module however returns the *center-values* of each block. 

With the y-values, it's a bit more difficult, since there might be blocks underneath the block that *lower* mbr.y. The baseline (ground line of the level) in the vision-module is 385. Each block-y-value (let that be json.y, e.g. 4 on a vertically aligned WOOD_BLOCK_4X1) **lowers the baseline by 5**, so, the higher the block is, the lower the number gets. A vertically aligned WOOD_BLOCK_10X1 has a mbr.y of 335 (`385 - 5 * json.y = mbr.y`), while a vertically aligned WOOD_BLOCK_4X1 has a mbr.y of 365.

## Possible things to add
*  all blocks out of **stone**, **ice**, **wood**, **static breakable structure** as well as **terrain** are possible to use (longest breakable structure block is converted to terrain in the levelgenerator as it does not exist in the newer version)
*  **all pigs** can be used
*  **all birds** can be used

*if you need other things I can add them to the generator as long as they are available in our version*