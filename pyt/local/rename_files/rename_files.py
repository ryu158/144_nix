import os
import shutil
import re

src_folder = r'C:\test\a\PA35_AEliT4_260629_1730'
pre_fix = ""
data_type = ".int"
out_data_type = ".int"
dst_name = 'Merged_' + os.path.basename(os.path.normpath(src_folder))

def extract_date(text):
    # 1. Find all potential matches in the string
    # Pattern 1: YYYY-MM-DD
    # Pattern 2: _6digits_ 
    # Pattern 3: _4digits_
    # We use | (OR) to find them all in one pass
    all_matches = re.findall(r'(\d{4}-\d{2}-\d{2})|_(\d{6})_|(\d{4})', text)
    # all_matches = re.findall(r'(\d{4}-\d{2}-\d{2})|_(\d{6})_|_(\d{4})_', text)
    
    if not all_matches:
        return "0000"

    # 2. Get the very last match found
    last_match = all_matches[-1]
    
    # findall with groups returns a tuple (m8, m6, m4)
    # We check which group in the tuple is not empty
    m8, m6, m4 = last_match
    
    if m8:
        return m8.replace('-', '')
    if m6:
        return m6[-4:]
    if m4:
        return m4

    return "0000"

def extract_slot_site(text):
    slot = re.search(r'slot[_\-]?(\d+)', text, re.IGNORECASE)
    site = re.search(r'site[_\-]?(\d+)', text, re.IGNORECASE)

    slot_val = f"S{int(slot.group(1)):02d}" if slot else None
    site_val = f"{int(site.group(1)):03d}" if site else None

    return slot_val, site_val

def extract_wafer(root, name):
    parts = root.split(os.sep)
    parts.append(name)

    for part in reversed(parts):
        part_upper = part.upper()

        if part_upper.endswith("_STD") or part_upper == "STD":
            return "STD"

        if part_upper.endswith("_WRM") or part_upper == "WRM":
            return "WRM"

    return "UNK"

def Rename_file_summary(src_folder, dst_folder_name, input_type='.csv', output_type='.csv'):
    clean_src = os.path.abspath(src_folder)
    prt_folder = os.path.dirname(clean_src)
    dst_folder = os.path.join(prt_folder, dst_folder_name)
    dup_folder = os.path.join(prt_folder, f"{dst_folder_name}_dup")

    os.makedirs(dst_folder, exist_ok=True)
    os.makedirs(dup_folder, exist_ok=True)

    slot_map = {
        "Ox20A": "Slot01", "Ox60A": "Slot02", "Ox100A": "Slot03",
        "Ox300A": "Slot04", "Ox500A": "Slot05", "Ox1kA": "Slot06",
        "Ox3kA": "Slot07", "Ox5kA": "Slot08", "Ox9kA": "Slot09",
        "Nit40A": "Slot10", "Nit100A": "Slot11",
        "Nit200A": "Slot12", "Nit500A": "Slot13",
        "NO30A": "Slot14", "NO100A": "Slot15"
    }

    for root, dirs, files in os.walk(clean_src):
        depth = root.replace(clean_src, '').count(os.sep)
        print(f"[Depth {depth}] Exploring: {root}")

        for file in files:
            if not file.lower().endswith(input_type):
                continue
            if not dirs and not files:
                print("  (Empty or restricted folder)")

            else:
                full_path = os.path.join(root, file)
                name, ext = os.path.splitext(file)
                full_text = f"{root} {name}"

                # ===== 장비 / 설정 =====
                equip = re.search(r'JEP\d+', full_text, re.IGNORECASE)
                mns = re.search(r'MNS\d+', full_text, re.IGNORECASE)

                equip = equip.group(0).upper() if equip else "JEPXX"
                mns = mns.group(0).upper() if mns else "MNSXX"

                # ===== wafer =====
                wafer = extract_wafer(root, name)

                # ===== 날짜 =====
                date = extract_date(full_text)

                # ===== Slot / Site =====
                slot, site = extract_slot_site(name)

                if not slot or not site:
                    slot2, site2 = extract_slot_site(full_text)
                    slot = slot or slot2
                    site = site or site2

                # ⭐ 핵심: Slot 없을 때만 매핑 적용
                if not slot:
                    full_text_upper = full_text.upper().replace("_", "").replace("-", "")
                    for key, val in slot_map.items():
                        key_norm = key.upper().replace("_", "").replace("-", "")
                        if key_norm in full_text_upper:
                            slot = val
                            break

                # fallback
                if not slot:
                    slot = "Slot00"
                if not site:
                    site = "Site001"

                # ===== 파일명 =====
                new_name = f"{pre_fix}{slot}_{site}" + output_type
                # new_name = f"AEliT#3_{date}_{slot}_{site}" + output_type
                # new_name = f"{equip}_{mns}_{date}_{wafer}_{slot}_{site}" + output_type   

                dst_path = os.path.join(dst_folder, new_name)

                # ===== 중복 → 하나의 폴더 =====
                if os.path.exists(dst_path):
                    dst_path = os.path.join(dup_folder, new_name)

                shutil.copy2(full_path, dst_path)

                print(f"[복사 완료] {full_path} → {dst_path}")


Rename_file_summary(src_folder, dst_name, data_type, out_data_type)


