from Sort_folder_files_pre import sort_folder_files
import os

src_root = r"Y:\A_Lab 사업부\DA Group\SKH\Signal\original\J2_WRM_MNS1"

# 처리할 날짜 폴더 목록만 작성

dates = [
    '0201',
    '0202',
    '0203',
    '0209',
    '0221',
    '0222',
    '0223',
    '0224',
    '0225',
    '0318',
    '0323',
    '0326',
    '0327',
    '0330',
    '0410',
    '0414',
    '0415']

# dates = [
#     '0201',
#     '0202',
#     '0204',
#     '0206',
#     '0207',
#     '0208',
#     '0210',
#     '0211',
#     '0212',
#     '0213',
#     '0214',
#     '0215',
#     '0216',
#     '0217',
#     '0218',
#     '0221',
#     '0222',
#     '0223',
#     '0401',
#     '0414',
#     '0415']

# dates = [
#     '0205',
#     '0318',
#     '0324',
#     '0325',
#     '0326',
#     '0327',
#     '0330',
#     '0331',
#     '0402',
#     '0403',
#     '0404',
#     '0406',
#     '0407',
#     '0408',
#     '0410',
#     '0411']

for date in dates:
    target_path = os.path.join(src_root, date)
    # 해당 폴더가 실제로 존재하는지 확인 후 실행 (방어적 프로그래밍)
    if os.path.exists(target_path):
        print(f"Processing: {date}...")
        sort_folder_files(target_path)
    else:
        print(f"Skipped: {date} (Folder not found)")

