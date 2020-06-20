import json
import re
import math
from slpp import slpp
from pprint import pprint

import os

__dir_path__ = os.path.dirname(os.path.abspath(__file__))
 
prefile = os.path.join(__dir_path__,'partjson.json')
dictionaryPath = os.path.join(__dir_path__,'Dictionary.json')

def absoluteFilePaths(directory):
   for dirpath,_,filenames in os.walk(directory):
       for f in filenames:
           yield os.path.abspath(os.path.join(dirpath, f))

def parseLevel(input_path, output_path, removeStartingPigAndWoodblocks = False):
	if os.path.isfile(input_path):
		input_files = [input_path]
	else:
		input_files = [i for i in filter(lambda file: file.endswith('.json'), absoluteFilePaths(input_path))]
	
	if os.path.isfile(output_path) and len(input_files) == 1:
		output_files = [output_path]
		output_path = os.path.abspath(output_path)
	else:
		output_path = os.path.abspath(output_path)
		if os.path.isfile(output_path):
			print("WARN: got input directory but output file. will save to directory of output file")
			output_path = os.path.dirname(output_path)
		output_files = [path.replace(input_path,output_path) for path in input_files]
	print(input_files, output_files)
	
	for input_file, output_file in zip(input_files, output_files):

		print('Parsing', input_file, 'to', output_file)

		with open(input_file) as f:
			levellua = f.read()
		with open(dictionaryPath) as f:
			dictionary = json.load(f)


		worldstart = levellua.find('world = ')
		levellua = levellua[worldstart+8:]
		level = slpp.decode(levellua)

		number = 0
		numberBlock = 0
		x=0
		del level['ground']
		if (removeStartingPigAndWoodblocks):
			level = removePigKingAndWoodsquares(level)


		levelNew = dict()
		for key in level:

			if 'Bird' in key:
				number+=1
				levelNew['bird_'+str(number)]={}
				levelNew['bird_'+str(number)]['angle'] = 0
				levelNew['bird_'+str(number)]['x'] = x
				levelNew['bird_'+str(number)]['y'] = -1.142
				levelNew['bird_'+str(number)]['id'] = dictionary[level[key]['definition']]
				x-=3


			else:
				numberBlock+=1
				levelNew['block_'+str(numberBlock)]={}
				angle = (level[key]['angle'])*180/math.pi
				if angle < 0:
					angle = 360+angle
				levelNew['block_'+str(numberBlock)]['angle'] = angle
				# remove *0.91 if you arrange everything zoomed into the editor
				levelNew['block_'+str(numberBlock)]['x'] = (level[key]['x']*0.91)+52
				levelNew['block_'+str(numberBlock)]['y'] = level[key]['y']*0.91
				levelNew['block_'+str(numberBlock)]['id'] = dictionary[level[key]['definition']]


		with open(prefile) as f:
			levelgeneral = json.load(f)

		levelgeneral['world']=levelNew
		levelgeneral['counts'] = {'birds': number, 'blocks': numberBlock}
		leveljson = json.dumps(levelgeneral)
		file = open(output_file, 'w') # here, you could enter your slingshot/fowl/cors/json folder, in order to inject parsed levels directly
		file.write(leveljson)
		file.close()
		pprint(levelgeneral)

def removePigKingAndWoodsquares(level):
	if 'KingPiglette_1' in level:
		del level['KingPiglette_1']
	if 'WoodBlock9_1' in level:
		del level['WoodBlock9_1']
	if 'WoodBlock9_2' in level:
		del level['WoodBlock9_2']
	# if you do not want the standard birds	use this:
	#if 'YellowBird_1' in level:
		#del level['YellowBird_1']
	#if 'RedBird_1' in level:
		#del level['RedBird_1']
	return level

if __name__ == '__main__':
	import argparse

	parser = argparse.ArgumentParser()
	parser.add_argument('-i','--input', type=os.path.abspath, default=os.path.join(__dir_path__,'levelsToParse'), help="Input json or directory where input jsons are saved")
	parser.add_argument('-o','--output', type=os.path.abspath,  default=os.path.join(__dir_path__,'parsedLevels'), help="Output json or directory where parsed jsons are saved")
	parser.add_argument('-c', '--clean', action='store_true', default=False, help="Remove Starting Pig And Wood blocks")

	args = parser.parse_args()
	parseLevel(args.input,args.output, removeStartingPigAndWoodblocks=args.clean)

						
					
		