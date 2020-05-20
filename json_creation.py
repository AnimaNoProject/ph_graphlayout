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

tmpstring = ''
data = dict()
data['nodes'] = []
data['links'] = []
product_count = dict()
product_brand = dict()
link_count = dict() #contains links in the format 'smaller_product_id-larger_product_id' i.e. 123-456
user_to_product = defaultdict(set)
dir = os.path.dirname(__file__)
with open(os.path.join(dir, '..','2019-Oct','2019-Oct-final.csv'), 'r') as inputfile, open(os.path.join(dir, '..','2019-Oct','data.json'), 'w') as outputfile:
    for row in csv.reader(inputfile):
        user_to_product[row[7]].add(row[2])

        #associate product_id with its number of occurence (for node size)
        if (row[2] in product_count):
            product_count[row[2]] = product_count[row[2]] + 1
        else:
            product_count[row[2]] = 1

        #associate product_id with brand name (for node group)
        if (row[2] not in product_brand):
            product_brand[row[2]] = row[5]

    print('finished csv read')

    for product in product_count: #can also be 'in product_brand' since both have the same keys 
        data['nodes'].append({'id': product, 'group': product_brand[product], 'size': product_count[product]})

    print('finished data[node] creation')

    for user in user_to_product:
        for ids in permutations(user_to_product[user], 2):
            # create ids into link-string
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

    print('finished link_count')

    #link_count = dict(sorted(link_count.items()))
    #for link in link_count:
    #    print(link, ': ', link_count[link])
    #print(len(link_count))

    for link in link_count:
        data['links'].append({'source': link.split('-')[0], 'target': link.split('-')[1], 'size': link_count[link]})
    
    print('finished data[links] creation')

    json.dump(data, outputfile)

print('finished')
print('number of nodes: ', len(data['nodes']))
print('number of links: ', len(data['links']))

'''
for user in user_to_product:
    print(user)
    for product in user_to_product[user]:
        print(product)
'''
'''
for product in product_count:
    print(product, ": ", product_count[product])
'''
#for each row
    #add product_id to user if not alrady in it
    #increase product_id count by 1