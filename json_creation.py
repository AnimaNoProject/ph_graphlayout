import csv
import os
import json
from collections import defaultdict
from itertools import permutations

#interesting columns:
# 2:product_id, 3:category_id, 4:category_code, 5:brand 7:user_id

# Nodes:
# "id": "Myriel", "group": 1 (size)
# id: product_id, group: brand, size: product_count

# Links:    value probably needs to be size for sigma.js
# "source": "Mme.Magloire", "target": "Mlle.Baptistine", "value": 6
# source: smaller_product_id, target: larger_product_id, value: link_count

#edit following lines for options
category = 'electronics' #keep consistent with other files
use_jaccard = True
attraction_strength = 0.7
attraction_strength_weak = 0.01
repulsion_strength = -300
repulsion_strength_weak = -30
link_opacity = 0.1
node_radius = 5
#end of options

# graph class for CC
class Graph:
    def __init__(self, nodes):
        self.nodes = nodes
        self.V = len(self.nodes)
        self.adj = {}
        for node in nodes:
            self.adj[node] = []

    def addEdge(self, v, w): 
        self.adj[v].append(w) 
        self.adj[w].append(v)
    
    def DFSUtil(self, temp, v, visited): 
        # Mark the current vertex as visited 
        visited[v] = True
  
        # Store the vertex to list 
        temp.append(v) 
  
        # Repeat for all vertices adjacent 
        # to this vertex v 
        for i in self.adj[v]:
            if visited[i] == False: 
                  
                # to reach all nodes indirectly connected to initial one
                temp = self.DFSUtil(temp, i, visited) 
        return temp 

    def connectedComponents(self): 
        visited = dict()
        for node in self.nodes:
            visited[node] = False
        cc = [] 
        for n in self.nodes: 
            if visited[n] == False: 
                temp = [] 
                cc.append(self.DFSUtil(temp, n, visited)) 
        return cc

    def get_max_cc(self):
        ccs = self.connectedComponents()
        max_nodes = []
        for nodes in ccs:
            if len(nodes) > len(max_nodes):
                    max_nodes = nodes
        return max_nodes
    
    # jaccard for edge weights (1 hop, since all graphs are rather dense):
    def get_jaccard(self, node1, node2):
        node1_nodes = len(self.adj[node1]) -1 # -1 for node2
        node2_nodes = len(self.adj[node2]) -1 # -1 for node1
        shared_nodes = 0
        for node in self.adj[node1]:
            if node in self.adj[node2]:
                shared_nodes += 1
        jaccard = (shared_nodes / (node1_nodes + node2_nodes)) * 100
        return jaccard

# end of graph class


    

tmpstring = ''
data = dict()
data['nodes'] = []
data['links'] = []
data['settings'] = []
product_count = dict()
product_brand = dict()
link_count = dict() #contains links in the format 'smaller_product_id-larger_product_id' i.e. 123-456
user_to_product = defaultdict(set)
dir = os.path.dirname(__file__)

replaced_category = category.replace('.', '-')
input_file_name = '2019-Oct-' + replaced_category + '-final.csv'
output_file_name = replaced_category + '.json'

with open(os.path.join(dir, '..','2019-Oct', input_file_name), 'r') as inputfile, open(os.path.join(dir, '..','2019-Oct', output_file_name), 'w') as outputfile:
    for row in csv.reader(inputfile):
        if(row[5] == ''):
            continue
        user_to_product[row[7]].add(row[2])

        #associate product_id with its number of occurence (for node size)
        if (row[2] in product_count):
            product_count[row[2]] = product_count[row[2]] + 1
        else:
            product_count[row[2]] = 1

        #associate product_id with brand name (for node group)
        if (row[2] not in product_brand):
            #if (row[5] == ''):
            #    product_brand[row[2]] = 'no brand'
            #else:
            product_brand[row[2]] = row[5]
        
    print('finished csv read')

    # create graph to get max CC and only add max CC to json
    graph = Graph(product_count.keys())   #works, since for each product (=node) there is an entry

    for user in user_to_product:
        for ids in permutations(user_to_product[user], 2):
            # make ids into link-string
            if (ids[0] < ids[1]):
                tmpstring = '-'.join(ids)
            elif (ids[0] > ids[1]):
                tmpstring = '-'.join(reversed(ids))
            else:
                continue    #not necessary, but for good measure

            # calculate occurences of link
            if (tmpstring in link_count):
                link_count[tmpstring] = link_count[tmpstring] + 1
            else:
                link_count[tmpstring] = 1
                #add edge to graph
                graph.addEdge(ids[0], ids[1])
    print('finished link_count / graph generation')

    # create json file
    max_cc = graph.get_max_cc()
    for node in max_cc:
        data['nodes'].append({'id': node, 'group': product_brand[node]})
    print('finished data[nodes] creation')

    for link in link_count:
        if link.split('-')[0] in max_cc:
            if use_jaccard:
                data['links'].append({'source': link.split('-')[0], 'target': link.split('-')[1], 'value': graph.get_jaccard(link.split('-')[0], link.split('-')[1])}) 
            else:
                data['links'].append({'source': link.split('-')[0], 'target': link.split('-')[1], 'value': link_count[link]}) 
    print('finished data[links] creation')

    data['settings'] = ({'attraction_strength': attraction_strength, 'attraction_strength_weak': attraction_strength_weak, 'repulsion_strength': repulsion_strength, 
    'repulsion_strength_weak': repulsion_strength_weak, 'link_opacity': link_opacity, 'node_radius': node_radius})
    
    print('finished data[settings] creation')

    json.dump(data, outputfile, indent=2)

print('finished')
print('number of nodes: ', len(data['nodes']))
print('number of links: ', len(data['links']))
print(link_count)