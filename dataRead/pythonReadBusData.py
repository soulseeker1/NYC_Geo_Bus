import csv

def read_first_100_lines(csv_file):
    with open(csv_file, 'r', newline='') as file:
        reader = csv.reader(file)
        lines = []
        for i, row in enumerate(reader):
            if i >= 100:
                break
            lines.append(row)
    return lines

# Replace 'your_file.csv' with the path to your CSV file
csv_file = 'C:/Users/common/Documents/archive/mta_1706.csv'
first_100_lines = read_first_100_lines(csv_file)

for line in first_100_lines:
    print(line)