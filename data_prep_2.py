import csv
import os
import json

#creates a 13 MB csv file that contains only entries from customers with >= min_occurences in electronics.smartphone

#adjust following 3 parameters
min_occurences = 2
max_occurences = 5
category = 'furniture.living_room.sofa' #keep consistent with other files
max_customers = 10000

counts = dict()
customer_list = []
dir = os.path.dirname(__file__)
replaced_category = category.replace('.', '-')
input_file_name = '2019-Oct-' + replaced_category + '.csv'
output_file_name = '2019-Oct-' + replaced_category + '-final.csv'

with open(os.path.join(dir, '..','2019-Oct', input_file_name), 'r') as inputfile, open(os.path.join(dir, '..','2019-Oct', output_file_name), 'w', newline='') as outputfile:
    #can't convert inputfile to list, since it causes a memory error

    # count the number of occurences for every customer
    for row in csv.reader(inputfile):
        if (row[7] in counts):
            counts[row[7]] = counts[row[7]] + 1
        else:
            counts[row[7]] = 1
    print("finished part 1")

    # sort by number of entries and only add ones with >= min_occurences and <= max_occurences
    num_users = 0
    for w in sorted(counts, key=counts.get, reverse=False):
        if num_users >= max_customers or counts[w] >= max_occurences:
            break
        if min_occurences <= counts[w]:
            customer_list.append(w)
            num_users += 1
            print(str(w) + ": " + str(counts[w]))
    print(len(customer_list))
    print('start writing csv file ...')

    # only write rows into new csv that contain one of the customers in customer_list
    inputfile.seek(0)
    writer = csv.writer(outputfile)
    for row in csv.reader(inputfile):
        if (row[7] in customer_list):
            writer.writerow(row)
    print("finished part 3")
print("finished")    

# for smartphone category:
# results in 93129 rows with 500 min_occurences and infinite max_occurences
# results in 68471 rows with 600 min_occurences and infinite max_occurences
# results in 23828 rows with 1000 min_occurences and infinite max_occurences