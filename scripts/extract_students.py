import re
import json

def extract_data(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract names (lines with numbers like 160-230)
    # The format seems to be: N° followed by names, then later emails.
    # Actually, let's just find all patterns that look like names (UPPERCASE) 
    # and all patterns that look like emails.
    
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@facsciences-uy1\.cm', content)
    
    # For names, it's harder because they are just uppercase lines.
    # But looking at the file, they are often in blocks.
    # Let's try to find names by looking for lines that are all uppercase and 3+ words.
    lines = content.splitlines()
    names = []
    for line in lines:
        line = line.strip()
        if line.isupper() and len(line.split()) >= 2 and not line.startswith('FAC') and not line.startswith('MATRICULE'):
            # Filter out some headers
            if line not in ['N°', 'E-MAILS', 'FILIÈRE', 'MATRICULE', 'NOM & PRÉNOM', 'E-MAIL']:
                names.append(line)
    
    # Pair them (assuming they are in the same order and count)
    # We might have more names or emails depending on headers.
    # Let's use the first N where they match.
    count = min(len(names), len(emails))
    students = []
    for i in range(count):
        students.append({"name": names[i], "email": emails[i]})
    
    return students

if __name__ == "__main__":
    students = extract_data('emails.txt')
    with open('student-sentiment-app/scripts/students.json', 'w', encoding='utf-8') as f:
        json.dump(students, f, indent=2, ensure_ascii=False)
    print(f"Extracted {len(students)} students.")
