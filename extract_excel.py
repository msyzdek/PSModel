#!/usr/bin/env python3
"""Extract detailed calculation structure from PSModel Excel file."""
import zipfile
import xml.etree.ElementTree as ET

xlsx_path = 'docs/PSModel.xlsx'

def get_cell_value(cell, shared_strings):
    """Extract cell value."""
    ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    
    cell_type = cell.get('t', 'n')
    v_elem = cell.find('main:v', ns)
    f_elem = cell.find('main:f', ns)
    
    if f_elem is not None:
        return f"={f_elem.text}"
    elif v_elem is not None:
        if cell_type == 's':
            idx = int(v_elem.text)
            return shared_strings.get(idx, v_elem.text)
        else:
            return v_elem.text
    return ""

def load_shared_strings(zip_ref):
    """Load shared strings table."""
    strings = {}
    try:
        with zip_ref.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            
            for idx, si in enumerate(root.findall('.//main:si', ns)):
                t = si.find('.//main:t', ns)
                if t is not None:
                    strings[idx] = t.text
    except:
        pass
    return strings

with zipfile.ZipFile(xlsx_path, 'r') as zip_ref:
    shared_strings = load_shared_strings(zip_ref)
    
    with zip_ref.open('xl/worksheets/sheet3.xml') as f:
        tree = ET.parse(f)
        root = tree.getroot()
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        
        rows = root.findall('.//main:row', ns)
        
        print("=== Key Calculation Rows (PS Model 2025) ===\n")
        
        # Focus on key rows
        key_rows = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 31, 32, 33, 34, 35, 36]
        
        for row in rows:
            row_num = int(row.get('r'))
            if row_num not in key_rows:
                continue
                
            cells = row.findall('.//main:c', ns)
            
            print(f"\n--- Row {row_num} ---")
            for cell in cells:
                cell_ref = cell.get('r')
                # Only show columns A-G for first month
                col = ''.join([c for c in cell_ref if c.isalpha()])
                if col in ['A', 'B', 'C', 'D', 'E', 'F', 'G']:
                    value = get_cell_value(cell, shared_strings)
                    if value:
                        print(f"  {cell_ref}: {value}")
