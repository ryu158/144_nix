from modules import *
# from modules.I_O.json_csv import extract_json_values

import os
import pandas as pd
import numpy as np
import shutil

base_root = r"Z:\4 Confluence\Ryu\2026\05_03_02(Intensity Drop ratio)"
test_root = os.path.join(base_root, "Merged_JEP1_MNS01_WRM")

os.makedirs(test_root, exist_ok=True)

dfs = load_all_csvs_to_dict_filter(["Slot01"], '.int', test_root, True)

dfs_Tr = {}
for name, df in dfs.items():
    df_transposed = df.T
    # 2. Reset the index to turn the 'headers' into a regular column
    df_transposed = df_transposed.reset_index()
    
    # 3. Rename that new column to whatever you like (e.g., 'Parameter' or 'Header')
    df_transposed = df_transposed.rename(columns={'index': 'Header'})
    dfs_Tr[name] = df_transposed

dfs_Tr_Avg = {}
for name, df_Tr in dfs_Tr.items():
    df_Tr_copy = df_Tr.copy()
    df_Tr_copy.columns = df_Tr_copy.iloc[0, :]
    df_Tr_copy = df_Tr_copy.drop(df_Tr_copy.index[0])
    df_Tr_avgs = pd.DataFrame(index=df_Tr_copy.index)

    for i in list(range(1,9,1)):
        s_indices = list(range(i, 40, 8))
        s_avg = df_Tr_copy.iloc[:, s_indices].apply(pd.to_numeric, errors='coerce').mean(axis=1)
        df_Tr_avgs[f'S{i-1}_avg'] = s_avg

    i_0 = df_Tr_avgs.sum(axis=1)
    df_Tr_avgs.insert(0, 'I_0', i_0)

    df_Tr_avgs[''] = np.nan
    df_final = pd.concat([df_Tr_avgs, df_Tr_copy.iloc[:, :]], axis=1)
    dfs_Tr_Avg[name] = df_final


export_multiple_dfs_to_excel(dfs_Tr_Avg, True)

print("end")

    # s0_avg = df_Tr_copy['S0'].mean(axis=1)
    # df_Tr_copy.insert(0, 'S0_avg', s0_avg)

    # df_check_c = df_Tr_copy['S0']

# indices = list(range(1, 40, 8))


    # avg_series = df_Tr.iloc[:, [1, 9, 17, 25, 33]]

    # df_avg = pd.DataFrame({
    #     'Header': df_Tr.iloc[:, 0], # Keeps your 'Header' column from the previous step
    #     'Average': avg_series
    # })
