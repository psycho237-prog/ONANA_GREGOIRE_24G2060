import pdfplumber
import json
import re
import random
import os

def extract_students(pdf_path):
    students = []
    print(f"Opening {pdf_path}...")
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            print(f"Processing page {i+1}/{len(pdf.pages)}...")
            table = page.extract_table()
            
            if not table:
                # Fallback to text extraction if no table is found
                text = page.extract_text()
                if text:
                    # Regex to find: Name (Uppercase) followed by email
                    # Assuming format: ... NAME SURNAME email@domain ...
                    # This is trickier but let's try to find patterns
                    matches = re.findall(r'([A-Z\s]{5,})\s+([a-zA-Z0-9._%+-]+@facsciences-uy1\.cm)', text)
                    for match in matches:
                        name = match[0].strip()
                        email = match[1].strip()
                        # Clean name: remove noise like "NOM & PRÉNOM" or department codes
                        if name not in ["NOM & PRÉNOM", "FILIÈRE", "MATRICULE", "E-MAIL"]:
                             # Remove leading/trailing numbers or codes if they got caught
                            name = re.sub(r'^\d+\s+[A-Z]{3}\s+', '', name)
                            students.append({"name": name, "email": email})
                continue

            # Process table rows
            for row in table:
                # Based on structure: [N°, Filière, Matricule, Nom & Prénom, E-mail]
                # Filter out header rows
                if not row or len(row) < 5: continue
                
                name = row[3] # Nom & Prénom
                email = row[4] # E-mail
                
                if name and email and "@" in email:
                    name = name.strip()
                    email = email.strip()
                    
                    # Ignore headers
                    if name in ["NOM & PRÉNOM", "NOM ET PRENOM"] or email == "E-MAIL":
                        continue
                    
                    # Clean up: sometimes codes get mixed in if columns are merged
                    # But if we have a table, row[3] should be just the name.
                    students.append({"name": name, "email": email})

    # Final cleanup: remove duplicates and bad entries
    unique_students = {}
    for s in students:
        if s["email"] not in unique_students:
            # Basic validation: name should be mostly uppercase and not just a code
            if len(s["name"]) > 3 and not s["name"].isdigit():
                unique_students[s["email"]] = s

    final_list = list(unique_students.values())
    
    # Shuffle the list to mix names (avoid all "A" names at the start)
    random.shuffle(final_list)
    
    return final_list

if __name__ == "__main__":
    pdf_file = "../FAC SCIENCES 2024-2025 - E-Mails.pdf"
    if not os.path.exists(pdf_file):
        # Try local path
        pdf_file = "FAC SCIENCES 2024-2025 - E-Mails.pdf"
        
    if os.path.exists(pdf_file):
        students = extract_students(pdf_file)
        with open("students.json", "w", encoding="utf-8") as f:
            json.dump(students, f, indent=2, ensure_ascii=False)
        print(f"Successfully extracted {len(students)} students to students.json")
    else:
        print(f"Error: {pdf_file} not found.")
