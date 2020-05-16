import csv
import os
import json

#creates a 13 MB csv file that contains only entries from customers with >= 500 occurences in electronics.smartphone

counts = dict()
customer_list = []
dir = os.path.dirname(__file__)
with open(os.path.join(dir, '..','2019-Oct','2019-Oct-electronics-smartphone.csv'), 'r') as inputfile, open(os.path.join(dir, '..','2019-Oct','2019-Oct-final.csv'), 'w', newline='') as outputfile:
    #can't convert inputfile to list, since it causes a memory error

    # count the number of occurences for every customer
    for row in csv.reader(inputfile):
        if (row[7] in counts):
            counts[row[7]] = counts[row[7]] + 1
        else:
            counts[row[7]] = 1
    print("finished part 1")

    # sort by number of entries and only add ones with >= 500 occurences
    for w in sorted(counts, key=counts.get, reverse=True):
        if(counts[w] < 500):
            break
        customer_list.append(w)
    print("finished part 2")

    # only write rows into new csv that contain one of the customers in customer_list
    inputfile.seek(0)
    writer = csv.writer(outputfile)
    for row in csv.reader(inputfile):
        if (row[7] in customer_list):
            writer.writerow(row)
    print("finished part 3")
print("finished")    

# results in 93129 rows