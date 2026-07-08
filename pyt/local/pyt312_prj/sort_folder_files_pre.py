import os
import shutil

#src_root = r"D:\Raw_Data\SKH JEP\WRM TTTM\20260402\JEP2"

def sort_folder_files (src_root):
    dst_root = os.path.join(src_root, "Total")
    csv_root = os.path.join(src_root, "Total_csv")
    root_name = os.path.basename(src_root)

    os.makedirs(dst_root, exist_ok=True)
    os.makedirs(csv_root, exist_ok=True)

    for root, dirs, files in os.walk(src_root):
        for file_name in files:
            if file_name.lower().endswith(".int"):

                src_file = os.path.join(root, file_name)

                # SlotXX 추출
                parts = root.split(os.sep)
                slot_name = None
                for p in parts:
                    if p.startswith("Slot"):
                        slot_name = p
                        break

                if slot_name is None:
                    continue

                # ===== slot_name 처리 =====
                slot_parts = slot_name.split()
                selected_slot_name = slot_parts[0]

                # ===== file_name 처리 =====
                file_base, ext = os.path.splitext(file_name)
                file_parts = file_base.split()

                # 첫 번째 토큰 (공정명)
                selected_file_name = file_parts[0]

                # ===== 최종 파일명 =====
                #new_name = f"{root_name}_{selected_slot_name}_{selected_file_name}{ext}"
                #new_cvs_name = f"{root_name}_{selected_slot_name}_{selected_file_name}.csv"
                new_name = f"{selected_slot_name}_{selected_file_name}{ext}"
                new_cvs_name = f"{selected_slot_name}_{selected_file_name}.csv"
                dst_file = os.path.join(dst_root, new_name)
                csv_file = os.path.join(csv_root, new_cvs_name)

                shutil.copy2(src_file, dst_file)
                print(f"Copy: {src_file} -> {dst_file}")
                shutil.copy2(src_file, csv_file)
                print(f"Copy: {src_file} -> {csv_file}")

    print("완료")

# src_root = r"D:\Raw_Data\SKH JEP\WRM TTTM\20260415\#2_Intensity Spectrum_0415_Slot selection\WRM MNS10\0330"
# sort_folder_files(src_root)
