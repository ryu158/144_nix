import json
import tkinter as tk
from tkinter import filedialog

def extract_json_values(key_paths, *file_paths):
    if not file_paths:
        root = tk.Tk()
        root.withdraw()
        file_paths = filedialog.askopenfilenames()
        if not file_paths:
            print("No file selected.")
            return []

    all_files_data = []   # ← list per file

    for file_path in file_paths:
        with open(file_path, encoding="utf-8") as f:
            data = json.load(f)

        file_data = []    # ← reset for each file

        for item in data:
            item_values = []
            for path in key_paths:
                value = item
                for key in path.split('.'):
                    value = value[key]
                item_values.append(value)

            file_data.append(item_values)

        all_files_data.append(file_data)

    return all_files_data


if __name__ == "__main__":
    keys_to_extract = [
        "opticalCondition.observable",
        "opticalCondition.incidentWave.wavelength",
        "value"
    ]
    # saved_data = extract_json_values(keys_to_extract, "test2.json", "test2.json")
    saved_data = extract_json_values(keys_to_extract)
    print(saved_data)
