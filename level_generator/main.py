import random

class LabyrinthTile:
	def __init__(self, tileType, direction_to_parent = None):
		self.tileTitle = tileType
		self.nextTiles = [None, None, None, None]
		self.direction_to_parent = direction_to_parent

#### Config
## initial
CAN_INITIAL_OVERLAP_ITSELF = True
initial_size = [10, 12]

## dead_ends
add_dead_end_quantity = [2, 4]
add_dead_end_size = [3, 7]

## files
level_quantity_to_generate = 10

##future ideas list :
# in initial, bias towards going in front of last move, to cover greater distances, not circling around

# in add dead ends, add number x of branches each of size y approximately
# in dead end add at random elements of the tree until expected number
# in dead end, limit the number of input/output to 3


#### functions
def get_new_random_direction_that_is_not_the_previous_direction(previous_move):
	new_direction = random.randint(0, 3)
	if new_direction == (previous_move + 2) % 4:
		result = get_new_random_direction_that_is_not_the_previous_direction(previous_move)
	else:
		result = new_direction
	return result

def add_to_path_recursive(previous_move, current_labyrinth, left_size, tileType):
	# Depth-first: keep extending one branch until the target size is reached.
	# The path only grows on empty slots and avoids immediately going backwards.
	if left_size <= 0:
		return

	possible_directions = []
	for direction in range(4):
		if direction == (previous_move + 2) % 4:
			continue
		if current_labyrinth.nextTiles[direction] is None:
			possible_directions.append(direction)

	if len(possible_directions) == 0:
		return

	new_direction = random.choice(possible_directions)
	current_labyrinth.nextTiles[new_direction] = LabyrinthTile(tileType, (new_direction + 2) % 4)
	add_to_path_recursive(new_direction, current_labyrinth.nextTiles[new_direction], left_size - 1, tileType)

def get_initial_labyrinth():
	result = LabyrinthTile("first_tile")  # initial starts at top
	initial_size_selected = random.randint(initial_size[0], initial_size[1])

	result.nextTiles[0] = LabyrinthTile("winning_path", 2)
	add_to_path_recursive(0, result.nextTiles[0], initial_size_selected, "winning_path")

	# return [[[[[], None, None, None], None, None, None], None, None, None], None, None, None]
	return result

def add_dead_ends(initial_labyrinth):
	quantity_to_add = random.randint(add_dead_end_quantity[0], add_dead_end_quantity[1])

	def get_all_tiles(root_tile):
		result = [root_tile]
		for next_tile in root_tile.nextTiles:
			if isinstance(next_tile, LabyrinthTile):
				result.extend(get_all_tiles(next_tile))
		return result

	for _ in range(quantity_to_add):
		# Recompute candidates each time so newly created dead ends can also be picked.
		all_tiles = get_all_tiles(initial_labyrinth)
		random.shuffle(all_tiles)

		start_tile = None
		start_direction = None
		for tile in all_tiles:
			free_directions = []
			for direction_index, next_tile in enumerate(tile.nextTiles):
				if next_tile is not None:
					continue
				if tile.direction_to_parent is not None and direction_index == tile.direction_to_parent:
					continue
				free_directions.append(direction_index)
			if len(free_directions) > 0:
				start_tile = tile
				start_direction = random.choice(free_directions)
				break

		# No available slot left in the labyrinth: stop early.
		if start_tile is None or start_direction is None:
			break

		branch_size = random.randint(add_dead_end_size[0], add_dead_end_size[1])
		start_tile.nextTiles[start_direction] = LabyrinthTile("dead_end", (start_direction + 2) % 4)
		add_to_path_recursive(start_direction, start_tile.nextTiles[start_direction], branch_size - 1, "dead_end")

	return initial_labyrinth

def get_formatted_recursive_labyrinth(current_indent, level_content):
	if not isinstance(level_content, LabyrinthTile):
		return current_indent + "null"

	child_indent = current_indent + "    "
	formatted_directions = []
	for direction_index in range(4):
		direction = level_content.nextTiles[direction_index]
		formatted_directions.append(
			get_formatted_recursive_labyrinth(child_indent, direction)
		)

	return current_indent + "new labyrinthTile([\n" + ",\n".join(formatted_directions) + "\n" + current_indent + "])"

def save_level(level_content, level_name):
	# todo : save like a pickle object or something
	# temp way of saving the result
	initial_str = "import {labyrinthTile} from './labyrinthTile.js'; \n\nexport const entryPoint = "

	result_str = (initial_str + get_formatted_recursive_labyrinth("", level_content) + "\n")

	with open("result/" + level_name + ".js", "w", encoding = "utf-8") as file:
		file.write(result_str)

def generate_one_level(level_name):
	print('==> Now generating level {}'.format(level_name))
	# to generate  a labyrinth :

	# start to finish, initially one path exactly, (not overlapping itself ? could add difficulty)
	initial_labyrinth = get_initial_labyrinth()

	# then create other branching, dead ends
	final_labyrinth = add_dead_ends(initial_labyrinth)

	# save level
	save_level(final_labyrinth, level_name)

#### main code

for i in range(level_quantity_to_generate):
	generate_one_level("level_" + (str(i).zfill(5)))
