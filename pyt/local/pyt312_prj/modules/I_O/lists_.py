import os
import tkinter as tk
from tkinter import filedialog

def l3_filter(list_3, filter_list):
    filtered_list_3 = []
    for list_2 in list_3:
        filtered_list_2 = []
        for item in list_2:
            if item[0] in filter_list:
                filtered_list_2.append(item)
        filtered_list_3.append(filtered_list_2)
    return filtered_list_3

#alpha_filtered = [[item for item in saved_data[0] if item[0] == 'Alpha']]
