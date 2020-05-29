import csv
import os
import json

dir = os.path.dirname(__file__)

nodelist = []
linklist = []
link_to_value = dict()

with open(os.path.join(dir, '..','2019-Oct', 'furniture-living_room-sofa.json'), 'r') as created_file, open(os.path.join(dir, 'furniture-living_room-sofa.json'), 'r') as reference_file:
    print(dir)
    created_data = json.load(created_file)
    for node in created_data['nodes']:
        nodelist.append(node['id'])
    print("nodelist size: ", len(nodelist))

    ref_data = json.load(reference_file)
    for node in ref_data['nodes']:
        if node['id'] in nodelist:
            nodelist.remove(node['id'])
        else:
            print('node not in list')
    print("nodelist size: ", len(nodelist))


    for link in created_data['links']:
        linktext = link['source'] + '-' + link['target']
        linklist.append(linktext)
        link_to_value[linktext] = link['value']
    
    print("linklist size: ", len(linklist))

    for link in ref_data['links']:
        linktext = link['source'] + '-' + link['target']
        if linktext in linklist:
            linklist.remove(linktext)
        else:
            print('link not in list')

        if link_to_value[linktext] == link['value']:
            error_string = 'values: ' + str(link_to_value[linktext]) + ' vs ' + str(link['value'])
            print(error_string)
    print("linklist size: ", len(linklist))