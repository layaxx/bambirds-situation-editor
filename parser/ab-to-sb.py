from xml.dom import minidom
import os
import json

__dir_path__ = os.path.dirname(os.path.abspath(__file__))

object_mapping = {}
with open(__dir_path__+"/ABSB.json", "r") as file:
  object_mapping = json.load(file)

def coordinateMapping(ab_coords):
  x, y = ab_coords
  return (x/4.7) - 9, (1-y/4.7) - 4.5

def generate_science_birds_XML(ab_json_path, sb_xml_path):
  with open(ab_json_path, "r") as file:
    ab_json = json.load(file)
  root = minidom.Document()

  ab_castle_camera = list(filter(lambda s: s["id"] == "Castle", ab_json["camera"]))[0]
  ab_slingshot_camera = list(filter(lambda s: s["id"] == "Slingshot", ab_json["camera"]))[0]
  level = root.createElement('Level')
  level.setAttribute("width", str(round((ab_castle_camera["right"] - ab_slingshot_camera["left"]) /20)))
  root.appendChild(level)

  camera = root.createElement('Camera')
  camera.setAttribute("x", "0")
  camera.setAttribute("y", "2")
  camera.setAttribute("minWidth", str(round((ab_slingshot_camera["right"] - ab_slingshot_camera["left"])/3.5)))
  camera.setAttribute("maxWidth", str(round((ab_castle_camera["right"] - ab_slingshot_camera["left"])/3.5)))
  level.appendChild(camera)

  score = root.createElement('Score')
  # score.setAttribute("highScore", str(ab_json["scoreGold"]))
  score.setAttribute("highScore", str(0))
  level.appendChild(score)

  birds = root.createElement('Birds')
  level.appendChild(birds)

  for bird_id in range(ab_json["counts"]["birds"]):
    # Ids start at 1
    bird_id += 1
    bird_object = ab_json["world"][f"bird_{bird_id}"]
    mapped_bird_object = object_mapping[bird_object["id"]]
    bird = root.createElement(mapped_bird_object["element"])
    bird.setAttribute("type", mapped_bird_object["type"])
    birds.appendChild(bird)

  # The coordinates of the slingshot depend on the coordinates of the first bird
  ab_slingshot_info = ab_json["world"]["bird_1"]
  mapped_slingshot_coords = coordinateMapping((ab_slingshot_info["x"], ab_slingshot_info["y"] - 4))
  slingshot = root.createElement('Slingshot')
  slingshot.setAttribute("x", str(round(mapped_slingshot_coords[0], 4)))
  slingshot.setAttribute("y", str(round(mapped_slingshot_coords[1], 4)))
  level.appendChild(slingshot)

  objects = root.createElement('GameObjects')
  level.appendChild(objects)

  for block_id in range(ab_json["counts"]["blocks"]):
    # Ids start at 1
    block_id += 1
    block_object = ab_json["world"][f"block_{block_id}"]
    mapped_block_object = object_mapping.get(block_object["id"], None)
    if not mapped_block_object:
      print("WARN: Object", block_object, "could not be mapped")
      continue
    elif mapped_block_object["element"] == "Platform":
      block = root.createElement(mapped_block_object["element"])
      block.setAttribute("material", mapped_block_object["material"])
      block.setAttribute("type", mapped_block_object["type"])
      block.setAttribute("rotation", str(round(360 - block_object["angle"], 4)))
      # TODO: move middle point
      mapped_coordinates = coordinateMapping((block_object["x"], block_object["y"]))
      block.setAttribute("x", str(round(mapped_coordinates[0], 4)))
      block.setAttribute("y", str(round(mapped_coordinates[1], 4)))
      block.setAttribute("scaleX", str(round(mapped_block_object["width"] * 0.32, 4)))
      block.setAttribute("scaleY", str(round(mapped_block_object["height"] * 0.32, 4)))
      objects.appendChild(block)
    else:
      block = root.createElement(mapped_block_object["element"])
      block.setAttribute("material", mapped_block_object["material"])
      block.setAttribute("type", mapped_block_object["type"])
      block.setAttribute("rotation", str(round(360 - block_object["angle"], 4)))
      # TODO: move middle point
      mapped_coordinates = coordinateMapping((block_object["x"], block_object["y"]))
      block.setAttribute("x", str(round(mapped_coordinates[0], 4)))
      block.setAttribute("y", str(round(mapped_coordinates[1], 4)))
      objects.appendChild(block)

  xml_str = root.toprettyxml(indent="  ", encoding="utf-16") 
    
  with open(sb_xml_path, "wb") as f:
    f.write(xml_str) 
  

def absoluteFilePaths(directory):
   for dirpath,_,filenames in os.walk(directory):
       for f in filenames:
           yield os.path.abspath(os.path.join(dirpath, f))

def parseLevels(input_path, output_path):
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
    output_files = [path.replace(input_path,output_path).replace(".json", ".xml") for path in input_files]
  

  for input_file, output_file in zip(input_files, output_files):
    print(f"Parsing {input_file} to {output_file}")
    generate_science_birds_XML(input_file, output_file)


if __name__ == "__main__":
  import argparse

  parser = argparse.ArgumentParser()
  parser.add_argument('-i','--input', type=os.path.abspath, default=os.path.join(__dir_path__,'levelsToParse'), help="Input json or directory where input jsons are saved")
  parser.add_argument('-o','--output', type=os.path.abspath,  default=os.path.join(__dir_path__,'parsedLevels'), help="Output json or directory where parsed jsons are saved")
  parser.add_argument('-c', '--clean', action='store_true', default=False, help="Remove Starting Pig And Wood blocks")

  args = parser.parse_args()
  parseLevels(args.input,args.output)