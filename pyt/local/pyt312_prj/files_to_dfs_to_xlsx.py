from modules import *
# from modules.I_O.json_csv import extract_json_values

import os
import pandas as pd
import numpy as np
import shutil


#################################################################################################
base_root = r"C:\test\b"
test_root = os.path.join(base_root, "int")
sufficx_type = ".int"
# ref_file_name = "test_P35.xlsx"
PA = "35"


#################################################################################################
os.makedirs(test_root, exist_ok=True)

dfs = load_all_csvs_to_dict_filter([""], sufficx_type, test_root, True)

dfs_Tr = {}
for name, df in dfs.items():
    df_transposed = df.T
    # 2. Reset the index to turn the 'headers' into a regular column
    df_transposed = df_transposed.reset_index()
    
    # 3. Rename that new column to whatever you like (e.g., 'Parameter' or 'Header')
    df_transposed = df_transposed.rename(columns={'index': 'Header'})
    dfs_Tr[name] = df_transposed


#################################################################################################
# ref_file_path = os.path.join(test_root, ref_file_name)

# for sheet_name, df in dfs_Tr.items():
#     xlsx_name = sheet_name.removesuffix(sufficx_type) + ".xlsx"
#     target_file_path = os.path.join(test_root, xlsx_name)
#     shutil.copyfile(ref_file_path, target_file_path)
#     replace_xlsx_sheet_with_df(target_file_path, "signal", df, True)


#################################################################################################
dfs_LM_cau = {}

headers_LM_cau = [
#        ["FormatVersion","1.3.0","","",""],
        ["EquipmentName","","","",""],
        ["EquipmentModel","","","",""],
        ["EquipmentID","Unknown","","",""],
        ["SystemSoftwareVersion","1.0.1","","",""],
        ["AcquisitionTime","45658.04236","","",""],
        ["TaskName","AEliT_SE_Studio","","",""],
        ["LotID","AEliT_SE_Studio","","",""],
        ["WaferID","","","",""],
        ["WaferRecipeName","AEliT_SE_Studio","","",""],
        ["StageRecipeName","AEliT_SE_Studio","","",""],
        ["FilmRecipeName","Ox20A","","",""],
        ["GroupName","g1","","",""],
        ["SiteNumber","0","","",""],
        ["PatternType","NonPattern","","",""],
        ["DieX","0","","",""],
        ["DieY","0","","",""],
        ["WaferX","0","","",""],
        ["WaferY","0","","",""],
        ["EffectiveRangeMin","230","","",""],
        ["EffectiveRangeMax","950","","",""],
        ["FilterPosition","AEliT_SE_Studio","","",""],
        ["MeasurementType","Regular","","",""],
        ["ScanCount","15","","",""],
        ["AOI","67","","",""],
        ["AngularSpread","0.0","","",""],
        ["PolarizerAngle",PA,"","",""],
        ["WavelengthShift","0","","",""],
        ["BandwidthMarginCount","0","","",""],
        ["FilmRecipeType","SE","","",""],
        ["Wavelength","Alpha","Beta","MirrorTanPsi","MirrorDelta"]
    ]

for sheet_name, df in dfs_Tr.items():
    body_name = sheet_name.removesuffix(sufficx_type)
    xlsx_name = body_name + ".xlsx"
    xlsx_path = os.path.join(test_root, xlsx_name)
    df_test = read_xlsx_sheet_to_df2(xlsx_path, "LM_cau")
    df_test_header = replace_first_rows(df_test, headers_LM_cau)
    # df_test_header.columns = df_test_header.iloc[0]
    # df_test_header = df_test_header.iloc[1:].reset_index(drop=True)
    df_test_header.columns = df_test.columns  # Keep original columns after replacement
    target_csv_path = os.path.join(test_root, f"ab_{body_name}.csv")
    export_pandas_data_to_csv(df_test_header, target_csv_path)


#################################################################################################
dfs_results = {}

for sheet_name, df in dfs_Tr.items():
    body_name = sheet_name.removesuffix(sufficx_type)
    xlsx_name = body_name + ".xlsx"
    xlsx_path = os.path.join(test_root, xlsx_name)
    dfs_results[body_name] = read_xlsx_sheet_to_df2(xlsx_path, "results")
header_info = ['b'] + list(dfs_results.keys())
first_row = ['=INDIRECT(B$1 & "!" & "A" & ROW())'] + ['=INDIRECT(B$1 & "!" & $A$1 & ROW())'] + [""] * (len(header_info) - 2)
dfs_results["Summary"] = pd.DataFrame([first_row], columns=header_info)
results_path = os.path.join(test_root, f"results.xlsx.")
export_multiple_dfs_to_excel(dfs_results, True, results_path)


#################################################################################################
print("end")


#existing_keys = list(dfs_results.keys())

#dfs_results["SheetNames"] = pd.DataFrame(existing_keys, columns=["SheetNames"])
#dfs_results["SheetNames"] = pd.DataFrame([existing_keys])
#dfs_results["SheetNames"] = pd.DataFrame([[[""]] * len(existing_keys)], columns=existing_keys)
#dfs_results["SheetNames"] = pd.DataFrame(columns=existing_keys)

# sheet_names = pd.ExcelFile(results_path).sheet_names
# df_sheet_names = pd.DataFrame(sheet_names, columns=["SheetNames"])
# export_pandas_data_to_csv(df_sheet_names, os.path.join(test_root, "results_sheets.csv"))
