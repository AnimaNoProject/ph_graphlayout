import csv
import os

#CAREFUL, THIS CREATES A ~1.6 GB CSV FILE 
#creates a csv in current_directory/../2019-Oct/ with only entries containing electronics.smartphone as category
#csv input file path: current_directory/../2019-Oct/2019-Oct.csv

dir = os.path.dirname(__file__)
i = 0
j = 0
with open(os.path.join(dir, '..','2019-Oct','2019-Oct.csv'), 'r') as inputfile, open(os.path.join(dir, '..','2019-Oct','2019-Oct-electronics-smartphone.csv'), 'w', newline='') as outputfile:
    writer = csv.writer(outputfile)
    for row in csv.reader(inputfile):
        #since this process takes a while the following lines create an output every 1mil rows to show the program didn't crash
        #remove these lines if that is not necessary
        i += 1
        if i % 1000000 == 0:
            j += 1
            print(j)
        #end of output part
        if (row[4].startswith('electronics.smartphone')):
            writer.writerow(row)
